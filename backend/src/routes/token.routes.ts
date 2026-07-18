import { Router } from 'express';
import { createToken, serveNext, cancelToken, moveUp, moveDown } from '../controllers/token.controller';
import { requireAuth } from '../middlewares/auth.middleware';

const router = Router();

router.use(requireAuth);

router.post('/queues/:id/tokens', createToken);
router.post('/queues/:id/serve-next', serveNext);

router.patch('/tokens/:id/cancel', cancelToken);
router.patch('/tokens/:id/move-up', moveUp);
router.patch('/tokens/:id/move-down', moveDown);

export default router;
