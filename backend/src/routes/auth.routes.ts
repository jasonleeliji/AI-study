
import { Router } from 'express';
import { 
    registerUser, 
    loginUser, 
    getUserStatus, 
    sendVerificationCode, 
    verifyCode,
    changePassword,
    forgotPasswordSendCode,
    forgotPasswordVerifyCode,
    forgotPasswordReset
} from '../controllers/auth.controller';
import { protect } from '../middleware/auth.middleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/status', protect, getUserStatus);
router.post('/send-code', protect, sendVerificationCode);
router.post('/verify-code', protect, verifyCode);

// 修改密码
router.post('/change-password', protect, changePassword);

// 忘记密码相关路由
router.post('/forgot-password/send-code', forgotPasswordSendCode);
router.post('/forgot-password/verify-code', forgotPasswordVerifyCode);
router.post('/forgot-password/reset', forgotPasswordReset);

export default router;
