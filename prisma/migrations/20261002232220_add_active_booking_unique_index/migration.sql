CREATE UNIQUE INDEX "Booking_active_slot_unique"
ON "Booking" ("slotId")
WHERE "status" = 'active';