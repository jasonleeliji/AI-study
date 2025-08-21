# =================================================================
# STAGE 1: Build the backend application
# =================================================================
FROM anolis-registry.cn-zhangjiakou.cr.aliyuncs.com/openanolis/node:18.17.1-23-minimal as builder

WORKDIR /app

# 复制 package 文件。此时默认是 root 用户，文件所有者是 root
COPY package*.json ./

# 安装所有依赖，用于构建
# npm install 会在 node_modules 里创建大量文件，这些文件默认也属于 root
RUN npm install

# 复制所有源代码
COPY . .

# 【关键修复】现在，以 root 身份，把整个 /app 目录的所有权都交给 node 用户
USER root
RUN chown -R node:node .

# 【关键修复】切换回安全的 node 用户，来执行后续的构建操作
USER node

# 运行构建命令。现在 node 用户对自己拥有的文件进行操作，权限没问题。
RUN npm run build

# =================================================================
# STAGE 2: Create the final, lean production image
# =================================================================
FROM anolis-registry.cn-zhangjiakou.cr.aliyuncs.com/openanolis/node:18.17.1-23-minimal

WORKDIR /app

# 以 root 身份，从 builder 阶段复制文件
USER root
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/package-lock.json ./package-lock.json

# 【关键修复】在安装生产依赖前，把所有文件所有权交给 node 用户
RUN chown -R node:node .

# 【关键修复】切换回安全的 node 用户，来安装依赖和启动服务
USER node

# npm ci 现在以 node 用户身份，在自己拥有的目录里操作，权限没问题
RUN npm ci --only=production

EXPOSE 5000

CMD ["node", "dist/server.js"]