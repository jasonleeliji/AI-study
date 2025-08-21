# =================================================================
# STAGE 1: Build Stage
# =================================================================
# 依然从标准的 alpine 镜像开始，它默认用户是 node
FROM anolis-registry.cn-zhangjiakou.cr.aliyuncs.com/openanolis/node:18.17.1-23-minimal as builder

WORKDIR /app

# 【优化点1：高效缓存 + 解决权限】
# 使用 --chown 将 package 文件的所有权直接交给 node 用户
# 这样 npm install 就有权限了，而且这一步可以被缓存
COPY --chown=node:node package*.json ./

# 以 node 用户身份安装所有依赖
RUN npm install

# 【优化点2：高效缓存 + 解决权限】
# 同样，复制源代码时也直接变更所有权
# 这一层只有在代码变更时才会重新执行，不会破坏 npm install 的缓存
COPY --chown=node:node . .

# 以 node 用户身份运行构建
RUN npm run build


# =================================================================
# STAGE 2: Production Stage
# =================================================================
FROM anolis-registry.cn-zhangjiakou.cr.aliyuncs.com/openanolis/node:18.17.1-23-minimal

WORKDIR /app

# 【优化点3：减小镜像体积 + 解决权限】
# 只从 builder 阶段复制我们需要的构建产物和配置文件
# 同样使用 --chown 来确保文件属于 node 用户
COPY --chown=node:node --from=builder /app/dist ./dist
COPY --chown=node:node --from=builder /app/package.json ./package.json
COPY --chown=node:node --from=builder /app/package-lock.json ./package-lock.json

# 【优化点4：减小镜像体积】
# 在生产阶段，只安装生产依赖
# 之前 npm install 产生的包含 devDependencies 的 node_modules 被完美地抛弃了
RUN npm ci --only=production

# 切换到非 root 用户来运行，保障安全
USER node

EXPOSE 5000

CMD ["node", "dist/server.js"]