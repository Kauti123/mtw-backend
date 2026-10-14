import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  vus: 10,
  duration: '30s',
  thresholds: {
    http_req_duration: ['p(95)<3000'],
  },
};

const BASE = __ENV.BASE_URL || 'http://localhost:3000/v1';

export default function () {
  const search = http.post(
    `${BASE}/bookings/search`,
    JSON.stringify({
      vertical: 'HOTEL',
      corporateId: 'corp-load',
      currency: 'INR',
      market: 'IN',
      destination: 'DEL',
      adults: 1,
      rooms: 1,
    }),
    { headers: { 'Content-Type': 'application/json' } },
  );
  check(search, { 'search 200': (r) => r.status === 200 });
  sleep(1);
}
