UPDATE "shipments"
SET "status" = CASE
  WHEN "status"::text = 'PROCESSING' THEN 'CREATED'::"ShipmentStatus"
  WHEN "status"::text = 'OUT_FOR_DELIVERY' THEN 'IN_TRANSIT'::"ShipmentStatus"
  WHEN "status"::text = 'RTO' THEN 'FAILED'::"ShipmentStatus"
  ELSE "status"
END;

ALTER TABLE "shipment_tracking_history"
  DISABLE TRIGGER "shipment_tracking_history_no_update";

UPDATE "shipment_tracking_history"
SET "status" = CASE
  WHEN "status"::text = 'PROCESSING' THEN 'CREATED'::"ShipmentStatus"
  WHEN "status"::text = 'OUT_FOR_DELIVERY' THEN 'IN_TRANSIT'::"ShipmentStatus"
  WHEN "status"::text = 'RTO' THEN 'FAILED'::"ShipmentStatus"
  ELSE "status"
END;

ALTER TABLE "shipment_tracking_history"
  ENABLE TRIGGER "shipment_tracking_history_no_update";

ALTER TABLE "shipments" ALTER COLUMN "status" DROP DEFAULT;
ALTER TYPE "ShipmentStatus" RENAME TO "ShipmentStatus_old";
CREATE TYPE "ShipmentStatus" AS ENUM (
  'CREATED',
  'PICKED_UP',
  'IN_TRANSIT',
  'DELIVERED',
  'CANCELLED',
  'FAILED'
);

ALTER TABLE "shipments"
  ALTER COLUMN "status" TYPE "ShipmentStatus"
  USING ("status"::text::"ShipmentStatus");

ALTER TABLE "shipment_tracking_history"
  ALTER COLUMN "status" TYPE "ShipmentStatus"
  USING ("status"::text::"ShipmentStatus");

ALTER TABLE "shipments"
  ALTER COLUMN "status" SET DEFAULT 'CREATED';

DROP TYPE "ShipmentStatus_old";
