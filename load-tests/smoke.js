// Functional smoke test: exercises the full path through the gateway and
// verifies idempotency (same key -> same booking).
//
//   k6 run load-tests/smoke.js
//
import http from 'k6/http';
import { check } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export const options = { vus: 1, iterations: 1 };

export default function () {
  const jsonHeaders = { 'Content-Type': 'application/json' };

  const health = http.get(`${BASE}/health`);
  check(health, { 'gateway healthy': (r) => r.status === 200 });

  const email = `user_${Date.now()}@test.com`;
  const creds = JSON.stringify({ email, password: 'pass1234' });

  const signup = http.post(`${BASE}/api/auth/signup`, creds, { headers: jsonHeaders });
  check(signup, { 'signup 201': (r) => r.status === 201 });

  const signin = http.post(`${BASE}/api/auth/signin`, creds, { headers: jsonHeaders });
  check(signin, { 'signin 200 + token': (r) => r.status === 200 && !!JSON.parse(r.body).data.token });

  const flights = http.get(`${BASE}/api/flights`);
  check(flights, { 'list flights 200': (r) => r.status === 200 });

  // Idempotency: two identical requests with the same key -> one booking.
  const key = `smoke-${Date.now()}`;
  const body = JSON.stringify({ flightId: 2, userId: 1, noOfSeats: 1 });
  const opts = { headers: { ...jsonHeaders, 'x-idempotency-key': key } };

  const b1 = http.post(`${BASE}/api/bookings`, body, opts);
  check(b1, { 'booking created 201': (r) => r.status === 201 });

  const b2 = http.post(`${BASE}/api/bookings`, body, opts);
  check(b2, {
    'idempotent replay returns same booking id': (r) => {
      try {
        return JSON.parse(b1.body).data.id === JSON.parse(r.body).data.id;
      } catch (e) {
        return false;
      }
    },
  });
}
