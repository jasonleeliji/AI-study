# =================================================================
# STAGE 1: Build the backend application
# 在这个阶段，我们安装所有依赖（包括 dev），并进行编译
# =================================================================
FROM anolis-registry.cn-zhangjiakou.cr.aliyuncs.com/openanolis/node:18.17.1-23-minimal as builder
# 设置工作目录 
WORKDIR /app

# 复制 package 文件
COPY package*.json ./

# 【第1处修改】在安装依赖前，确保 package 文件属于 node 用户
RUN chown -R node:node .

# 安装所有依赖，用于构建
RUN npm install

# 复制所有源代码
COPY . .

# 【第2处修改】在编译前，确保所有源代码也属于 node 用户
RUN chown -R node:node .

# 运行构建命令
RUN npm run build

# =================================================================
# STAGE 2: Create the final, lean production image
# 在这个阶段，我们只拿走运行时需要的东西
# =================================================================
FROM  anolis-registry.cn-zhangjiakou.cr.aliyuncs.com/openanolis/node:18.17.1-23-minimal

# 设置工作目录
WORKDIR /app

# 从 builder 阶段，只复制编译后的 dist 目录
# 这一步复制过来的文件，其所有者默认会是 root
COPY --from=builder /app/dist ./dist

# 重新生成一个干净的、只包含生产依赖的 node_modules
# (或者从 builder 复制，但这样做更纯净)
COPY package*.json ./

# 【第3处修改】在安装生产依赖前，确保 package 文件属于 node 用户
# 这是解决 npm ci 失败的关键
RUN chown -R node:node .

RUN npm ci --only=production

# 暴露你的后端服务端口
EXPOSE 5000

# 定义容器启动时运行的命令
CMD ["node", "dist/server.js"]