import { ApiProperty } from '@nestjs/swagger';

export class BookingResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: 'ede1b2d5-f045-4799-9431-66eae780dd6b',
  })
  id: string;

  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  slotId: string;

  @ApiProperty({
    example: 'John Doe',
  })
  customerName: string;

  @ApiProperty({
    example: 'john.doe@example.com',
  })
  customerEmail: string;

  @ApiProperty({
    enum: ['active', 'cancelled'],
    example: 'active',
  })
  status: string;
}
