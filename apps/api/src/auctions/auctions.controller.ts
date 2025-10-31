import { Controller, Get, Post, Param, Body, UseGuards, Req, BadRequestException } from "@nestjs/common";
import { AuctionsService } from "./auctions.service";
import { JwtAuthGuard } from "../auth/jwt.guard";

@Controller("auctions")
export class AuctionsController {
  constructor(private readonly auctionsService: AuctionsService) {}

  // Get a single auction's details (for the widget)
  @Get(":id")
  getAuctionDetails(@Param("id") id: string) {
    return this.auctionsService.getAuctionDetails(id);
  }

  // Place a bid (protected)
  @UseGuards(JwtAuthGuard)
  @Post(":id/bids")
  placeBid(
    @Param("id") auctionId: string,
    @Req() req: any,
    @Body() body: { amountCents: number }
  ) {
    if (!body.amountCents || body.amountCents <= 0) {
      throw new BadRequestException("Invalid bid amount");
    }
    return this.auctionsService.placeBid({
      auctionId,
      userId: req.user.userId, // From JWT
      maxBidAmount: body.amountCents,
    });
  }
}