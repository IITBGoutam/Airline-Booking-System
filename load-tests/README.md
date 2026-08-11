# k6 load tests

Install k6: https://k6.io/docs/get-started/installation/ (`winget install k6` / `brew install k6` / `choco install k6`).

Bring the stack up first:

```bash
docker compose up --build
```

Then, from the repo root:

| Script | Purpose |
|---|---|
| `k6 run load-tests/smoke.js` | Functional check of the whole flow + idempotency proof |
| `k6 run load-tests/load-test.js` | Scalability: ramps to 100 VUs, asserts p95 < 500ms, error rate < 1% |
| `k6 run load-tests/double-booking.js` | Concurrency: 200 parallel bookings on a 10-seat flight; **fails if it ever oversells** |

Point at a different host/flight with env vars:

```bash
k6 run -e BASE_URL=http://localhost:8080 -e FLIGHT_ID=1 -e AVAILABLE=10 load-tests/double-booking.js
```
