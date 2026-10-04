import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({
    example: 'John Doe',
    description: 'Customer full name.',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @IsNotEmpty()
  customerName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'Customer email address.',
  })
  @Transform(({ value }) => value?.trim())
  @IsEmail()
  customerEmail: string;

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
    description: 'ID of the appointment slot to book.',
  })
  @IsUUID()
  slotId: string;
}
