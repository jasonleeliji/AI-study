// A real Alipay integration using their official SDK
// This implementation uses QR code payment (alipay.trade.precreate)
// which allows parents to scan a QR code with their mobile Alipay app to complete payment
// without needing to enter account details on the child's device.

const AlipaySdkModule = require('alipay-sdk');
const AlipaySdk = AlipaySdkModule.AlipaySdk;
import { SubscriptionPlan, getPlanDetails } from '../types';
import config from '../config';

/**
 * Format private key by removing extra spaces and adding proper line breaks
 * Supports both PKCS#1 and PKCS#8 formats
 */
const formatPrivateKey = (key: string): string => {
  if (!key) return '';
  
  // If key already has proper format, return as is
  if (key.includes('-----BEGIN') && key.includes('-----END')) {
    return key;
  }
  
  // Remove all whitespace and newlines from raw key
  let formattedKey = key.replace(/\s+/g, '');
  
  // Add line breaks every 64 characters
  formattedKey = formattedKey.match(/.{1,64}/g)?.join('\n') || formattedKey;
  
  // Try to detect the key format by decoding the base64 and checking ASN.1 structure
  try {
    const keyBuffer = Buffer.from(formattedKey, 'base64');
    // PKCS#1 RSA private keys start with 0x30 0x82 (SEQUENCE)
    // PKCS#8 private keys also start with 0x30 0x82 but have different structure
    
    // For Alipay SDK, let's try both formats and see which one works
    // First try PKCS#1 format (RSA PRIVATE KEY)
    const pkcs1Key = `-----BEGIN RSA PRIVATE KEY-----\n${formattedKey}\n-----END RSA PRIVATE KEY-----`;
    
    // Test if we can create a crypto object with this key
    const crypto = require('crypto');
    try {
      crypto.createSign('RSA-SHA256').update('test').sign(pkcs1Key);
      console.log('Using PKCS#1 RSA PRIVATE KEY format');
      return pkcs1Key;
    } catch (e) {
      // If PKCS#1 fails, try PKCS#8
      console.log('PKCS#1 failed, trying PKCS#8 format');
      const pkcs8Key = `-----BEGIN PRIVATE KEY-----\n${formattedKey}\n-----END PRIVATE KEY-----`;
      crypto.createSign('RSA-SHA256').update('test').sign(pkcs8Key);
      console.log('Using PKCS#8 PRIVATE KEY format');
      return pkcs8Key;
    }
  } catch (error) {
    console.error('Key format detection failed:', error);
    // Fallback to PKCS#1 format
    return `-----BEGIN RSA PRIVATE KEY-----\n${formattedKey}\n-----END RSA PRIVATE KEY-----`;
  }
};

/**
 * Format public key by removing extra spaces and adding proper line breaks
 */
const formatPublicKey = (key: string): string => {
  if (!key) return '';
  
  // If key already has proper format, return as is
  if (key.includes('-----BEGIN') && key.includes('-----END')) {
    return key;
  }
  
  // Remove all whitespace and newlines from raw key
  let formattedKey = key.replace(/\s+/g, '');
  
  // Add line breaks every 64 characters
  formattedKey = formattedKey.match(/.{1,64}/g)?.join('\n') || formattedKey;
  
  // Use standard PUBLIC KEY format
  return `-----BEGIN PUBLIC KEY-----\n${formattedKey}\n-----END PUBLIC KEY-----`;
};

// Format the keys
const privateKey = process.env.ALIPAY_PRIVATE_KEY 
  ? formatPrivateKey(process.env.ALIPAY_PRIVATE_KEY)
  : '';

const publicKey = process.env.ALIPAY_PUBLIC_KEY 
  ? formatPublicKey(process.env.ALIPAY_PUBLIC_KEY)
  : '';

/**
 * Initialize Alipay SDK
 */
let alipaySdk: any;
try {
  console.log('Initializing Alipay SDK with:');
  console.log('- AppId:', config.alipay.appId);
  console.log('- Gateway:', config.alipay.gatewayUrl);
  console.log('- Private Key length:', privateKey.length);
  console.log('- Public Key length:', publicKey.length);
  
  alipaySdk = new AlipaySdk({
    appId: config.alipay.appId,
    privateKey: privateKey,
    alipayPublicKey: publicKey,
    gateway: config.alipay.gatewayUrl,
    signType: 'RSA2', // 明确指定签名类型
    timeout: 30000, // 增加超时时间到30秒
    // 添加HTTP客户端配置
    httpAgent: {
      timeout: 30000,
      keepAlive: true,
      keepAliveTimeout: 30000,
      maxSockets: 160,
      maxFreeSockets: 160,
    },
  });
  
  console.log('Alipay SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Alipay SDK:', error);
  console.error('Private key format check:', privateKey.substring(0, 50) + '...');
  console.error('Public key format check:', publicKey.substring(0, 50) + '...');
  // In a real application, you might want to handle this more gracefully
  alipaySdk = null;
}

/**
 * Test network connectivity to Alipay gateway
 */
const testNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const https = require('https');
    const url = require('url');
    
    const gatewayUrl = config.alipay.gatewayUrl;
    const parsedUrl = url.parse(gatewayUrl);
    
    return new Promise((resolve) => {
      const req = https.request({
        hostname: parsedUrl.hostname,
        port: parsedUrl.port || 443,
        path: '/',
        method: 'HEAD',
        timeout: 10000,
      }, (res: any) => {
        console.log(`Network test to ${gatewayUrl}: ${res.statusCode}`);
        resolve(true);
      });
      
      req.on('error', (error: any) => {
        console.error(`Network test failed to ${gatewayUrl}:`, error.message);
        resolve(false);
      });
      
      req.on('timeout', () => {
        console.error(`Network test timeout to ${gatewayUrl}`);
        req.destroy();
        resolve(false);
      });
      
      req.end();
    });
  } catch (error) {
    console.error('Network test error:', error);
    return false;
  }
};

/**
 * Generate mock payment for development
 */
const generateMockPayment = async (userId: string, plan: Exclude<SubscriptionPlan, 'trial' | 'none'>) => {
    const planDetails = await getPlanDetails();
    const planInfo = planDetails[plan];
    const outTradeNo = `mock-${plan}-${userId}-${Date.now()}`;
    
    console.log('Using mock payment for development');
    
    // Generate a mock QR code (base64 encoded text)
    const mockQRContent = `mock://alipay/pay?orderId=${outTradeNo}&amount=${planInfo.price}&plan=${plan}`;
    
    return {
        qrCode: mockQRContent,
        outTradeNo,
        orderId: outTradeNo
    };
};

/**
 * Generates a real Alipay QR code payment URL
 * Uses alipay.trade.precreate method which is ideal for QR code payment
 */
export const generateAlipayUrl = async (userId: string, plan: Exclude<SubscriptionPlan, 'trial' | 'none'>) => {
    // 如果配置了使用模拟支付，直接返回模拟结果
    if (config.useMockPayment) {
        return generateMockPayment(userId, plan);
    }

    // Check if SDK is initialized
    if (!alipaySdk) {
        console.warn('Alipay SDK not initialized, falling back to mock payment');
        return generateMockPayment(userId, plan);
    }

    // Test network connectivity first
    console.log('Testing network connectivity to Alipay gateway...');
    const networkOk = await testNetworkConnectivity();
    if (!networkOk) {
        console.warn('Network connectivity failed, falling back to mock payment');
        return generateMockPayment(userId, plan);
    }

    const planDetails = await getPlanDetails();
    const planInfo = planDetails[plan];
    if (!planInfo) {
        throw new Error('Invalid plan specified');
    }

    // This is our unique order ID. We embed user and plan info for the webhook.
    const outTradeNo = `sub-${plan}-${userId}-${Date.now()}`;
    
    console.log('Creating Alipay order with params:', {
        outTradeNo,
        totalAmount: (planInfo.price / 100).toFixed(2),
        subject: `AI 作业监督员 - ${planInfo.name}`,
        appId: config.alipay.appId,
        gateway: config.alipay.gatewayUrl
    });
    
    try {
      // Create the order using Alipay SDK
      const result: any = await alipaySdk.exec('alipay.trade.precreate', {
          bizContent: {
              outTradeNo,
              totalAmount: (planInfo.price / 100).toFixed(2), // Convert from cents to yuan
              subject: `AI 作业监督员 - ${planInfo.name}`,
              timeoutExpress: '30m', // Order valid for 30 minutes
          }
      });

      console.log('Alipay API response:', {
        code: result.code,
        msg: result.msg,
        subCode: result.subCode,
        subMsg: result.subMsg
      });

      if (result.code !== '10000') {
          throw new Error(`Alipay API error: ${result.msg} (${result.subMsg || ''})`);
      }

      // Return the QR code content and order ID
      return { 
          qrCode: result.qrCode, 
          outTradeNo,
          orderId: outTradeNo 
      };
    } catch (error) {
      console.error('Alipay API call failed:', error);
      
      // 提供更详细的错误信息
      const errorMessage = (error as Error).message || '';
      if (errorMessage.includes('timeout')) {
        throw new Error(`支付处理超时: 网络连接超时，请稍后重试`);
      } else if (errorMessage.includes('ENOTFOUND') || errorMessage.includes('ECONNREFUSED')) {
        throw new Error(`支付处理失败: 无法连接到支付宝服务器`);
      } else {
        throw new Error(`支付处理失败: ${error instanceof Error ? error.message : '未知错误'}`);
      }
    }
};

/**
 * Verifies an incoming webhook request using Alipay SDK
 */
export const verifyAlipaySign = (params: any): boolean => {
    try {
        // Check if SDK is initialized
        if (!alipaySdk) {
            console.error('Alipay SDK not initialized');
            return false;
        }

        // Remove the sign and sign_type fields before verification
        const { sign, sign_type, ...paramsToVerify } = params;
        
        // Use Alipay SDK to verify signature
        return alipaySdk.checkNotifySign(paramsToVerify, sign);
    } catch (error) {
        console.error('Alipay signature verification failed:', error);
        return false;
    }
};