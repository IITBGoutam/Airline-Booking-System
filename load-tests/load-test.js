// Scalability / throughput test through the Nginx gateway.
//
//   k6 run load-tests/load-test.js
//
import http from 'k6/http';
import { check, sleep } from 'k6';

const BASE = __ENV.BASE_URL || 'http://localhost:8080';

export const options = {
  stages: [
    { duration: '30s', target: 50 },  // ramp up
    { duration: '1m', target: 100 },  // sustain
    { duration: '30s', target: 0 },   // ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // <1% errors
  },
};

export default function () {
  const list = http.get(`${BASE}/api/flights`);
  check(list, { 'list flights 200': (r) => r.status === 200 });

  const one = http.get(`${BASE}/api/flights/2`);
  check(one, { 'get flight 200': (r) => r.status === 200 });

  sleep(1);
}
