import { Injectable, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcryptjs";
import { LoginDto, RegisterDto } from "./dto/auth.dto";

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwt: JwtService) {}

  private sign(user: { id: string; email: string; accountType: string; staffRole?: string | null }) {
    const payload: any = { sub: user.id, email: user.email, accountType: user.accountType };
    if (user.staffRole) payload.role = user.staffRole; // only staff include role=ADMIN
    return this.jwt.sign(payload);
  }

  async register(dto: RegisterDto) {
    const exists = await this.prisma.user.findUnique({ where: { email: (dto as any).email } });
    if (exists) throw new BadRequestException("Email already registered");

    const hash = await bcrypt.hash((dto as any).password, 10);
    // Accept upcoming DTO name (accountType) but default to FREE to work with your current DTO too
    const accountType = ((dto as any).accountType ?? "FREE") as any;

    const user = await this.prisma.user.create({
      data: { email: (dto as any).email, passwordHash: hash, accountType },
    });

    return {
      access_token: this.sign(user),
      user: { id: user.id, email: user.email, accountType: user.accountType, isAdmin: !!user.staffRole },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({ where: { email: (dto as any).email } });
    if (!user) throw new UnauthorizedException("Invalid credentials");

    const ok = await bcrypt.compare((dto as any).password, user.passwordHash);
    if (!ok) throw new UnauthorizedException("Invalid credentials");

    return {
      access_token: this.sign(user),
      user: { id: user.id, email: user.email, accountType: user.accountType, isAdmin: !!user.staffRole },
    };
  }

  async me(userCtx: { userId: string }) {
    const u = await this.prisma.user.findUnique({ where: { id: userCtx.userId } });
    if (!u) throw new UnauthorizedException();
    return { id: u.id, email: u.email, accountType: u.accountType, isAdmin: !!u.staffRole };
  }
}
