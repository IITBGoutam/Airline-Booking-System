# Airline Booking System — Microservices

A microservice-based airline booking platform: independent **Auth**, **Flight**, and
**Booking** services (plus a **Notification** consumer) behind an **Nginx** API gateway,
backed by **PostgreSQL**, communicating asynchronously over **Kafka** (Redpanda),
containerised with **Docker Compose**, and load-tested with **k6**.

## Architecture

```
                          ┌──────────────────────┐
   client ──────────────► │   Nginx API gateway   │  :8080
                          └──────────┬───────────┘
        /api/auth/*     ─────────────┤────────►  auth-service      :3001 ──► auth_db
        /api/flights/*  ─────────────┤────────►  flight-service    :3000 ──► flight_db
        /api/bookings/* ─────────────┴────────►  booking-service   :3002 ──► booking_db
                                                       │  produces
                                                       ▼
                                                 ┌───────────┐
                                                 │  Kafka /  │  booking-events
                                                 │ Redpanda  │  availability-events
                                                 └─────┬─────┘
                                        consumes ┌─────┴─────┐ consumes
                                                 ▼           ▼
                                    notification-service   flight-service
```

Each service owns its own database (**database-per-service**). Cross-service links
(a booking's `flightId` / `userId`) are validated over HTTP at request time rather than
by a shared foreign key.

## Quick start

```bash
docker compose up --build
```

This boots Postgres (with 3 databases), Redpanda, all four services, and the Nginx
gateway. Migrations and seed data run automatically on startup.

- Gateway:            http://localhost:8080
- Auth service:       http://localhost:3001
- Flight service:     http://localhost:3000
- Booking service:    http://localhost:3002
- Notification logs:  `docker compose logs -f notification-service`

### Example flow (through the gateway)

```bash
# 1. Register + sign in
curl -X POST http://localhost:8080/api/auth/signup  -H 'Content-Type: application/json' -d '{"email":"a@b.com","password":"pass1234"}'
curl -X POST http://localhost:8080/api/auth/signin  -H 'Content-Type: application/json' -d '{"email":"a@b.com","password":"pass1234"}'

# 2. Browse flights
curl http://localhost:8080/api/flights

# 3. Book a seat (idempotent — retrying with the same key never double-books)
curl -X POST http://localhost:8080/api/bookings \
  -H 'Content-Type: application/json' \
  -H 'x-idempotency-key: my-unique-key-123' \
  -d '{"flightId":2,"userId":1,"noOfSeats":2}'
```

## Load testing

See [`load-tests/README.md`](load-tests/README.md). Highlight:

```bash
# Proves no double booking under a 200-request stampede on a 10-seat flight
k6 run load-tests/double-booking.js
```

## Tech stack

Node.js · Express · PostgreSQL · Sequelize · Kafka (Redpanda) · KafkaJS · Nginx ·
Docker Compose · k6 · JWT · bcrypt

## Repository layout

```
services/
  auth-service/          users, roles (M:N), JWT
  flight-service/        cities, airports, airplanes, flights; row-locked seat updates
  booking-service/       idempotent, transactional bookings; Kafka producer
  notification-service/  Kafka consumer -> notifications
api-gateway/             Nginx reverse proxy config + Dockerfile
infra/postgres/          multi-database init script
load-tests/              k6 scripts (smoke, load, concurrency)
docker-compose.yml       one-command local stack
```
