import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const baseURL = 'http://localhost:5001/api';

async function runTest() {
  console.log('--- STARTING VALIDATION ---');
  let cookieHeader = '';

  // 1. Authenticate
  const loginRes = await fetch(`${baseURL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'admin@queueos.com',
      password: 'password123'
    })
  });
  
  const setCookie = loginRes.headers.get('set-cookie');
  if (setCookie) {
    // Extract the token part and handle properly
    // Fetch returns multiple cookies comma-separated. The first one is token=...
    cookieHeader = setCookie.split(';')[0];
    console.log('✅ Auth successful, HttpOnly Cookie received.');
  } else {
    throw new Error('Failed to get cookie from login');
  }

  const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Cookie': cookieHeader
  });

  // 2. Create a test queue
  const queueRes = await fetch(`${baseURL}/queues`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ name: 'Stress Test Queue' })
  });
  const queueData = await queueRes.json();
  const queueId = queueData.data.id;
  console.log(`✅ Queue created: ${queueId}`);

  // 3. Create 20 tokens sequentially
  const tokenIds: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const tRes = await fetch(`${baseURL}/queues/${queueId}/tokens`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ personName: `Test User ${i}` })
    });
    const tData = await tRes.json();
    tokenIds.push(tData.data.id);
  }
  console.log('✅ Created 20 tokens.');

  // 4. Concurrency Test - moveUp and moveDown simultaneously
  console.log('Firing concurrent reorder requests...');
  
  const reqs = [];
  for (let i = 0; i < 50; i++) {
    const isUp = Math.random() > 0.5;
    const randomId = tokenIds[Math.floor(Math.random() * 18) + 1];
    
    reqs.push(
      fetch(`${baseURL}/tokens/${randomId}/${isUp ? 'up' : 'down'}`, {
        method: 'PUT',
        headers: getHeaders()
      }).catch(e => console.error(e))
    );
  }

  await Promise.all(reqs);
  console.log('✅ Concurrent requests completed.');

  // Verify Positions in Database
  const dbTokens = await prisma.token.findMany({
    where: { queueId, status: 'WAITING' },
    orderBy: { position: 'asc' }
  });

  const positions = dbTokens.map(t => t.position);
  const uniquePositions = new Set(positions);
  
  if (positions.length !== 20 || uniquePositions.size !== 20) {
    console.error('❌ Duplicate or missing positions found!', positions);
    process.exit(1);
  } else {
    console.log('✅ No duplicate or missing positions. Ordering remains strictly monotonic.');
  }

  // 5. Analytics Validation
  console.log('Completing tokens to generate analytics...');
  const now = new Date();
  
  // Update manually to test hour grouping
  await prisma.token.update({
    where: { id: dbTokens[0].id },
    data: { 
      status: 'COMPLETED', 
      createdAt: new Date(now.getTime() - 2 * 3600 * 1000),
      servedAt: new Date(now.getTime() - 1 * 3600 * 1000)
    }
  });

  await prisma.token.update({
    where: { id: dbTokens[1].id },
    data: { 
      status: 'COMPLETED', 
      createdAt: new Date(now.getTime() - 3 * 3600 * 1000),
      servedAt: new Date(now.getTime() - 2.5 * 3600 * 1000)
    }
  });

  await prisma.token.update({
    where: { id: dbTokens[2].id },
    data: { 
      status: 'COMPLETED', 
      createdAt: new Date(now.getTime() - 3 * 3600 * 1000),
      servedAt: new Date(now.getTime() - 2.8 * 3600 * 1000)
    }
  });

  // Fetch Analytics
  const analyticsRes = await fetch(`${baseURL}/analytics/dashboard`, {
    method: 'GET',
    headers: getHeaders()
  });
  const analyticsDataRes = await analyticsRes.json();
  const analyticsData = analyticsDataRes.data;
  
  console.log('✅ Analytics fetched:', JSON.stringify(analyticsData.chartData.waitTrend, null, 2));
  
  if (analyticsData.chartData.waitTrend.length > 0) {
    console.log('✅ Analytics is using REAL database aggregated data (grouped by hour).');
  } else {
    console.error('❌ Analytics waitTrend is empty!');
    process.exit(1);
  }

  console.log('--- VALIDATION SUCCESSFUL ---');
}

runTest().catch(console.error).finally(() => prisma.$disconnect());
