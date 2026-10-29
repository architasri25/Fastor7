# CRM Enquiry REST API

Express and MySQL API for employee accounts, public enquiry submissions, and counselor lead claims.

## Requirements

- Node.js 20+
- MySQL 8.0+ (Laragon's bundled MySQL 8 is suitable)

## Setup

1. Start MySQL in Laragon.
2. Copy `.env.example` to `.env` and set your MySQL credentials and a private `JWT_SECRET` of at least 32 characters.
3. Apply the schema (it creates the `crm` database if needed):

   ```sh
   mysql -h 127.0.0.1 -P 3306 -u root -p < database/schema.sql
   ```

   Or, after configuring `.env`, use:

   ```sh
   npm run db:setup
   ```

4. Install and start:

   ```sh
   npm install
   npm run dev
   ```

The API listens on `http://localhost:3000` by default. `GET /health` checks that the server is responsive.

## Endpoints

| Method | Path | Auth | Purpose |
|---|---|---|---|
| `POST` | `/api/auth/register` | No | Register a counselor |
| `POST` | `/api/auth/login` | No | Login and receive a JWT |
| `POST` | `/api/enquiries` | No | Submit a public enquiry |
| `GET` | `/api/enquiries/public` | Yes | List currently unclaimed enquiries |
| `POST` | `/api/enquiries/:id/claim` | Yes | Claim one unclaimed enquiry |
| `GET` | `/api/enquiries/mine` | Yes | List enquiries claimed by the logged-in counselor |

Authenticated routes expect `Authorization: Bearer <token>`. List routes accept optional `limit` (1-100, default 20) and `offset` (default 0) query parameters.

## Request examples

Register:

```json
{
  "name": "Asha Sharma",
  "email": "asha@example.com",
  "password": "a-long-password"
}
```

Public enquiry:

```json
{
  "name": "Ravi Kumar",
  "email": "ravi@example.com",
  "courseInterest": "Full Stack Development",
  "phone": "+91 9876543210",
  "message": "Please contact me about the next batch."
}
```

The claim is an atomic conditional database update: if two counselors claim the same enquiry concurrently, only one succeeds. The other receives `409 Conflict`. Enquiries claimed by a counselor are omitted from the public list and visible through that counselor's `/mine` list.

## Responses and validation

Successful registration and enquiry submission return `201`. Invalid input returns `400`, missing or invalid authentication returns `401`, duplicate registration or an already claimed enquiry returns `409`, and claiming a nonexistent enquiry returns `404`. Passwords are stored as bcrypt hashes and never returned by the API.
