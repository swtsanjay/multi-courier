# Multi-Courier Integration Platform

A TypeScript and Express backend that provides one API for working with different courier partners.

The project currently includes:

- Mock Courier for local testing
- UrbaneBolt integration for UAT
- User registration, login, token refresh, and logout
- Single and bulk order creation
- Shipment tracking and cancellation
- PostgreSQL persistence with Prisma

## Requirements

- Node.js 22.13 or newer
- PostgreSQL
- npm

## Setup

Install packages:

```bash
npm install
```

Copy the environment example:

```bash
cp .env.example .env
```

Update `DATABASE_URL` and `JWT_SECRET_KEY` in `.env`.

For UrbaneBolt, also provide:

```env
URBANEBOLT_BASE_URL=https://uat.urbanebolt.in/api/v1
URBANEBOLT_USERNAME=
URBANEBOLT_PASSWORD=
URBANEBOLT_CUSTOMER_CODE=
```

UrbaneBolt remains unavailable until these values are configured. Mock Courier works without external credentials.

## Database

Generate the Prisma client and apply migrations:

```bash
npm run db:generate
npm run db:deploy
```

## Run the API

```bash
npm run build
npm run start
```

The API runs at `http://localhost:3000` by default.

## Main Endpoints

```text
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/refresh-token
POST /api/v1/auth/logout

GET  /api/v1/couriers
POST /api/v1/orders
POST /api/v1/orders/bulk
GET  /api/v1/orders
GET  /api/v1/orders/:orderId
GET  /api/v1/orders/:orderId/track
POST /api/v1/orders/:orderId/cancel
```

Order APIs require an access token:

```text
Authorization: Bearer <access-token>
```

## Bulk Orders

`POST /api/v1/orders/bulk` accepts a JSON array containing 1 to 100 orders.

Orders are processed with limited concurrency. The response contains a separate success or failure result for every order. Reusing an existing `order_id` returns the existing order instead of creating another shipment.

## Testing

Import `postman.json` into Postman and run:

1. Register User
2. Login
3. List Couriers
4. Create Mock Courier Order
5. Track Order
6. Cancel Order
7. Create Bulk Mock Courier Orders
8. Refresh Token or Logout

Run code checks with:

```bash
npm run build
npm run lint
```

## Adding a Courier

1. Create a class that implements `CourierAdapter`.
2. Map the common order format to the courier's request format.
3. Normalize the courier's responses and statuses.
4. Register the adapter in `courier.registry.ts`.
5. Add the courier to the `courier_partners` table through a migration.

Controllers and routes do not need to change.
