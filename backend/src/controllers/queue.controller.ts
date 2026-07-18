import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { z } from 'zod';
import { getIO } from '../services/socket.service';

const queueSchema = z.object({
  name: z.string().min(2, "Queue name must be at least 2 characters"),
  description: z.string().optional()
});

export const createQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = queueSchema.parse(req.body);
    const managerId = (req as any).user.id;

    const queue = await prisma.queue.create({
      data: {
        name: data.name,
        description: data.description,
        managerId,
        metrics: {
          create: {} // Initialize empty metrics
        }
      }
    });

    const activity = await prisma.activityLog.create({
      data: {
        eventType: 'QUEUE_CREATED',
        description: `Queue "${queue.name}" created.`,
        managerId,
        queueId: queue.id
      }
    });
    
    // Notify manager
    getIO().to(`manager-${managerId}`).emit('ACTIVITY_ADDED', activity);

    res.status(201).json({ success: true, data: queue });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.issues[0].message });
      return;
    }
    next(error);
  }
};

export const getQueues = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = (req as any).user.id;
    
    const queues = await prisma.queue.findMany({
      where: { managerId },
      include: {
        _count: {
          select: { tokens: { where: { status: 'WAITING' } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: queues });
  } catch (error) {
    next(error);
  }
};

export const getQueueById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const managerId = (req as any).user.id;

    const queue = await prisma.queue.findFirst({
      where: { id, managerId },
      include: {
        metrics: true,
        tokens: {
          where: { status: 'WAITING' },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!queue) {
      res.status(404).json({ success: false, error: 'Queue not found' });
      return;
    }

    res.json({ success: true, data: queue });
  } catch (error) {
    next(error);
  }
};

export const updateQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const managerId = (req as any).user.id;
    const data = queueSchema.parse(req.body);

    const existingQueue = await prisma.queue.findFirst({ where: { id, managerId } });
    if (!existingQueue) {
      res.status(404).json({ success: false, error: 'Queue not found' });
      return;
    }

    const queue = await prisma.queue.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description
      }
    });

    res.json({ success: true, data: queue });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ success: false, error: error.issues[0].message });
      return;
    }
    next(error);
  }
};

export const deleteQueue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as { id: string };
    const managerId = (req as any).user.id;

    const existingQueue = await prisma.queue.findFirst({ where: { id, managerId } });
    if (!existingQueue) {
      res.status(404).json({ success: false, error: 'Queue not found' });
      return;
    }

    await prisma.queue.delete({ where: { id } });

    res.json({ success: true, data: { message: 'Queue deleted successfully' } });
  } catch (error) {
    next(error);
  }
};
