import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CreateBookingDto {
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @Transform(({ value }) => value?.trim())
  @IsEmail()
  customerEmail: string;

  @IsUUID()
  slotId: string;
}
