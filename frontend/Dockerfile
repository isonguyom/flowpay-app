# Use Node LTS
FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the frontend code
COPY . .

# Expose port for Vite dev server
EXPOSE 3000

# Run dev server
CMD ["npm", "run", "dev"]
