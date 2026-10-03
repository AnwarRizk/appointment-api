import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @Delete(':bookingId')
  cancel(
    @Param(
      'bookingId',
      new ParseUUIDPipe({
        exceptionFactory: () =>
          new BadRequestException({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'The booking ID must be a valid UUID.',
            },
          }),
      }),
    )
    bookingId: string,
  ) {
    return this.bookingsService.cancel(bookingId);
  }
}
