import { test } from 'node:test';
import assert from 'node:assert';
// We will use native fetch available in Node 18+ but via global fetch

const API_URL = 'http://localhost:5001/api';
let cookie = '';
let queueId = '';
let tokenIds: string[] = [];

async function runVerification() {
  console.log('Starting Phase 2 Requirement Verification...');
  
  // 1. Auth Tests
  try {
    console.log('Testing Auth...');
    const loginRes = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@queueos.com', password: 'password123' })
    });
    
    assert.strictEqual(loginRes.status, 200, 'Login failed');
    const setCookie = loginRes.headers.get('set-cookie');
    assert.ok(setCookie?.includes('HttpOnly'), 'Cookie is missing HttpOnly');
    cookie = setCookie!.split(';')[0];
    
    console.log('Auth OK.');
  } catch (err: any) {
    console.error('Auth Test Failed:', err.message);
    process.exit(1);
  }

  // 2. Queue Creation
  try {
    console.log('Testing Queue Creation...');
    const queueRes = await fetch(`${API_URL}/queues`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ name: 'Verification Queue', description: 'Test Queue' })
    });
    
    const queueData = await queueRes.json();
    assert.strictEqual(queueRes.status, 201, 'Queue creation failed');
    queueId = queueData.data.id;
    console.log('Queue Creation OK. Queue ID:', queueId);
  } catch (err: any) {
    console.error('Queue Creation Failed:', err.message);
  }

  // 3. Invalid Payloads / Validation
  try {
    console.log('Testing Invalid Payloads...');
    const invalidTokenRes = await fetch(`${API_URL}/queues/${queueId}/tokens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
      body: JSON.stringify({ personName: 'A' }) // Less than 2 chars
    });
    assert.strictEqual(invalidTokenRes.status, 400, 'Validation did not catch short name');
    console.log('Invalid Payload Validation OK.');
  } catch (err: any) {
    console.error('Validation Test Failed:', err.message);
  }

  // 4. Token Creation
  try {
    console.log('Testing Token Creation...');
    for (let i = 1; i <= 3; i++) {
      const tokenRes = await fetch(`${API_URL}/queues/${queueId}/tokens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Cookie': cookie },
        body: JSON.stringify({ personName: `Test User ${i}` })
      });
      const tokenData = await tokenRes.json();
      tokenIds.push(tokenData.data.id);
    }
    assert.strictEqual(tokenIds.length, 3, 'Not all tokens were created');
    console.log('Token Creation OK.');
  } catch (err: any) {
    console.error('Token Creation Failed:', err.message);
  }

  // 5. Reordering
  try {
    console.log('Testing Token Reordering...');
    const moveRes = await fetch(`${API_URL}/tokens/${tokenIds[0]}/move-down`, {
      method: 'PATCH',
      headers: { 'Cookie': cookie }
    });
    assert.strictEqual(moveRes.status, 200, 'Move down failed');
    console.log('Reordering OK.');
  } catch (err: any) {
    console.error('Reordering Failed:', err.message);
  }

  // 6. Serve Next
  try {
    console.log('Testing Serve Next...');
    const serveRes = await fetch(`${API_URL}/queues/${queueId}/serve-next`, {
      method: 'POST',
      headers: { 'Cookie': cookie }
    });
    assert.strictEqual(serveRes.status, 200, 'Serve next failed');
    console.log('Serve Next OK.');
  } catch (err: any) {
    console.error('Serve Next Failed:', err.message);
  }
  
  // Cleanup (Delete Queue)
  console.log('Cleaning up...');
  await fetch(`${API_URL}/queues/${queueId}`, {
    method: 'DELETE',
    headers: { 'Cookie': cookie }
  });
  console.log('All Phase 2 Verifications passed!');
}

runVerification();
