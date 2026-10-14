INSERT INTO "courier_partners" ("code", "name", "is_active", "capabilities", "created_at", "updated_at")
VALUES (
  'urbanebolt',
  'UrbaneBolt',
  true,
  '{"createShipment":true,"tracking":true,"cancellation":true}'::jsonb,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
)
ON CONFLICT ("code") DO UPDATE SET
  "name" = EXCLUDED."name",
  "is_active" = EXCLUDED."is_active",
  "capabilities" = EXCLUDED."capabilities",
  "updated_at" = CURRENT_TIMESTAMP;
