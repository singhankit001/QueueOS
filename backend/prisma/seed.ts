import 'dotenv/config';
import { prisma } from '../src/utils/db';
import bcrypt from 'bcrypt';

async function main() {
  console.log('Seeding database...');
  
  // Clean DB
  await prisma.activityLog.deleteMany();
  await prisma.token.deleteMany();
  await prisma.queueMetrics.deleteMany();
  await prisma.queue.deleteMany();
  await prisma.manager.deleteMany();

  // Create Manager
  const password = await bcrypt.hash('password123', 10);
  const manager = await prisma.manager.create({
    data: {
      name: 'Elite Manager',
      email: 'admin@queueos.com',
      password
    }
  });

  // Create 5 Queues
  const queuesData = [
    { name: 'Hospital Reception', description: 'General intake and triage' },
    { name: 'Bank Teller', description: 'Deposits, withdrawals, and general banking' },
    { name: 'Customer Support', description: 'Tech support and billing inquiries' },
    { name: 'Admissions Office', description: 'Student enrollment and counseling' },
    { name: 'Service Center', description: 'Vehicle maintenance and repairs' }
  ];

  for (const q of queuesData) {
    const queue = await prisma.queue.create({
      data: {
        name: q.name,
        description: q.description,
        managerId: manager.id,
        metrics: {
          create: {
            totalServed: Math.floor(Math.random() * 50) + 10,
            totalCancelled: Math.floor(Math.random() * 10),
            averageWaitTime: Math.floor(Math.random() * 1800) + 300 // 5-30 mins
          }
        }
      }
    });

    // Create Activity for queue
    await prisma.activityLog.create({
      data: {
        eventType: 'QUEUE_CREATED',
        description: `Queue "${queue.name}" created.`,
        managerId: manager.id,
        queueId: queue.id,
        createdAt: new Date(Date.now() - Math.random() * 86400000 * 5) // up to 5 days ago
      }
    });

    // Generate 40 Tokens per queue (200 total)
    for (let i = 1; i <= 40; i++) {
      const statusRand = Math.random();
      let status: 'WAITING' | 'SERVING' | 'COMPLETED' | 'CANCELLED' = 'COMPLETED';
      let position = i;

      if (statusRand > 0.8) status = 'WAITING';
      else if (statusRand > 0.75) status = 'SERVING';
      else if (statusRand > 0.6) status = 'CANCELLED';

      const createdAt = new Date(Date.now() - Math.random() * 86400000); // within last 24h
      
      const token = await prisma.token.create({
        data: {
          tokenNumber: `QOS-${i.toString().padStart(3, '0')}`,
          personName: `Customer ${i}`,
          phone: `555-01${i.toString().padStart(2, '0')}`,
          status,
          position: status === 'WAITING' ? position : 0,
          queueId: queue.id,
          createdAt,
          servedAt: status === 'COMPLETED' || status === 'SERVING' ? new Date(createdAt.getTime() + 600000) : null,
          cancelledAt: status === 'CANCELLED' ? new Date(createdAt.getTime() + 300000) : null,
        }
      });

      // Activities for recent tokens
      if (i > 30) {
        await prisma.activityLog.create({
          data: {
            eventType: 'TOKEN_ADDED',
            description: `Token ${token.tokenNumber} added.`,
            managerId: manager.id,
            queueId: queue.id,
            createdAt
          }
        });

        if (status === 'COMPLETED') {
          await prisma.activityLog.create({
            data: {
              eventType: 'TOKEN_SERVED',
              description: `Token ${token.tokenNumber} served.`,
              managerId: manager.id,
              queueId: queue.id,
              createdAt: token.servedAt!
            }
          });
        }
      }
    }
  }

  console.log('Seed completed successfully!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
