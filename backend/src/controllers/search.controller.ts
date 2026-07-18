import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';

export const globalSearch = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = req.user!.id;
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.json({ status: 'success', data: { queues: [], tokens: [] } });
    }

    const [queues, tokens] = await Promise.all([
      prisma.queue.findMany({
        where: {
          managerId,
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: 5
      }),
      prisma.token.findMany({
        where: {
          queue: { managerId },
          OR: [
            { tokenNumber: { contains: q, mode: 'insensitive' } },
            { personName: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } }
          ]
        },
        include: { queue: { select: { name: true } } },
        take: 10
      })
    ]);

    res.json({
      status: 'success',
      data: {
        queues,
        tokens
      }
    });
  } catch (error) {
    next(error);
  }
};
