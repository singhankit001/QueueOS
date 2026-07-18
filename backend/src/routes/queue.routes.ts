import { Router } from 'express';
import { createQueue, getQueues, getQueueById, updateQueue, deleteQueue } from '../controllers/queue.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth); // All queue routes require auth

router.post('/', createQueue);
router.get('/', getQueues);
router.get('/:id', getQueueById);
router.put('/:id', updateQueue);
router.delete('/:id', deleteQueue);

export default router;
