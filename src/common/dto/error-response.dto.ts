import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({
    example: 'SLOT_UNAVAILABLE',
  })
  code: string;

  @ApiProperty({
    example: 'This slot already has an active booking.',
  })
  message: string;
}

export class ErrorResponseWrapperDto {
  @ApiProperty({
    type: ErrorResponseDto,
  })
  error: ErrorResponseDto;
}
