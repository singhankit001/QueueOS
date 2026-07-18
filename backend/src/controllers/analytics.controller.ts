import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';

export const getDashboardAnalytics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = (req as any).user.id;

    // Get all queues for this manager
    const queues = await prisma.queue.findMany({
      where: { managerId },
      include: { metrics: true }
    });

    const queueIds = queues.map(q => q.id);

    // Aggregate metrics
    let totalServed = 0;
    let totalCancelled = 0;
    
    queues.forEach(q => {
      if (q.metrics) {
        totalServed += q.metrics.totalServed;
        totalCancelled += q.metrics.totalCancelled;
      }
    });

    const activeTokens = await prisma.token.count({
      where: { queueId: { in: queueIds }, status: 'WAITING' }
    });

    const completedTokens = await prisma.token.findMany({
      where: { queueId: { in: queueIds }, status: 'COMPLETED' },
      select: { createdAt: true, servedAt: true }
    });

    let totalWaitTime = 0;
    let maxWaitTime = 0;

    const hourlyWaitTimes: Record<string, { totalWaitTimeMinutes: number; count: number }> = {};

    completedTokens.forEach(t => {
      if (t.servedAt) {
        const waitTimeSeconds = Math.floor((t.servedAt.getTime() - t.createdAt.getTime()) / 1000);
        totalWaitTime += waitTimeSeconds;
        if (waitTimeSeconds > maxWaitTime) maxWaitTime = waitTimeSeconds;

        const date = new Date(t.createdAt);
        const hourString = date.getHours().toString().padStart(2, '0') + ':00';
        
        if (!hourlyWaitTimes[hourString]) {
          hourlyWaitTimes[hourString] = { totalWaitTimeMinutes: 0, count: 0 };
        }
        hourlyWaitTimes[hourString].totalWaitTimeMinutes += (waitTimeSeconds / 60);
        hourlyWaitTimes[hourString].count += 1;
      }
    });

    const avgWaitTime = completedTokens.length > 0 ? Math.floor(totalWaitTime / completedTokens.length) : 0;

    const waitTrend = Object.keys(hourlyWaitTimes).sort().map(hour => ({
      hour,
      avgWaitTime: Number((hourlyWaitTimes[hour].totalWaitTimeMinutes / hourlyWaitTimes[hour].count).toFixed(1))
    }));

    // Fetch Recent Activity (last 10 token updates)
    const recentTokens = await prisma.token.findMany({
      where: { queueId: { in: queueIds } },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { queue: { select: { name: true } } }
    });

    const recentActivity = recentTokens.map(t => ({
      id: t.id,
      tokenNumber: t.tokenNumber,
      personName: t.personName,
      status: t.status,
      queueName: t.queue.name,
      timestamp: t.createdAt
    }));

    res.json({
      success: true,
      data: {
        activeQueueLength: activeTokens,
        averageWaitTime: avgWaitTime, // in seconds
        tokensServedToday: totalServed,
        cancellationRate: (totalServed + totalCancelled) > 0 ? (totalCancelled / (totalServed + totalCancelled)) * 100 : 0,
        longestWaitTime: maxWaitTime,
        queueStatusBreakdown: {
          waiting: activeTokens,
          served: totalServed,
          cancelled: totalCancelled
        },
        chartData: {
          waitTrend
        },
        recentActivity
      }
    });
  } catch (error) {
    next(error);
  }
};
