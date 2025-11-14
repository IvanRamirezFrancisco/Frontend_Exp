# Use Node.js 22.12.0 specifically
FROM node:22.12.0-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 4173

# Start the application
CMD ["npm", "run", "preview"]