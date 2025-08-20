# 使用Node.js官方镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package文件
COPY package*.json ./

# 安装生产依赖
RUN npm ci --only=production

# 复制源代码
COPY . .

# 创建必要的目录
RUN mkdir -p uploads

# 构建应用
RUN npm run build

# 创建前端静态文件目录（用于挂载）
RUN mkdir -p ../frontend/dist

# 暴露端口
EXPOSE 5000

# 启动命令
CMD ["node", "dist/server.js"]