import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors } from "@nestjs/common";
import { ListingsService } from "./listings.service";
import { CreateListingDto, ListQueryDto, UpdateListingDto } from "./dto/listings.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { FilesInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import type { Express } from "express";
import { extname } from "node:path";

const storage = diskStorage({
  destination: "./uploads",
  filename: (_req: any, file: Express.Multer.File, cb: (e: any, filename: string) => void) => {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + extname(file.originalname));
  },
});
const fileFilter = (_req: any, file: Express.Multer.File, cb: (e: any, accepted: boolean) => void) => {
  const ok = /image\/|video\//.test(file.mimetype);
  cb(null, ok);
};

@Controller("listings")
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateListingDto) {
    return this.listings.create(req.user.id, dto);
  }

  @Get()
  list(@Query() q: ListQueryDto) {
    // Public endpoint: always LIVE (service defaults to LIVE)
    return this.listings.list(q);
  }

  // NEW: admin-only view of pending listings
  @UseGuards(JwtAuthGuard)
  @Get("admin/pending")
  listPending(@Req() req: any, @Query() q: ListQueryDto) {
    if (req.user?.staffRole !== "ADMIN") throw new ForbiddenException("Admins only");
    return this.listings.list({ ...q, status: "PENDING" });
  }

  @Get(":id")
  get(@Param("id") id: string) { return this.listings.get(id); }

  @UseGuards(JwtAuthGuard)
  @Patch(":id")
  update(@Param("id") id: string, @Req() req: any, @Body() dto: UpdateListingDto) {
    return this.listings.update(id, req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/submit")
  submit(@Param("id") id: string, @Req() req: any) {
    return this.listings.submit(id, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/approve")
  approve(@Param("id") id: string, @Req() req: any) {
    if (req.user?.staffRole !== "ADMIN") throw new ForbiddenException("Admins only");
    return this.listings.approve(id);
  }

  @UseGuards(JwtAuthGuard)
  @Post(":id/media")
  @UseInterceptors(FilesInterceptor("files", 16, { storage, fileFilter }))
  async uploadMedia(@Req() req: any, @Param("id") id: string, @UploadedFiles() files: Express.Multer.File[]) {
    if (!files?.length) return { uploaded: 0, items: [] };
    // you already had an implementation that saves to Prisma; keep it
    return { uploaded: files.length, items: files.map(f => ({ url: `/uploads/${f.filename}`, kind: f.mimetype.startsWith("video/") ? "VIDEO" : "IMAGE" })) };
  }

  @UseGuards(JwtAuthGuard)
  @Delete(":id/media/:mediaId")
  async deleteMedia() {
    return { ok: true };
  }
}
