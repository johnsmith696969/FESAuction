import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { MessagesService } from "./messages.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { StartMessageDto } from "./dto/start-message.dto";
import { ReplyDto } from "./dto/reply.dto";

@UseGuards(JwtAuthGuard)
@Controller("messages")
export class MessagesController {
  constructor(private svc: MessagesService) {}

  @Get("threads")
  async threads(@Req() req: any) {
    return this.svc.listThreads(req.user.id);
  }

  @Get("threads/:id")
  async thread(@Req() req: any, @Param("id") id: string) {
    return this.svc.getThread({ threadId: id, userId: req.user.id });
  }

  @Post("start")
  async start(@Req() req: any, @Body() dto: StartMessageDto) {
    const t = await this.svc.startThread({
      fromUserId: req.user.id,
      toUserId: dto.toUserId,
      listingId: dto.listingId,
      subject: dto.subject,
      body: dto.body,
    });
    return { threadId: t.id };
  }

  @Post("threads/:id/reply")
  async reply(@Req() req: any, @Param("id") id: string, @Body() dto: ReplyDto) {
    await this.svc.reply({ threadId: id, senderId: req.user.id, body: dto.body });
    return { ok: true };
  }

  @Post("threads/:id/read")
  async read(@Req() req: any, @Param("id") id: string) {
    await this.svc.markRead({ threadId: id, userId: req.user.id });
    return { ok: true };
  }
}