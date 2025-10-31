import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service";
import { AuthController } from "./auth.controller";
import { JwtStrategy } from "./jwt.strategy";

const EXPIRES_IN_SECONDS =
  process.env.JWT_EXPIRES_IN && !Number.isNaN(Number(process.env.JWT_EXPIRES_IN))
    ? Number(process.env.JWT_EXPIRES_IN)
    : 60 * 60 * 24 * 7; // 7 days

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: EXPIRES_IN_SECONDS },
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
