import { Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest, SubscriptionPlan } from '../types';
import { generateAlipayUrl, verifyAlipaySign } from '../services/alipay.service';
import { User, Subscription } from '../models';

export const createSubscriptionOrder = async (req: Request, res: Response, next: NextFunction) => {
    const authReq = req as AuthenticatedRequest;
    const { plan } = (req as any).body as { plan: string };
    const userId = authReq.user!.id;

    if (!plan || !['standard', 'pro'].includes(plan)) {
        return (res as any).status(400).json({ message: '无效的订阅计划' });
    }

    try {
        const { qrCode, outTradeNo } = await generateAlipayUrl(userId, plan as Exclude<SubscriptionPlan, 'trial' | 'none'>);

        // Here you could create a pending subscription record in your DB
        // with the outTradeNo for later verification.

        (res as any).json({ qrCode, orderId: outTradeNo });
    } catch (error) {
        next(error);
    }
};

export const handleAlipayWebhook = async (req: Request, res: Response, next: NextFunction) => {
    console.log('Received Alipay webhook:', (req as any).body);
    const params = (req as any).body;
    
    // For a real implementation, add robust validation here.
    // This is a simplified mock.
    const isVerified = verifyAlipaySign(params);

    if (isVerified && params.trade_status === 'TRADE_SUCCESS') {
        const outTradeNo = params.out_trade_no; // Your internal order ID
        const alipayTradeNo = params.trade_no; // Alipay's transaction ID
        
        // The out_trade_no should contain info to identify the user and plan.
        // e.g., 'sub-standard-USERID-TIMESTAMP'
        const [type, plan, userId] = outTradeNo.split('-');

        if (type !== 'sub' || !userId) {
            return (res as any).status(400).send('failure_invalid_order');
        }

        try {
            const user = await User.findByPk(userId);
            if (!user) return (res as any).status(404).send('failure_user_not_found');

            const now = new Date();
            const endDate = new Date(now.setMonth(now.getMonth() + 1));

            // Find existing subscription and update it, or create a new one
            const [subscription, created] = await Subscription.upsert({
                userId,
                plan,
                status: 'active',
                startDate: new Date(),
                endDate,
                alipayTradeNo,
            });

            console.log(`Successfully activated subscription for user ${userId}`);
            (res as any).status(200).send('success');
        } catch (error) {
            console.error('Webhook processing error:', error);
            (res as any).status(500).send('failure_server_error');
        }

    } else {
        console.log('Alipay webhook verification failed or trade not successful.');
        (res as any).status(400).send('failure');
    }
};