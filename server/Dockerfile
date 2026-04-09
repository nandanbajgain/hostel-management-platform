FROM node:22-alpine

WORKDIR /app

COPY . .

# Install dependencies (postinstall runs prisma generate)
RUN npm install

# Build the application
RUN npm run build

EXPOSE 3001

# Run migrations and start server in production
CMD ["npm", "run", "start:render"]
