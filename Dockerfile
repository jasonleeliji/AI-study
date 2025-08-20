# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制后端package文件
COPY ./backend/package*.json ./backend/

# 安装后端依赖
RUN cd backend && npm ci --only=production

# 复制后端源代码
COPY ./backend ./backend

# 构建后端
RUN cd backend && npm run build

# 复制前端package文件
COPY ./frontend/package*.json ./frontend/

# 安装前端依赖
RUN cd frontend && npm ci

# 复制前端源代码
COPY ./frontend ./frontend

# 构建前端
RUN cd frontend && npm run build

# 创建上传目录
RUN mkdir -p backend/uploads

# 暴露端口 (后端API端口)
EXPOSE 5000

# 启动命令 - 启动后端服务
CMD ["sh", "-c", "cd backend && node dist/server.js"]