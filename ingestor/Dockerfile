FROM node:20-alpine
RUN apk add --no-cache wget curl tzdata
WORKDIR /app
COPY package.json .
RUN npm install --omit=dev && npm cache clean --force
COPY src/ ./src/

ENV NODE_ENV=production
ENV PORT=5055

EXPOSE 5055
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5055/health || exit 1

USER node
CMD ["node", "src/index.js"]