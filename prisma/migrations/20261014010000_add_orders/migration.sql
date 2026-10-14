CREATE TYPE "ShipmentStatus" AS ENUM ('PROCESSING', 'CREATED', 'FAILED');

CREATE TABLE "courier_partners" (
  "id" SERIAL NOT NULL,
  "code" VARCHAR(50) NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "capabilities" JSONB NOT NULL DEFAULT '{}',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "courier_partners_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "orders" (
  "id" UUID NOT NULL,
  "order_id" VARCHAR(100) NOT NULL,
  "created_by_id" INTEGER NOT NULL,
  "courier_partner_id" INTEGER NOT NULL,
  "normalized_payload" JSONB NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "shipments" (
  "id" UUID NOT NULL,
  "order_id" UUID NOT NULL,
  "status" "ShipmentStatus" NOT NULL DEFAULT 'PROCESSING',
  "courier_shipment_id" VARCHAR(150),
  "awb_number" VARCHAR(150),
  "request_payload" JSONB,
  "response_payload" JSONB,
  "error_message" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "shipments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "courier_partners_code_key" ON "courier_partners"("code");
CREATE UNIQUE INDEX "orders_order_id_key" ON "orders"("order_id");
CREATE INDEX "orders_created_by_id_idx" ON "orders"("created_by_id");
CREATE INDEX "orders_courier_partner_id_idx" ON "orders"("courier_partner_id");
CREATE UNIQUE INDEX "shipments_order_id_key" ON "shipments"("order_id");
CREATE UNIQUE INDEX "shipments_awb_number_key" ON "shipments"("awb_number");
CREATE INDEX "shipments_status_idx" ON "shipments"("status");

ALTER TABLE "orders" ADD CONSTRAINT "orders_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orders" ADD CONSTRAINT "orders_courier_partner_id_fkey" FOREIGN KEY ("courier_partner_id") REFERENCES "courier_partners"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "shipments" ADD CONSTRAINT "shipments_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "courier_partners" ("code", "name", "capabilities", "updated_at")
VALUES ('mock_courier', 'Mock Courier', '{"createShipment":true,"tracking":true,"cancellation":true}', CURRENT_TIMESTAMP);
