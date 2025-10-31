import { IsEmail, IsIn, IsOptional, IsString, MinLength } from "class-validator";

export type AccountTypeString = "FREE" | "INDIVIDUAL_SELLER" | "DEALER" | "PRO_DEALER";

export class RegisterDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(6) password!: string;
  @IsOptional() @IsIn(["FREE","INDIVIDUAL_SELLER","DEALER","PRO_DEALER"] as const) accountType?: AccountTypeString;
}

export class LoginDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}
