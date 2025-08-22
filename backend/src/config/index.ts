import dotenv from 'dotenv';

dotenv.config();

const config = {
    port: 5000,
    jwtSecret: process.env.JWT_SECRET!,
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    adminPhone: process.env.ADMIN_PHONE!,
    qwenApiKey: process.env.QWEN_API_KEY!,
    qwenApiBaseUrl: process.env.QWEN_API_BASE_URL!,
    // 数据库配置
    database: {
        path: process.env.DATABASE_PATH || './database.sqlite',
        // 云原生部署时使用持久化存储路径
        cloudNativePath: process.env.CLOUD_NATIVE_DB_PATH || '/app/data/database.sqlite'
    },
    // 开发模式配置
    isDevelopment: process.env.NODE_ENV !== 'production',
    useMockPayment: process.env.USE_MOCK_PAYMENT === 'true',
    alipay: {
        appId: process.env.ALIPAY_APP_ID!,
        gatewayUrl: process.env.ALIPAY_GATEWAY_URL!,
        privateKey: process.env.ALIPAY_PRIVATE_KEY!,
        publicKey: process.env.ALIPAY_PUBLIC_KEY!,
    }
};

// Validate that all required environment variables are set
if (!config.jwtSecret || !config.frontendUrl || !config.adminPhone || !config.qwenApiKey || !config.qwenApiBaseUrl || !config.alipay.appId || !config.alipay.gatewayUrl) {
    console.error("FATAL ERROR: Required environment variables are not set.");
    (process as any).exit(1);
}


export default config;