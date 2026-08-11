// Concurrency correctness test.
//
// Fires a stampede of parallel booking requests at a single flight that only
// has 10 seats. Because the Flight service decrements seats under a
// SELECT ... FOR UPDATE row lock, the system must never sell more than 10.
// The `booked_seats` threshold below fails the run if it ever oversells.
//
//   k6 run load-tests/double-booking.js
//
import http from 'k6/http';
import { check } from 'k6';
import { Counter } from 'k6/metrics';

const bookedSeats = new Counter('booked_seats');

const BASE = __ENV.BASE_URL || 'http://localhost:8080';
const FLIGHT_ID = Number(__ENV.FLIGHT_ID || 1); // seeded 10-seat flight
const AVAILABLE = Number(__ENV.AVAILABLE || 10);

export const options = {
  scenarios: {
    stampede: {
      executor: 'shared-iterations',
      vus: 50,
      iterations: 200,
      maxDuration: '30s',
    },
  },
  thresholds: {
    // The claim, encoded as a pass/fail gate: seats sold <= seats available.
    booked_seats: [`count<=${AVAILABLE}`],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const payload = JSON.stringify({ flightId: FLIGHT_ID, userId: 1, noOfSeats: 1 });
  // Unique key per attempt: each request is a genuinely distinct booking,
  // so idempotency does not mask the concurrency check.
  const key = `dbk-${__VU}-${__ITER}-${Date.now()}`;

  const res = http.post(`${BASE}/api/bookings`, payload, {
    headers: { 'Content-Type': 'application/json', 'x-idempotency-key': key },
  });

  if (res.status === 201) bookedSeats.add(1);

  check(res, {
    'no 5xx (server never corrupts)': (r) => r.status < 500,
    'either booked (201) or sold out (400)': (r) => r.status === 201 || r.status === 400,
  });
}

export function teardown() {
  const res = http.get(`${BASE}/api/flights/${FLIGHT_ID}`);
  try {
    const remaining = JSON.parse(res.body).data.totalSeats;
    console.log(`Flight ${FLIGHT_ID} remaining seats after stampede: ${remaining} (must be >= 0)`);
  } catch (e) {
    console.log('teardown: could not read remaining seats');
  }
}
