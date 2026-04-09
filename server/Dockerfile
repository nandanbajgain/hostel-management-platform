FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/
COPY tsconfig*.json ./
COPY nest-cli.json ./

# Install dependencies and generate Prisma client
RUN npm install

# Copy source code
COPY src ./src/
COPY scripts ./scripts/

# Build the application
RUN npm run build

EXPOSE 3001

# Set production environment and run migrations then start app
ENV NODE_ENV=production
CMD ["npm", "run", "start:render"]
