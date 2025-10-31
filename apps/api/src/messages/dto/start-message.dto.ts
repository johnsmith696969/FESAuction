import { IsOptional, IsString } from "class-validator";

export class StartMessageDto {
  @IsOptional() @IsString() toUserId?: string;
  @IsOptional() @IsString() listingId?: string;
  @IsString() subject!: string;
  @IsString() body!: string;
}