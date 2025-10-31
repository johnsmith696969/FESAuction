import { IsEnum, IsInt, IsOptional, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export enum ListingTypeDto {
  CLASSIFIED = "CLASSIFIED",
  AUCTION = "AUCTION",
  AUCTION_BIN = "AUCTION_BIN",
}

export class CreateListingDto {
  @IsEnum(ListingTypeDto) type: ListingTypeDto;
  @IsString() title: string;
  @IsString() description: string;
  @IsString() category: string;

  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;

  @IsOptional() @Type(() => Number) @IsInt() year?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) hours?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceCents?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() stockNumber?: string;
}

export class UpdateListingDto {
  @IsOptional() @IsEnum(ListingTypeDto) type?: ListingTypeDto;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() category?: string;

  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() model?: string;

  @IsOptional() @Type(() => Number) @IsInt() year?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) hours?: number;

  @IsOptional() @Type(() => Number) @IsInt() @Min(0) priceCents?: number;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() stockNumber?: string;
}

export class ListQueryDto {
  @IsOptional() @IsString() category?: string;
  @IsOptional() @IsString() make?: string;
  @IsOptional() @IsString() type?: "CLASSIFIED"|"AUCTION"|"AUCTION_BIN";

  @IsOptional() @Type(() => Number) @IsInt() minYear?: number;
  @IsOptional() @Type(() => Number) @IsInt() maxYear?: number;

  @IsOptional() @Type(() => Number) @IsInt() minPrice?: number;
  @IsOptional() @Type(() => Number) @IsInt() maxPrice?: number;

  @IsOptional() @Type(() => Number) @IsInt() minHours?: number;
  @IsOptional() @Type(() => Number) @IsInt() maxHours?: number;

  @IsOptional() @IsString() state?: string;

  // NEW: allow filtering by status (used by admin pending endpoint)
  @IsOptional() @IsString() status?: "DRAFT"|"PENDING"|"LIVE";

  @IsOptional() @IsString()
  sort?: "NEWEST"|"PRICE_ASC"|"PRICE_DESC"|"YEAR_DESC"|"YEAR_ASC"|"HOURS_ASC"|"HOURS_DESC";

  @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @IsOptional() @Type(() => Number) @IsInt() pageSize?: number;
}
