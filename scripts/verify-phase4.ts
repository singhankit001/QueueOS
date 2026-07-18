import { test } from 'node:test';
import assert from 'node:assert';

const API_URL = 'http://localhost:5001/api';
let cookie = '';
let queueId = '';
let tokenIds: string[] = [];

async function runStressTest() {
  console.log('Starting Phase 4 Concurrency Stress Test...');
  
  // Login
  const loginRes = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@queueos.com', password: 'password123' })
  });
  cookie = loginRes.headers.get('set-cookie')!.split(';')[0];

  // Create Queue
  const queueRes = await fetch(`${API_URL}/queues`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
    body: JSON.stringify({ name: 'Stress Test Queue' })
  });
  queueId = (await queueRes.json()).data.id;

  // Create 5 tokens
  for (let i = 1; i <= 5; i++) {
    const tokenRes = await fetch(`${API_URL}/queues/${queueId}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ personName: `User ${i}` })
    });
    tokenIds.push((await tokenRes.json()).data.id);
  }

  console.log('Spawning concurrent reordering requests...');
  // Move down the first token 5 times concurrently
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(`${API_URL}/tokens/${tokenIds[0]}/move-down`, {
        method: 'PATCH',
        headers: { 'Cookie': cookie }
      })
    );
  }

  const results = await Promise.all(promises);
  console.log(`Concurrent requests finished. Statuses: ${results.map(r => r.status).join(', ')}`);

  // Cleanup
  await fetch(`${API_URL}/queues/${queueId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie }
  });

  console.log('Stress test completed.');
}

runStressTest();
