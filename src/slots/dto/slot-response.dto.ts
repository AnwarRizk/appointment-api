import { ApiProperty } from '@nestjs/swagger';

export class SlotResponseDto {
  @ApiProperty({
    format: 'uuid',
    example: '11111111-1111-4111-8111-111111111111',
  })
  id: string;

  @ApiProperty({
    format: 'date-time',
    example: '2030-01-15T09:00:00.000Z',
  })
  startsAt: Date;

  @ApiProperty({
    format: 'date-time',
    example: '2030-01-15T10:00:00.000Z',
  })
  endsAt: Date;
}
