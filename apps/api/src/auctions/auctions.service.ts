import { Injectable, Logger, BadRequestException, NotFoundException } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { AuctionStatus, Bid } from "@prisma/client";

@Injectable()
export class AuctionsService {
  private readonly logger = new Logger(AuctionsService.name);

  constructor(private prisma: PrismaService) {}

  // --- CRON JOBS ---

  @Cron(CronExpression.EVERY_MINUTE)
  async handleScheduledAuctions() {
    this.logger.log("Checking for auctions to start...");
    const now = new Date();
    const auctionsToStart = await this.prisma.auction.findMany({
      where: {
        status: "SCHEDULED",
        startAt: { lte: now },
      },
    });

    for (const auction of auctionsToStart) {
      await this.prisma.auction.update({
        where: { id: auction.id },
        data: { status: "LIVE" },
      });
      this.logger.log(`Auction ${auction.id} is now LIVE`);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleEndedAuctions() {
    this.logger.log("Checking for auctions to end...");
    const now = new Date();
    const auctionsToEnd = await this.prisma.auction.findMany({
      where: {
        status: "LIVE",
        endAt: { lte: now },
      },
    });

    for (const auction of auctionsToEnd) {
      await this.prisma.auction.update({
        where: { id: auction.id },
        data: { status: "ENDED" },
      });
      this.logger.log(`Auction ${auction.id} has ENDED`);
      // TODO: Email winner / seller
    }
  }

  // --- PUBLIC METHODS ---

  async getAuctionDetails(auctionId: string) {
    const auction = await this.prisma.auction.findUnique({
      where: { id: auctionId },
      include: {
        bids: {
          orderBy: { createdAt: "desc" },
          include: { user: { select: { email: true } } },
        },
      },
    });

    if (!auction) throw new NotFoundException("Auction not found");

    const highBid = auction.bids[0];
    const reserveMet =
      auction.reserveCents && highBid
        ? highBid.amountCents >= auction.reserveCents
        : false;

    return {
      id: auction.id,
      status: auction.status,
      startAt: auction.startAt,
      endAt: auction.endAt,
      buyNowCents: auction.buyNowCents,
      reserveMet,
      currentPriceCents: highBid?.amountCents ?? 0,
      totalBids: auction.bids.length,
      highBidderEmail: highBid?.user.email, // Mask this later (e.g., "j***n@g...l.com")
    };
  }

  async placeBid(opts: {
    auctionId: string;
    userId: string;
    maxBidAmount: number; // This is their PROXY bid
  }) {
    const { auctionId, userId, maxBidAmount } = opts;

    const auction = await this.prisma.auction.findFirst({
      where: { id: auctionId, status: "LIVE" },
      include: { bids: { orderBy: { amountCents: "desc" } } },
    });

    if (!auction) throw new BadRequestException("Auction is not live or does not exist.");
    if (new Date() > auction.endAt) throw new BadRequestException("Auction has ended.");

    const highBid = auction.bids[0];
    const currentPrice = highBid?.amountCents ?? 0;
    const highBidderId = highBid?.userId;

    if (userId === highBidderId) {
      throw new BadRequestException("You are already the high bidder.");
    }

    if (maxBidAmount <= currentPrice) {
      throw new BadRequestException("Bid must be higher than the current price.");
    }

    // --- Core Proxy Logic ---
    let newCurrentPrice = currentPrice;
    const increment = 10000; // $100 increment (you can make this dynamic later)

    if (highBid) {
      const highBidderMax = highBid.proxyMaxCents ?? highBid.amountCents;

      if (maxBidAmount > highBidderMax) {
        // New bidder wins the proxy war
        newCurrentPrice = Math.min(maxBidAmount, highBidderMax + increment);
      } else {
        // High bidder's proxy wins
        newCurrentPrice = Math.min(highBidderMax, maxBidAmount + increment);
      }
    } else {
      // This is the first bid
      newCurrentPrice = Math.min(maxBidAmount, 0 + increment); // Assumes starting bid is 0
    }
    // --- End Logic ---

    // Create the new bid
    await this.prisma.bid.create({
      data: {
        auctionId: auctionId,
        userId: userId,
        amountCents: newCurrentPrice, // The *actual* current price
        proxyMaxCents: maxBidAmount,  // The user's *max* bid
      },
    });

    // --- Soft-Close / Anti-Sniping ---
    const now = new Date();
    const softCloseSeconds = 120; // 2 minutes
    const timeRemainingMs = auction.endAt.getTime() - now.getTime();

    if (timeRemainingMs < softCloseSeconds * 1000) {
      const newEndTime = new Date(now.getTime() + softCloseSeconds * 1000);
      await this.prisma.auction.update({
        where: { id: auctionId },
        data: { endAt: newEndTime },
      });
      this.logger.log(`Auction ${auctionId} extended to ${newEndTime.toISOString()}`);
    }
    // --- End Soft-Close ---

    return this.getAuctionDetails(auctionId);
  }
}