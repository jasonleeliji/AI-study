# Linux (Ubuntu) 部署指南

本指南将帮助您将AI学习监督系统部署到Ubuntu服务器上。

## 系统要求

- Ubuntu 18.04 或更高版本
- Node.js 16.x 或更高版本
- MongoDB 4.4 或更高版本
- PM2 (用于进程管理)
- Nginx (用于反向代理)

## 部署步骤

### 1. 安装系统依赖

```bash
# 更新系统包
sudo apt update && sudo apt upgrade -y

# 安装Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# 安装MongoDB
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org

# 启动MongoDB服务
sudo systemctl start mongod
sudo systemctl enable mongod

# 安装PM2
sudo npm install -g pm2

# 安装Nginx
sudo apt install -y nginx
```

### 2. 项目部署

```bash
# 克隆或上传项目到服务器
# 假设项目位于 /var/www/ai-study
cd /var/www/ai-study

# 安装后端依赖
cd backend
npm install --production

# 构建后端
npm run build

# 安装前端依赖
cd ../frontend
npm install

# 构建前端 (会自动使用 .env.production 配置)
npm run build
```

### 3. 环境变量配置

编辑后端环境变量文件：

```bash
cd /var/www/ai-study/backend
sudo nano .env
```

更新以下配置项：

```env
# 服务器配置
PORT=5000
FRONTEND_URL=http://your-domain.com

# 数据库配置
MONGO_URI=mongodb://localhost:27017/ai-study

# 其他配置保持不变...
```

编辑前端生产环境配置：

```bash
cd /var/www/ai-study/frontend
sudo nano .env.production
```

更新API地址：

```env
VITE_API_BASE_URL=http://your-domain.com:5000/api
```

### 4. 使用PM2启动后端服务

```bash
cd /var/www/ai-study/backend

# 启动后端服务
pm2 start dist/server.js --name "ai-study-backend"

# 设置开机自启
pm2 startup
pm2 save
```

### 5. 配置Nginx反向代理

创建Nginx配置文件：

```bash
sudo nano /etc/nginx/sites-available/ai-study
```

添加以下配置：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /var/www/ai-study/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API代理到后端
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # 静态资源（上传的文件）
    location /uploads {
        proxy_pass http://localhost:5000;
    }
}
```

启用站点并重启Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/ai-study /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 6. 防火墙配置

```bash
# 允许HTTP和HTTPS流量
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

### 7. SSL证书配置（可选但推荐）

使用Let's Encrypt获取免费SSL证书：

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## 验证部署

1. 检查后端服务状态：
   ```bash
   pm2 status
   curl http://localhost:5000/health
   ```

2. 检查前端访问：
   ```bash
   curl http://your-domain.com
   ```

3. 检查数据库连接：
   ```bash
   mongo
   show dbs
   ```

## 常见问题解决

### 文件权限问题

```bash
# 设置正确的文件权限
sudo chown -R www-data:www-data /var/www/ai-study
sudo chmod -R 755 /var/www/ai-study
```

### 端口占用问题

```bash
# 查看端口占用
sudo netstat -tlnp | grep :5000

# 杀死占用端口的进程
sudo kill -9 <PID>
```

### MongoDB连接问题

```bash
# 检查MongoDB状态
sudo systemctl status mongod

# 重启MongoDB
sudo systemctl restart mongod
```

## 维护命令

```bash
# 查看PM2日志
pm2 logs ai-study-backend

# 重启后端服务
pm2 restart ai-study-backend

# 更新代码后重新部署
cd /var/www/ai-study
git pull
cd backend && npm run build
cd ../frontend && npm run build
pm2 restart ai-study-backend
sudo systemctl reload nginx
```

## 注意事项

1. **环境变量安全**：确保 `.env` 文件权限设置为 600，避免敏感信息泄露
2. **数据库备份**：定期备份MongoDB数据
3. **日志监控**：定期检查PM2和Nginx日志
4. **系统更新**：定期更新系统和依赖包
5. **防火墙配置**：只开放必要的端口

部署完成后，您的AI学习监督系统就可以在Linux服务器上正常运行了！