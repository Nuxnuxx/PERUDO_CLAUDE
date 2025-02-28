# Build stage
FROM node:18-alpine as build-stage

# Set working directory
WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy all files
COPY . .

# Build the app
RUN npm run build

# Production stage
FROM nginx:stable-alpine as production-stage

# Copy built files from build stage to nginx serve directory
COPY --from=build-stage /app/dist /usr/share/nginx/html

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy and make the injection script executable
COPY inject-backend-url.sh /docker-entrypoint.d/30-inject-backend-url.sh
RUN chmod +x /docker-entrypoint.d/30-inject-backend-url.sh

# Expose port
EXPOSE 80

# Start nginx with environment variable for the backend URL
CMD ["nginx", "-g", "daemon off;"]