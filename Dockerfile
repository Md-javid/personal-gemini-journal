FROM node:20-slim

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy application code and build client
COPY . .
RUN npm run build

# Cloud Run default port
EXPOSE 8080
ENV PORT=8080
ENV NODE_ENV=production

CMD ["npx", "tsx", "server/index.ts"]
