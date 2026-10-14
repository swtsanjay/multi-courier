# Design

## Overview

The application exposes one courier-independent API. Consumers send a normalized order and select a courier using `courier_partner`.

The service chooses the correct adapter and hides courier-specific authentication, request fields, responses, and status names.

## Adapter Pattern

Every courier implements the same `CourierAdapter` interface:

- `createShipment`
- `trackShipment`
- `cancelShipment`

The courier registry stores the available adapters. This keeps controllers and order services independent from UrbaneBolt or any future courier.

Mock Courier demonstrates that another courier can be added without changing the public order API.

## Request Flow

```text
Client request
  -> authentication and validation
  -> order service
  -> courier registry
  -> selected courier adapter
  -> courier API
  -> normalized response
  -> PostgreSQL
```

UrbaneBolt uses a shared HTTP client with timeouts and configurable retries. Its access token is cached. A `401` or `403` clears the token, authenticates again, and retries the request once.

## Database

The main tables are:

- `users`: application users
- `refresh_tokens`: hashed refresh tokens and revocation information
- `courier_partners`: configured courier partners and capabilities
- `orders`: normalized order data and selected courier
- `shipments`: AWB, courier shipment ID, status, request, response, and failure information
- `shipment_tracking_history`: append-only tracking events

Shipment statuses are normalized to:

```text
CREATED
PICKED_UP
IN_TRANSIT
DELIVERED
CANCELLED
FAILED
```

## Bulk Processing

The bulk endpoint accepts up to 100 orders and processes five orders concurrently.

This implementation waits for the results and returns them in the same HTTP response. It is simple to operate and provides immediate per-order results. A background queue would be better for larger batches or slower courier APIs, but it would require additional infrastructure and a batch-status endpoint.

Each order is processed independently, so one failure does not fail the complete batch.

## Idempotency

`order_id` is unique in PostgreSQL. If an order already exists, the API returns the saved order and does not call the courier again.

## Errors and Logging

All endpoints use the same response structure. Validation and unsupported courier errors return `400` with details.

Every response includes a request ID. Failures are logged with the request ID, order ID, courier partner, error type, and stack trace when available.

Courier validation errors are normalized. Temporary courier failures are retried with exponential backoff, while failed shipments are stored with the `FAILED` status for later inspection.

## Configuration

Database details, JWT settings, courier credentials, base URLs, timeouts, and retry values come from environment variables. Secrets must not be committed to Git.
