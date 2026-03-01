import { IsEmail, IsString, MinLength } from "class-validator";

export class RegisterDto {
  @IsString()
  institutionId!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(10)
  password!: string;
}
