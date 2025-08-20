
import { Router } from 'express';
import { getChildProfile, updateChildProfile } from '../controllers/user.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.route('/profile').get(protect, getChildProfile).put(protect, updateChildProfile);

export default router;
