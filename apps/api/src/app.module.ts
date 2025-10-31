import { Module } from "@nestjs/common";
import { ScheduleModule } from "@nestjs/schedule";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { ListingsModule } from "./listings/listings.module";
import { PrismaModule } from "./prisma/prisma.module";
import { MessagesModule } from "./messages/messages.module";
import { AuctionsModule } from "./auctions/auctions.module";
import { AuthModule } from "./auth/auth.module";

@Module({
  imports: [AuctionsModule, MessagesModule, PrismaModule, AuthModule, ListingsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

