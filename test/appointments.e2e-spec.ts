import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Appointments API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);
  });

  beforeEach(async () => {
    await prisma.booking.deleteMany();
  });

  afterAll(async () => {
    await app.close();
  });

  // Test to ensure that a booking can be created successfully and the slot is removed from available slots
  it('should create a booking successfully and remove the slot from available slots', async () => {
    const slotId = '11111111-1111-4111-8111-111111111111';

    const bookingResponse = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        slotId,
      })
      .expect(201);

    expect(bookingResponse.body).toMatchObject({
      slotId,
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      status: 'active',
    });

    expect(bookingResponse.body.id).toEqual(expect.any(String));

    const slotsResponse = await request(app.getHttpServer())
      .get('/slots')
      .expect(200);

    expect(
      slotsResponse.body.some((slot: { id: string }) => slot.id === slotId),
    ).toBe(false);
  });

  // Test to ensure that only one booking can be created for a slot when two requests are sent concurrently
  it('should allow only one booking when two requests are sent concurrently', async () => {
    const slotId = '22222222-2222-4222-8222-222222222222';

    const [first, second] = await Promise.all([
      request(app.getHttpServer()).post('/bookings').send({
        customerName: 'User One',
        customerEmail: 'one@example.com',
        slotId,
      }),

      request(app.getHttpServer()).post('/bookings').send({
        customerName: 'User Two',
        customerEmail: 'two@example.com',
        slotId,
      }),
    ]);

    const statuses = [first.status, second.status].sort();

    expect(statuses).toEqual([201, 409]);

    const activeBookings = await prisma.booking.findMany({
      where: {
        slotId,
        status: 'active',
      },
    });

    expect(activeBookings).toHaveLength(1);

    const bookings = await request(app.getHttpServer())
      .get('/slots')
      .expect(200);

    expect(
      bookings.body.some((slot: { id: string }) => slot.id === slotId),
    ).toBe(false);
  });

  // Test to ensure that a booking can be canceled, the slot becomes available again, and it can be booked again
  it('should cancel a booking, make the slot available, and allow it to be booked again', async () => {
    const slotId = '33333333-3333-4333-8333-333333333333';

    const bookingResponse = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        slotId,
      })
      .expect(201);

    const bookingId = bookingResponse.body.id;

    await request(app.getHttpServer())
      .delete(`/bookings/${bookingId}`)
      .expect(200);

    const slotsResponse = await request(app.getHttpServer())
      .get('/slots')
      .expect(200);

    expect(
      slotsResponse.body.some((slot: { id: string }) => slot.id === slotId),
    ).toBe(true);

    const secondBooking = await request(app.getHttpServer())
      .post('/bookings')
      .send({
        customerName: 'Another User',
        customerEmail: 'another@example.com',
        slotId,
      })
      .expect(201);

    expect(secondBooking.body.slotId).toBe(slotId);
    expect(secondBooking.body.status).toBe('active');
  });
});
