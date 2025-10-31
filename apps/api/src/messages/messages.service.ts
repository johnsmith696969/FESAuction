import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class MessagesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Throws if the user is not a participant of the thread
   */
  private async ensureParticipant(threadId: string, userId: string) {
    // requires @@unique([threadId, userId]) on ThreadParticipant
    const p = await this.prisma.threadParticipant.findUnique({
      where: { threadId_userId: { threadId, userId } },
    });
    if (!p) throw new ForbiddenException("Not a participant");
  }

  /**
   * Start a new thread with either a target user, or the listing owner.
   */
  async startThread(opts: {
    fromUserId: string;
    toUserId?: string;
    listingId?: string;
    subject: string;
    body: string;
  }) {
    let toUserId = opts.toUserId;

    if (!toUserId && opts.listingId) {
      const listing = await this.prisma.listing.findUnique({
        where: { id: opts.listingId },
        select: { userId: true },
      });
      if (!listing) throw new NotFoundException("Listing not found");
      toUserId = listing.userId;
      if (toUserId === opts.fromUserId) {
        throw new BadRequestException("Cannot message yourself");
      }
    }
    if (!toUserId) {
      throw new BadRequestException("toUserId or listingId required");
    }

    // NOTE:
    // - Your generated client exposes the relation on MessageThread as "Message" (capital M)
    // - MessageCreateInput expects scalar "senderId" (not sender: { connect: ... })
    const thread = await this.prisma.messageThread.create({
      data: {
        subject: opts.subject,
        listingId: opts.listingId ?? null,
        participants: {
          create: [
            { lastReadAt: new Date(), user: { connect: { id: opts.fromUserId } } },
            { lastReadAt: null,       user: { connect: { id: toUserId } } },
          ],
        },
        Message: {
          create: [{ body: opts.body, senderId: opts.fromUserId }],
        },
      },
    });

    return thread;
  }

  /**
   * Reply to a thread and mark the sender as read. Also bump thread.updatedAt.
   */
  async reply(opts: { threadId: string; senderId: string; body: string }) {
    await this.ensureParticipant(opts.threadId, opts.senderId);

    await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          threadId: opts.threadId,
          body: opts.body,
          senderId: opts.senderId,
        },
      }),
      this.prisma.threadParticipant.update({
        where: { threadId_userId: { threadId: opts.threadId, userId: opts.senderId } },
        data: { lastReadAt: new Date() },
      }),
      // touch the thread so list ordering by updatedAt is fresh
      this.prisma.messageThread.update({
        where: { id: opts.threadId },
        data: { updatedAt: new Date() },
      }),
    ]);

    return { ok: true };
  }

  /**
   * Mark a thread as read for the current user.
   */
  async markRead(opts: { threadId: string; userId: string }) {
    await this.ensureParticipant(opts.threadId, opts.userId);
    await this.prisma.threadParticipant.update({
      where: { threadId_userId: { threadId: opts.threadId, userId: opts.userId } },
      data: { lastReadAt: new Date() },
    });
    return { ok: true };
  }

  /**
   * List threads visible to the user (with latest message preview).
   */
  async listThreads(userId: string) {
    const threads = await this.prisma.messageThread.findMany({
      where: { participants: { some: { userId } } },
      include: {
        // IMPORTANT: "Message" (capital M) aligns with your current Prisma client
        Message: { orderBy: { createdAt: "desc" }, take: 1 },
        listing: { select: { id: true, title: true } },
        participants: { include: { user: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });

    return threads.map((t) => {
      const last = (t as any).Message?.[0];
      const me = t.participants.find((p) => p.userId === userId);
      return {
        threadId: t.id,
        subject: t.subject,
        listing: t.listing ? { id: t.listing.id, title: t.listing.title } : null,
        lastMessageAt: last?.createdAt ?? t.createdAt,
        lastMessagePreview: last?.body?.slice(0, 160) ?? "",
        unread: !!(last && (!me?.lastReadAt || me.lastReadAt < last.createdAt)),
        participants: t.participants.map((tp) => ({
          id: tp.userId,
          email: tp.user?.email ?? "",
        })),
      };
    });
  }

  /**
   * Full thread with participants and messages.
   */
  async getThread(opts: { threadId: string; userId: string }) {
    await this.ensureParticipant(opts.threadId, opts.userId);
    const t = await this.prisma.messageThread.findUnique({
      where: { id: opts.threadId },
      include: {
        listing: { select: { id: true, title: true } },
        participants: { include: { user: true } },
        // IMPORTANT: "Message" (capital M)
        Message: {
          orderBy: { createdAt: "asc" },
          include: { sender: { select: { id: true, email: true } } },
        },
      },
    });
    if (!t) throw new NotFoundException("Thread not found");
    return t;
  }
}
