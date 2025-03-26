# Stage 1: Build the application
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files first to leverage Docker cache
COPY package.json package-lock.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Build the application (Vite-specific build command)
RUN npm run build

# Stage 2: Serve the application
FROM nginx:alpine

# Copy the built application from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy the custom nginx configuration for SPA
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]