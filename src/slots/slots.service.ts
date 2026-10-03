import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SlotsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAvailableSlots() {
    return this.prisma.slot.findMany({
      where: {
        bookings: {
          none: {
            status: 'active',
          },
        },
      },
      orderBy: [{ startsAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        startsAt: true,
        endsAt: true,
      },
    });
  }
}
