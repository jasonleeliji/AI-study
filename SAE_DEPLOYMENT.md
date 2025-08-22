# 部署到阿里云SAE指南

本文档介绍如何将AI学习监督系统部署到阿里云Serverless应用引擎(SAE)。采用前后端分离部署方案。

## 前提条件

1. 已注册阿里云账号
2. 已开通SAE服务
3. 已开通容器镜像服务ACR
4. 已安装Docker本地环境

## 部署架构

采用前后端分离部署架构：
1. 前端应用构建为静态文件，通过CDN或对象存储服务提供访问
2. 后端应用构建为Docker镜像，部署到SAE
3. 前后端通过API进行通信

## 部署步骤

### 1. 构建前端静态文件

在前端目录执行以下命令构建静态文件：

```bash
cd frontend

# 安装依赖
npm install

# 构建静态文件
npm run build

# 构建后的文件位于 dist 目录
```

构建完成后，将`dist`目录中的文件部署到CDN或对象存储服务中。

### 2. 构建后端Docker镜像

在后端目录执行以下命令构建Docker镜像：

```bash
cd backend

# 构建镜像
docker build -t ai-study-backend .

# 测试本地运行
docker run -p 5000:5000 ai-study-backend
```

### 3. 推送后端镜像到阿里云容器镜像服务

```bash
# 登录阿里云镜像仓库
docker login --username=[你的用户名] registry.cn-hangzhou.aliyuncs.com

# 重新标记镜像
docker tag ai-study-backend registry.cn-hangzhou.aliyuncs.com/[你的命名空间]/ai-study-backend:[版本号]

# 推送镜像
docker push registry.cn-hangzhou.aliyuncs.com/[你的命名空间]/ai-study-backend:[版本号]
```

### 4. 在SAE中创建后端应用

1. 登录阿里云控制台，进入SAE服务
2. 点击"创建应用"
3. 选择部署方式：
   - 部署方式：选择"镜像部署"
   - 应用名称：ai-study-backend
   - CPU：1核（根据实际需求调整）
   - 内存：2GB（根据实际需求调整）
   - 实例数：1（根据实际需求调整）

4. 配置镜像信息：
   - 镜像方式：选择"阿里云镜像仓库"或"自定义镜像"
   - 镜像地址：registry.cn-hangzhou.aliyuncs.com/[你的命名空间]/ai-study-backend:[版本号]
   - 启动命令：保持默认（镜像中的CMD会自动执行）
   - 技术栈：选择"Node.js"，版本选择"18"或"20"

5. 环境变量配置：
   ```
   PORT=5000
   NODE_ENV=production
   JWT_SECRET=your-jwt-secret
   FRONTEND_URL=https://your-frontend-domain.com
   
   # 数据库配置 - 云原生部署
   CLOUD_NATIVE_DB_PATH=/app/data/database.sqlite
   
   # AI服务配置
   QWEN_API_KEY=your-qwen-api-key
   QWEN_API_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
   
   # 支付配置
   ALIPAY_APP_ID=your-alipay-app-id
   ALIPAY_PRIVATE_KEY=your-alipay-private-key
   ALIPAY_PUBLIC_KEY=your-alipay-public-key
   ALIPAY_GATEWAY_URL=https://openapi.alipay.com/gateway.do
   USE_MOCK_PAYMENT=false
   
   # 上传配置
   UPLOAD_STRATEGY=oss
   OSS_ACCESS_KEY_ID=your-oss-access-key-id
   OSS_ACCESS_KEY_SECRET=your-oss-access-key-secret
   OSS_REGION=oss-cn-hangzhou
   OSS_BUCKET=your-bucket-name
   OSS_HOST=https://your-bucket.oss-cn-hangzhou.aliyuncs.com
   OSS_EXPIRE_TIME=3600
   
   # 管理员配置
   ADMIN_PHONE=your-admin-phone
   ADMIN_KEY=your-admin-key
   ```

6. 端口配置：
   - 容器端口：5000
   - 协议：HTTP

7. 存储卷配置（用于持久化SQLite数据库）：
   - 存储类型：NAS文件存储
   - 挂载路径：/app/data
   - 容器路径：/app/data
   - 说明：SQLite数据库文件将存储在 `/app/data/database.sqlite`
   
   注意：如果使用OSS存储文件，则不需要为上传文件配置额外的存储卷。
   如果使用本地存储（UPLOAD_STRATEGY=local），则需要额外配置：
   - 存储类型：NAS文件存储
   - 挂载路径：/app/uploads
   - 容器路径：/app/backend/uploads

### 5. 配置公网访问

1. 在应用详情页，点击"公网访问"
2. 申请公网SLB
3. 配置域名或使用系统分配的公网地址

### 6. 部署前端静态文件

有多种方式部署前端静态文件：

#### 方式一：使用阿里云对象存储OSS（推荐）

1. 创建OSS存储桶
2. 将前端构建生成的dist目录中的所有文件上传到OSS
3. 配置OSS静态网站托管
4. 绑定自定义域名（可选）

#### 方式二：创建单独的前端SAE应用

1. 创建Nginx镜像，包含前端静态文件
2. 部署到SAE作为一个独立应用
3. 配置路由规则

## 镜像优化说明

项目中添加了.dockerignore文件，用于在构建Docker镜像时排除不必要的文件和目录，减小镜像体积并提高构建速度。主要包括：

- node_modules目录
- 构建输出目录（dist等）
- 环境配置文件
- 日志文件
- IDE配置文件
- Git相关文件
- 测试相关文件
- 临时文件等

## 环境变量配置说明

部署时需要配置以下环境变量：

| 环境变量 | 说明 | 示例值 |
|---------|------|-------|
| PORT | 应用端口 | 5000 |
| JWT_SECRET | JWT密钥 | your-secret-key |
| DASHSCOPE_API_KEY | 阿里云DashScope API密钥 | sk-xxxxxx |
| ALIPAY_APP_ID | 支付宝应用ID | 2021000123456789 |
| ALIPAY_PRIVATE_KEY | 支付宝私钥 | -----BEGIN PRIVATE KEY-----... |
| ALIPAY_PUBLIC_KEY | 支付宝公钥 | -----BEGIN PUBLIC KEY-----... |

## 注意事项

1. SQLite数据库文件需要持久化存储，避免应用重启后数据丢失
2. 上传的文件存储在backend/uploads目录，也需要持久化存储
3. 确保环境变量配置正确，特别是API密钥等敏感信息
4. 前端应用需要配置正确的API地址指向后端服务
5. SAE应用重启后，未持久化的文件会丢失

## 监控和日志

1. 在SAE控制台可以查看应用的实时状态
2. 通过日志服务查看应用日志
3. 可以配置报警规则监控应用健康状态