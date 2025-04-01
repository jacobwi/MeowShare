FROM node:20-alpine AS build
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .

# Pass build-time environment variables to Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_DEMO_MODE
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE

# Build the application
RUN npm run build

# Production stage with NGINX
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html

# Create NGINX configuration with proxy for API
RUN echo 'server { \
    listen 3000; \
    \
    # Root directory for static files \
    root /usr/share/nginx/html; \
    index index.html; \
    \
    # Handle static files \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Proxy API requests \
    location /api/ { \
        proxy_pass https://backend:8080; \
        proxy_http_version 1.1; \
        proxy_set_header Host $host; \
        proxy_set_header X-Real-IP $remote_addr; \
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto $scheme; \
        \
        # Skip SSL verification for internal communication \
        proxy_ssl_verify off; \
    } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]