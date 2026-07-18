import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/db';

export const getActivity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const managerId = req.user!.id;
    
    const activities = await prisma.activityLog.findMany({
      where: { managerId },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: {
        queue: {
          select: { name: true }
        }
      }
    });

    res.json({
      status: 'success',
      data: activities
    });
  } catch (error) {
    next(error);
  }
};
