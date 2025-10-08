FROM node:20-alpine
WORKDIR /app

# Install dependencies first for better layer caching
COPY package.json ./
RUN npm install --no-audit --no-fund

# Copy the rest of the source code
COPY . .

# Build Next.js app
RUN npm run build

# Expose Next.js default port
EXPOSE 3000

# Start the production server
CMD ["npm", "run", "start"]

