import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';
import { TokenStatus } from '@prisma/client';

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = req.user!.id;
    const { status, search, page = '1', limit = '50' } = req.query;

    const skip = (Number(page) - 1) * Number(limit);

    // Filter by queues that belong to this manager
    const queues = await prisma.queue.findMany({
      where: { managerId },
      select: { id: true }
    });
    
    const queueIds = queues.map(q => q.id);

    const whereClause: any = {
      queueId: { in: queueIds }
    };

    if (status && status !== 'ALL') {
      whereClause.status = status as TokenStatus;
    }

    if (search) {
      whereClause.OR = [
        { tokenNumber: { contains: String(search), mode: 'insensitive' } },
        { personName: { contains: String(search), mode: 'insensitive' } },
        { phone: { contains: String(search), mode: 'insensitive' } }
      ];
    }

    const tokens = await prisma.token.findMany({
      where: whereClause,
      include: {
        queue: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit)
    });

    const total = await prisma.token.count({ where: whereClause });

    res.json({
      status: 'success',
      data: {
        tokens,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(total / Number(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
