# Appointment API

A RESTful appointment booking API built with **NestJS, PostgreSQL, Prisma, and Socket.IO**.

The API manages appointment slots and bookings, prevents double-booking under concurrent requests, and broadcasts real-time booking/release events.

## Tech Stack

- **NestJS**
- **TypeScript**
- **PostgreSQL**
- **Prisma ORM**
- **Socket.IO**
- **Swagger / OpenAPI**
- **Jest + Supertest**
- **Node.js**

---

## Features

- List available appointment slots
- Create bookings
- Cancel bookings
- Prevent double-booking under concurrent requests
- Real-time Socket.IO events
- UUID-based IDs
- UTC ISO 8601 timestamps
- Request validation
- Consistent API error responses
- OpenAPI documentation
- Integration tests using a real PostgreSQL database

---

## Requirements

Make sure you have:

- Node.js 22+
- npm
- PostgreSQL 16+
- Git

---

## Installation

Clone the repository and install dependencies:

```bash
git clone <repository-url>
cd appointment-api
npm install
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
DATABASE_URL="postgresql://appointment_user:appointment_password@localhost:5432/appointment_api"
```

Do not commit the `.env` file.

A `.env.example` file is included in the project:

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME"
```

---

## Database Setup

Create the PostgreSQL database and user, then configure `DATABASE_URL`.

Apply the Prisma migrations:

```bash
npx prisma migrate deploy
```

Seed the database with the fixed appointment slots:

```bash
npx prisma db seed
```

The seed creates the following slots:

| Slot                                   | Start     | End       |
| -------------------------------------- | --------- | --------- |
| `11111111-1111-4111-8111-111111111111` | 09:00 UTC | 10:00 UTC |
| `22222222-2222-4222-8222-222222222222` | 10:00 UTC | 11:00 UTC |
| `33333333-3333-4333-8333-333333333333` | 11:00 UTC | 12:00 UTC |
| `44444444-4444-4444-8444-444444444444` | 13:00 UTC | 14:00 UTC |

---

## Running the Application

Development mode:

```bash
npm run start:dev
```

The API will be available at:

```text
http://localhost:3000
```

---

## API Documentation

Interactive Swagger documentation:

```text
http://localhost:3000/docs
```

OpenAPI JSON:

```text
http://localhost:3000/openapi.json
```

The OpenAPI documentation includes:

- Request and response schemas
- Required fields
- UUID and date-time formats
- Validation requirements
- Success responses
- Error responses
- HTTP status codes
- Error examples
- Cancellation behavior

No authentication is required.

---

## API Endpoints

### Get Available Slots

```http
GET /slots
```

Returns only slots that do not currently have an active booking.

Results are ordered by:

1. `startsAt` ascending
2. `id` ascending

Example response:

```json
[
  {
    "id": "11111111-1111-4111-8111-111111111111",
    "startsAt": "2030-01-15T09:00:00.000Z",
    "endsAt": "2030-01-15T10:00:00.000Z"
  }
]
```

---

### Create Booking

```http
POST /bookings
Content-Type: application/json
```

Request:

```json
{
  "customerName": "John Doe",
  "customerEmail": "john.doe@example.com",
  "slotId": "11111111-1111-4111-8111-111111111111"
}
```

The API:

- Trims the customer name and email
- Requires a non-empty customer name
- Validates the email address
- Validates the slot UUID
- Verifies that the slot exists
- Prevents multiple active bookings for the same slot

Successful response:

```json
{
  "id": "ede1b2d5-f045-4799-9431-66eae780dd6b",
  "slotId": "11111111-1111-4111-8111-111111111111",
  "customerName": "John Doe",
  "customerEmail": "john.doe@example.com",
  "status": "active"
}
```

Possible errors:

| Status | Code               | Meaning                            |
| ------ | ------------------ | ---------------------------------- |
| 400    | `VALIDATION_ERROR` | Invalid or missing request fields  |
| 404    | `SLOT_NOT_FOUND`   | Slot does not exist                |
| 409    | `SLOT_UNAVAILABLE` | Slot already has an active booking |
| 500    | `INTERNAL_ERROR`   | Unexpected server error            |

---

### Cancel Booking

```http
DELETE /bookings/:bookingId
```

Example:

```http
DELETE /bookings/ede1b2d5-f045-4799-9431-66eae780dd6b
```

Cancelling an active booking changes its status from `active` to `cancelled`.

The slot then becomes available again.

Cancelling an already cancelled booking is idempotent and returns the existing booking without emitting another `slot.released` event.

Possible errors:

| Status | Code                | Meaning                 |
| ------ | ------------------- | ----------------------- |
| 400    | `VALIDATION_ERROR`  | Invalid booking UUID    |
| 404    | `BOOKING_NOT_FOUND` | Booking does not exist  |
| 500    | `INTERNAL_ERROR`    | Unexpected server error |

---

## Concurrency and Double-Booking Protection

The application must guarantee that two simultaneous requests cannot create two active bookings for the same slot.

The database is responsible for enforcing this invariant.

A partial unique index is created on active bookings:

```sql
CREATE UNIQUE INDEX "Booking_active_slot_unique"
ON "Booking" ("slotId")
WHERE "status" = 'active';
```

This means:

- Multiple cancelled bookings can exist for the same slot.
- Only one active booking can exist for a slot.
- Concurrent booking requests are safe even if both requests initially see the slot as available.

The application catches Prisma's `P2002` unique constraint error and returns:

```http
409 Conflict
```

with:

```json
{
  "error": {
    "code": "SLOT_UNAVAILABLE",
    "message": "This slot already has an active booking."
  }
}
```

This approach uses the database as the final concurrency authority instead of relying only on an application-level availability check.

### Possible Improvements

For a larger production system, the booking operation could be further optimized using:

- A transaction around related booking operations where appropriate
- More detailed database-level concurrency monitoring
- Retry strategies for transient database failures
- Observability and metrics
- Distributed tracing
- Horizontal scaling with multiple API instances

---

## Socket.IO

The application uses Socket.IO for real-time booking updates.

The default namespace is used:

```text
/
```

Socket.IO path:

```text
/socket.io
```

### `slot.booked`

Emitted after a booking is successfully created.

Payload:

```json
{
  "bookingId": "ede1b2d5-f045-4799-9431-66eae780dd6b",
  "slotId": "11111111-1111-4111-8111-111111111111"
}
```

### `slot.released`

Emitted after an active booking is successfully cancelled.

Payload:

```json
{
  "bookingId": "ede1b2d5-f045-4799-9431-66eae780dd6b",
  "slotId": "11111111-1111-4111-8111-111111111111"
}
```

No event is emitted for:

- Rejected booking requests
- Repeated cancellation of an already cancelled booking

### Testing Socket.IO Without a UI

The project includes `socket.io-client` as a development dependency.

Start the API:

```bash
npm run start:dev
```

Then run:

```bash
node -e "const { io } = require('socket.io-client'); const socket = io('http://localhost:3000', { path: '/socket.io' }); socket.on('connect', () => console.log('CONNECTED:', socket.id)); socket.on('slot.booked', data => console.log('slot.booked:', data)); socket.on('slot.released', data => console.log('slot.released:', data));"
```

Keep this client running and create/cancel bookings using Swagger, curl, or another HTTP client.

You should receive:

```text
slot.booked
```

after a successful booking and:

```text
slot.released
```

after a successful active cancellation.

---

## Automated Integration Tests

The project includes integration tests using:

- Real NestJS application
- Real PostgreSQL database
- Prisma
- Supertest
- Jest

The tests are not mocked at the database layer.

### Test Database Setup

Use a dedicated PostgreSQL database for testing to avoid modifying development data.

Configure `DATABASE_URL` to point to the test database, then apply migrations and seed the fixed slots:

```bash
npx prisma migrate deploy
npx prisma db seed
```

### Run Tests

```bash
npx jest --config ./test/jest-e2e.json
```

The integration test suite covers:

### 1. Successful Booking

Verifies that:

- A valid booking returns `201`
- The booking is saved as active
- The booked slot disappears from `GET /slots`

### 2. Concurrent Booking

Two booking requests are sent concurrently for the same slot.

The test verifies:

- One request returns `201`
- One request returns `409`
- Exactly one active booking exists in the database

This is a real concurrent test using `Promise.all`, not a sequential simulation.

### 3. Cancellation and Rebooking

Verifies that:

- An active booking can be cancelled
- Cancellation returns `200`
- The slot becomes available again
- The same slot can be booked again successfully

---

## Error Response Format

Errors use a consistent structure:

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable error message."
  }
}
```

Examples include:

```text
VALIDATION_ERROR
SLOT_NOT_FOUND
SLOT_UNAVAILABLE
BOOKING_NOT_FOUND
INTERNAL_ERROR
```

Invalid JSON bodies are also returned using the `VALIDATION_ERROR` format.

---

## Project Structure

```text
src/
├── bookings/
│   ├── dto/
│   ├── bookings.controller.ts
│   ├── bookings.module.ts
│   └── bookings.service.ts
│
├── slots/
│   ├── dto/
│   ├── slots.controller.ts
│   ├── slots.module.ts
│   └── slots.service.ts
│
├── events/
│   ├── events.gateway.ts
│   └── events.module.ts
│
├── prisma/
│   ├── prisma.module.ts
│   └── prisma.service.ts
│
├── common/
│   ├── dto/
│   └── filters/
│
├── app.module.ts
└── main.ts

prisma/
├── migrations/
├── schema.prisma
└── seed.ts

test/
├── appointments.e2e-spec.ts
├── app.e2e-spec.ts
└── jest-e2e.json
```

---

## Database Model

### Slot

```text
Slot
├── id
├── startsAt
└── endsAt
```

### Booking

```text
Booking
├── id
├── slotId
├── customerName
├── customerEmail
└── status
```

Booking status can be:

```text
active
cancelled
```

Each booking belongs to one slot.

The database uses a partial unique index to allow historical cancelled bookings while ensuring only one active booking exists for each slot.

---

## Time and Scope

The implementation was completed within the available development time.

The requested scope was intentionally kept focused on the assignment requirements.

The following were intentionally not implemented because they were outside the requested scope:

- Authentication
- Authorization
- Frontend UI
- Payment processing
- Cloud deployment
- Docker
- CI/CD
- Client-side Socket.IO UI
- Application-level Socket.IO rooms or custom client authentication

---

## AI Assistance Disclosure

AI assistance was used during development to help with architecture decisions, implementation details, debugging, OpenAPI documentation, concurrency handling, and test design.

The generated suggestions were reviewed, adapted to the project requirements, and manually tested against the real PostgreSQL-backed application.

All final implementation decisions and project integration were reviewed before completion.
