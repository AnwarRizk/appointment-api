import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  namespace: '/',
  path: '/socket.io',
})
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  emitSlotBooked(booking: { id: string; slotId: string }) {
    this.server.emit('slot.booked', {
      bookingId: booking.id,
      slotId: booking.slotId,
    });
  }

  emitSlotReleased(booking: { id: string; slotId: string }) {
    this.server.emit('slot.released', {
      bookingId: booking.id,
      slotId: booking.slotId,
    });
  }
}
