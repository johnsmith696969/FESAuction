import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateListingDto, ListQueryDto, UpdateListingDto } from "./dto/listings.dto";

@Injectable()
export class ListingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateListingDto) {
    return this.prisma.listing.create({
      data: { ...dto, type: dto.type as any, userId, status: "DRAFT" }
    });
  }

  async list(q: ListQueryDto) {
    const {
      category, make, type,
      minYear, maxYear, minPrice, maxPrice,
      minHours, maxHours,
      state, sort, status,
      page = 1, pageSize = 24
    } = q;

    const where: any = {
      ...(status ? { status } : { status: "LIVE" }),
      ...(category ? { category } : {}),
      ...(make ? { make } : {}),
      ...(type ? { type: type as any } : {}),
      ...(state ? { location: { contains: state, mode: "insensitive" } } : {}),
      ...(minYear || maxYear ? { year: { gte: minYear ?? undefined, lte: maxYear ?? undefined } } : {}),
      ...(minPrice || maxPrice ? { priceCents: { gte: minPrice ?? undefined, lte: maxPrice ?? undefined } } : {}),
      ...(minHours || maxHours ? { hours: { gte: minHours ?? undefined, lte: maxHours ?? undefined } } : {}),
    };

    let orderBy: any = { createdAt: "desc" };
    if (sort === "PRICE_ASC")   orderBy = { priceCents: "asc" };
    if (sort === "PRICE_DESC")  orderBy = { priceCents: "desc" };
    if (sort === "YEAR_DESC")   orderBy = { year: "desc" };
    if (sort === "YEAR_ASC")    orderBy = { year: "asc" };
    if (sort === "HOURS_ASC")   orderBy = { hours: "asc" };
    if (sort === "HOURS_DESC")  orderBy = { hours: "desc" };

    const skip = (page - 1) * pageSize;
    const [items, total] = await Promise.all([
      this.prisma.listing.findMany({
        where, orderBy, skip, take: pageSize,
        include: { media: true, dealer: true, user: true }
      }),
      this.prisma.listing.count({ where })
    ]);

    return { items, total, page, pageSize };
  }

  async get(id: string) {
    return this.prisma.listing.findUnique({
      where: { id },
      include: { media: true, dealer: true, user: true, auction: true }
    });
  }

  async update(id: string, _userId: string, dto: UpdateListingDto) {
    return this.prisma.listing.update({ where: { id }, data: { ...dto } });
  }

  async submit(id: string, _userId: string) {
    return this.prisma.listing.update({ where: { id }, data: { status: "PENDING" } });
  }

  async approve(id: string) {
    return this.prisma.listing.update({ where: { id }, data: { status: "LIVE" } });
  }
}


