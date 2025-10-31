# Stage 1: Build the application
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install all dependencies, including devDependencies
RUN npm install

# Copy the rest of the application source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Create the production image
FROM node:18-alpine

WORKDIR /app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install only production dependencies
RUN npm install --omit=dev

# Copy the built application from the builder stage
COPY --from=builder /app/dist ./dist

# Expose the port the app runs on
EXPOSE 8080

# Command to run the application
CMD ["npm", "start"]
