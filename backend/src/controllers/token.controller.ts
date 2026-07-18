import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { z } from 'zod';
import { getIO } from '../services/socket.service';

const tokenSchema = z.object({
  personName: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional()
});

const generateTokenNumber = async (queueId: string) => {
  const count = await prisma.token.count({ where: { queueId } });
  const number = (count + 1).toString().padStart(3, '0');
  return `QOS-${number}`;
};

export const createToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: queueId } = req.params as { id: string };
    const data = tokenSchema.parse(req.body);
    const managerId = (req as any).user.id;

    // Verify queue belongs to manager
    const queue = await prisma.queue.findFirst({ where: { id: queueId, managerId } });
    if (!queue) {
      res.status(404).json({ success: false, error: 'Queue not found' });
      return;
    }

    const tokenNumber = await generateTokenNumber(queueId);
    
    // Find last position
    const lastToken = await prisma.token.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'desc' }
    });
    
    const position = lastToken ? lastToken.position + 1 : 1;

    const token = await prisma.token.create({
      data: {
        tokenNumber,
        personName: data.personName,
        phone: data.phone,
        queueId,
        position
      }
    });

    const activity = await prisma.activityLog.create({
      data: {
        eventType: 'TOKEN_ADDED',
        description: `Token ${token.tokenNumber} added to queue.`,
        managerId,
        queueId
      }
    });

    // Notify clients
    getIO().to(`queue-${queueId}`).emit('queue-updated', { type: 'TOKEN_CREATED', token });
    getIO().to(`manager-${managerId}`).emit('ACTIVITY_ADDED', activity);

    res.status(201).json({ success: true, data: token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.issues[0].message });
      return;
    }
    next(error);
  }
};

export const serveNext = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id: queueId } = req.params as { id: string };
    const managerId = (req as any).user.id;

    const queue = await prisma.queue.findFirst({ where: { id: queueId, managerId } });
    if (!queue) {
      res.status(404).json({ success: false, error: 'Queue not found' });
      return;
    }

    const firstWaiting = await prisma.token.findFirst({
      where: { queueId, status: 'WAITING' },
      orderBy: { position: 'asc' }
    });

    if (!firstWaiting) {
      res.status(400).json({ success: false, error: 'No tokens waiting in queue' });
      return;
    }

    // Complete the currently serving token if there is one
    const currentlyServing = await prisma.token.findFirst({
      where: { queueId, status: 'SERVING' }
    });

    if (currentlyServing) {
      await prisma.token.update({
        where: { id: currentlyServing.id },
        data: { status: 'COMPLETED' }
      });
    }

    const now = new Date();
    const waitTime = Math.floor((now.getTime() - firstWaiting.createdAt.getTime()) / 1000);

    const updatedToken = await prisma.token.update({
      where: { id: firstWaiting.id },
      data: {
        status: 'SERVING',
        servedAt: now
      }
    });

    // Update metrics with mathematical moving average
    const metrics = await prisma.queueMetrics.findUnique({ where: { queueId } });
    if (metrics) {
      const currentServed = metrics.totalServed;
      const newTotalServed = currentServed + 1;
      
      const newAverageWaitTime = Math.floor(((metrics.averageWaitTime * currentServed) + waitTime) / newTotalServed);
      
      let newAverageServiceTime = metrics.averageServiceTime;
      if (currentlyServing && currentlyServing.servedAt) {
        const serviceTime = Math.floor((now.getTime() - currentlyServing.servedAt.getTime()) / 1000);
        // Using currentServed because currentlyServing is the one that just completed
        newAverageServiceTime = Math.floor(((metrics.averageServiceTime * (currentServed > 0 ? currentServed - 1 : 0)) + serviceTime) / (currentServed > 0 ? currentServed : 1));
      }

      await prisma.queueMetrics.update({
        where: { queueId },
        data: {
          totalServed: { increment: 1 },
          averageWaitTime: newAverageWaitTime,
          averageServiceTime: newAverageServiceTime
        }
      });
    }

    const activity = await prisma.activityLog.create({
      data: {
        eventType: 'TOKEN_SERVED',
        description: `Token ${updatedToken.tokenNumber} served.`,
        managerId,
        queueId
      }
    });

    getIO().to(`queue-${queueId}`).emit('queue-updated', { type: 'SERVE_NEXT', token: updatedToken });
    getIO().to(`manager-${managerId}`).emit('ACTIVITY_ADDED', activity);

    res.json({ success: true, data: updatedToken });
  } catch (error) {
    next(error);
  }
};

export const cancelToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const managerId = (req as any).user.id;

    const token = await prisma.token.findUnique({ where: { id }, include: { queue: true } });
    if (!token || token.queue.managerId !== managerId) {
      res.status(404).json({ success: false, error: 'Token not found' });
      return;
    }

    const updatedToken = await prisma.token.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      }
    });

    await prisma.queueMetrics.update({
      where: { queueId: token.queueId },
      data: { totalCancelled: { increment: 1 } }
    });

    const activity = await prisma.activityLog.create({
      data: {
        eventType: 'TOKEN_CANCELLED',
        description: `Token ${updatedToken.tokenNumber} cancelled.`,
        managerId,
        queueId: token.queueId
      }
    });

    getIO().to(`queue-${token.queueId}`).emit('queue-updated', { type: 'TOKEN_CANCELLED', token: updatedToken });
    getIO().to(`manager-${managerId}`).emit('ACTIVITY_ADDED', activity);

    res.json({ success: true, data: updatedToken });
  } catch (error) {
    next(error);
  }
};

export const moveUp = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    
    await prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({ where: { id } });
      if (!token || token.status !== 'WAITING') {
        throw new Error('Invalid token');
      }

      const previousToken = await tx.token.findFirst({
        where: {
          queueId: token.queueId,
          status: 'WAITING',
          position: { lt: token.position }
        },
        orderBy: { position: 'desc' }
      });

      if (previousToken) {
        // Swap positions atomically within the serializable transaction
        await tx.token.update({ where: { id: token.id }, data: { position: previousToken.position } });
        await tx.token.update({ where: { id: previousToken.id }, data: { position: token.position } });
        getIO().to(`queue-${token.queueId}`).emit('queue-updated', { type: 'REORDER' });
      }
    }, {
      isolationLevel: 'Serializable'
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid token') {
      res.status(400).json({ success: false, error: 'Invalid token' });
      return;
    }
    next(error);
  }
};

export const moveDown = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    
    await prisma.$transaction(async (tx) => {
      const token = await tx.token.findUnique({ where: { id } });
      if (!token || token.status !== 'WAITING') {
        throw new Error('Invalid token');
      }

      const nextToken = await tx.token.findFirst({
        where: {
          queueId: token.queueId,
          status: 'WAITING',
          position: { gt: token.position }
        },
        orderBy: { position: 'asc' }
      });

      if (nextToken) {
        // Swap positions atomically within the serializable transaction
        await tx.token.update({ where: { id: token.id }, data: { position: nextToken.position } });
        await tx.token.update({ where: { id: nextToken.id }, data: { position: token.position } });
        getIO().to(`queue-${token.queueId}`).emit('queue-updated', { type: 'REORDER' });
      }
    }, {
      isolationLevel: 'Serializable'
    });

    res.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === 'Invalid token') {
      res.status(400).json({ success: false, error: 'Invalid token' });
      return;
    }
    next(error);
  }
};
