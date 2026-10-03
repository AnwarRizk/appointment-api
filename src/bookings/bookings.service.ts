import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createBookingDto: CreateBookingDto) {
    const slot = await this.prisma.slot.findUnique({
      where: {
        id: createBookingDto.slotId,
      },
    });

    if (!slot) {
      throw new NotFoundException({
        error: {
          code: 'SLOT_NOT_FOUND',
          message: 'The requested slot does not exist.',
        },
      });
    }

    try {
      return await this.prisma.booking.create({
        data: {
          slotId: createBookingDto.slotId,
          customerName: createBookingDto.customerName,
          customerEmail: createBookingDto.customerEmail,
          status: 'active',
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException({
          error: {
            code: 'SLOT_UNAVAILABLE',
            message: 'This slot already has an active booking.',
          },
        });
      }

      throw error;
    }
  }

  async cancel(bookingId: string) {
    const result = await this.prisma.booking.updateMany({
      where: {
        id: bookingId,
        status: 'active',
      },
      data: {
        status: 'cancelled',
      },
    });

    if (result.count === 1) {
      return this.prisma.booking.findUnique({
        where: {
          id: bookingId,
        },
      });
    }

    const booking = await this.prisma.booking.findUnique({
      where: {
        id: bookingId,
      },
    });

    if (!booking) {
      throw new NotFoundException({
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'The requested booking does not exist.',
        },
      });
    }

    return booking;
  }
}
