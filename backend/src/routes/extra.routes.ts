import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.middleware';
import { getActivity } from '../controllers/activity.controller';
import { getHistory } from '../controllers/history.controller';
import { globalSearch } from '../controllers/search.controller';

const router = Router();

router.use(requireAuth);

router.get('/activity', getActivity);
router.get('/history', getHistory);
router.get('/search', globalSearch);

export default router;
