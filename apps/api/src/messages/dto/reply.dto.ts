import { IsString } from "class-validator";
export class ReplyDto { @IsString() body!: string; }