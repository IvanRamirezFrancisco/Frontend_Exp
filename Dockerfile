# Build stage
FROM node:22.12.0-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM node:22.12.0-alpine

WORKDIR /app

# Install serve globally  
RUN npm install -g serve

# Copy built files
COPY --from=builder /app/dist ./dist

# Create a simple start script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'PORT=${PORT:-3000}' >> /start.sh && \
    echo 'echo "Starting server on port $PORT"' >> /start.sh && \
    echo 'serve -s dist -l $PORT' >> /start.sh && \
    chmod +x /start.sh

# Expose port
EXPOSE $PORT

# Start the server
CMD ["/start.sh"]