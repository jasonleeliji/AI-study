# OSS 直传配置指南

本文档说明如何配置阿里云 OSS 直传功能。

## 环境变量配置

### 后端配置 (backend/.env)

```bash
# 上传策略配置
# 'local' = 本地存储模式，'oss' = OSS直传模式
UPLOAD_STRATEGY=oss

# OSS 配置项（当 UPLOAD_STRATEGY=oss 时必需）
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_REGION=oss-cn-shanghai
OSS_BUCKET=your-bucket-name
OSS_HOST=https://your-bucket.oss-cn-shanghai.aliyuncs.com
OSS_EXPIRE_TIME=3600

# 后端服务URL（本地模式下的文件访问地址）
BACKEND_URL=http://localhost:5000
```

### 前端配置

**开发环境 (frontend/.env.development):**
```bash
VITE_BACKEND_URL=http://localhost:5000
```

**生产环境 (frontend/.env.production):**
```bash
VITE_BACKEND_URL=http://your-server-ip:5000
```

## OSS 配置步骤

### 1. 创建 OSS 存储桶

1. 登录阿里云控制台
2. 进入对象存储 OSS 服务
3. 创建新的存储桶（Bucket）
4. 设置存储桶权限为「公共读」
5. 配置跨域规则（CORS）

### 2. 配置跨域规则

在 OSS 控制台的跨域设置中添加以下规则：

```
来源: *
允许 Methods: GET, POST, PUT, DELETE, HEAD
允许 Headers: *
Expose Headers: ETag, x-oss-request-id
缓存时间: 0
```

### 3. 获取访问密钥

1. 进入阿里云 RAM 控制台
2. 创建新的 RAM 用户
3. 为用户分配 OSS 相关权限
4. 获取 AccessKey ID 和 AccessKey Secret

### 4. 配置环境变量

将获取到的信息填入后端 `.env` 文件：

```bash
UPLOAD_STRATEGY=oss
OSS_ACCESS_KEY_ID=你的AccessKey_ID
OSS_ACCESS_KEY_SECRET=你的AccessKey_Secret
OSS_REGION=oss-cn-shanghai  # 根据实际区域调整
OSS_BUCKET=你的存储桶名称
OSS_HOST=https://你的存储桶名称.oss-cn-shanghai.aliyuncs.com
OSS_EXPIRE_TIME=3600  # 签名有效期（秒）
```

## 使用说明

### 本地模式 (UPLOAD_STRATEGY=local)

- 文件上传到服务器本地 `uploads/` 目录
- 通过后端静态文件服务访问
- 适合开发环境和小规模部署

### OSS 模式 (UPLOAD_STRATEGY=oss)

- 前端直接上传到 OSS
- 减少服务器带宽和存储压力
- 适合生产环境和大规模部署

## 切换模式

只需修改 `UPLOAD_STRATEGY` 环境变量即可：

```bash
# 切换到本地模式
UPLOAD_STRATEGY=local

# 切换到 OSS 模式
UPLOAD_STRATEGY=oss
```

重启后端服务后生效。

## 注意事项

1. **安全性**: 请妥善保管 OSS 访问密钥，不要提交到代码仓库
2. **权限**: RAM 用户只需要 OSS 相关的最小权限
3. **域名**: 生产环境请使用自定义域名替换 OSS 默认域名
4. **备份**: 建议定期备份重要文件
5. **监控**: 关注 OSS 的使用量和费用

## 故障排除

### 上传失败

1. 检查 OSS 配置是否正确
2. 确认存储桶权限设置
3. 验证跨域规则配置
4. 检查网络连接

### 图片显示异常

1. 确认文件已成功上传到 OSS
2. 检查文件 URL 是否正确
3. 验证存储桶的公共读权限
4. 检查浏览器控制台错误信息