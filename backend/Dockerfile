# Use Node LTS
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or pnpm-lock.yaml/yarn.lock)
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the source code
COPY . .

# Expose port
EXPOSE 8000

# Default command for dev
CMD ["npm", "run", "dev"]
