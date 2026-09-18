FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Docker fija HOSTNAME=<id del contenedor> automáticamente, y server.js
# (standalone) usa esa variable para decidir en qué interfaz escuchar —
# sin esto el server queda inalcanzable incluso dentro del propio contenedor.
ENV HOSTNAME="0.0.0.0"
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
EXPOSE 3000
CMD ["node", "server.js"]
