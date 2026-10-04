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
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';

import { ErrorResponseWrapperDto } from '../common/dto/error-response.dto';
import { BookingResponseDto } from './dto/booking-response.dto';

@ApiTags('Bookings')
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @ApiCreatedResponse({
    description: 'Booking created successfully.',
    type: BookingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid JSON or invalid/missing request fields.',
    schema: {
      example: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The request contains invalid or missing fields.',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'The requested slot does not exist.',
    schema: {
      example: {
        error: {
          code: 'SLOT_NOT_FOUND',
          message: 'The requested slot does not exist.',
        },
      },
    },
  })
  @ApiConflictResponse({
    description: 'The requested slot already has an active booking.',
    schema: {
      example: {
        error: {
          code: 'SLOT_UNAVAILABLE',
          message: 'This slot already has an active booking.',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'An unexpected server error occurred.',
    schema: {
      example: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        },
      },
    },
  })
  @Post()
  create(@Body() createBookingDto: CreateBookingDto) {
    return this.bookingsService.create(createBookingDto);
  }

  @ApiParam({
    name: 'bookingId',
    description: 'ID of the booking to cancel.',
    format: 'uuid',
    example: 'ede1b2d5-f045-4799-9431-66eae780dd6b',
  })
  @ApiOkResponse({
    description: 'Booking cancelled successfully.',
    type: BookingResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'The booking ID must be a valid UUID.',
    schema: {
      example: {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The booking ID must be a valid UUID.',
        },
      },
    },
  })
  @ApiNotFoundResponse({
    description: 'The requested booking does not exist.',
    schema: {
      example: {
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'The requested booking does not exist.',
        },
      },
    },
  })
  @ApiInternalServerErrorResponse({
    description: 'An unexpected server error occurred.',
    schema: {
      example: {
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred.',
        },
      },
    },
  })
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
