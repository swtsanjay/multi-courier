ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'PICKED_UP';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'IN_TRANSIT';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'CANCELLED';
ALTER TYPE "ShipmentStatus" ADD VALUE IF NOT EXISTS 'RTO';

CREATE TABLE "shipment_tracking_history" (
  "id" UUID NOT NULL,
  "shipment_id" UUID NOT NULL,
  "status" "ShipmentStatus" NOT NULL,
  "location" VARCHAR(255),
  "description" VARCHAR(500),
  "event_time" TIMESTAMP(3) NOT NULL,
  "raw_payload" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "shipment_tracking_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "shipment_tracking_history_shipment_id_event_time_idx"
ON "shipment_tracking_history"("shipment_id", "event_time");

ALTER TABLE "shipment_tracking_history"
ADD CONSTRAINT "shipment_tracking_history_shipment_id_fkey"
FOREIGN KEY ("shipment_id") REFERENCES "shipments"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

CREATE OR REPLACE FUNCTION prevent_tracking_history_mutation()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'shipment_tracking_history is append-only';
END;
$$;

CREATE TRIGGER shipment_tracking_history_no_update
BEFORE UPDATE OR DELETE ON "shipment_tracking_history"
FOR EACH ROW EXECUTE FUNCTION prevent_tracking_history_mutation();
