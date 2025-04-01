FROM mcr.microsoft.com/dotnet/sdk:9.0 AS backend-build
WORKDIR /app

# Install OpenSSL
RUN apt-get update && apt-get install -y openssl

# Copy backend project files
COPY ["src/MeowShare.Api/*.csproj", "MeowShare.Api/"]

# Configure NuGet source
ARG NUGET_APIKEY
ARG NUGET_SOURCE
RUN if [ -n "$NUGET_SOURCE" ]; then \
    dotnet nuget add source $NUGET_SOURCE \
    --name private-feed \
    --username "api" \
    --password $NUGET_APIKEY \
    --valid-authentication-types basic \
    --store-password-in-clear-text; \
    fi

# Restore backend dependencies
WORKDIR /app/MeowShare.Api
RUN dotnet restore

# Copy backend code
WORKDIR /app
COPY src/ .

# Build backend
WORKDIR /app/MeowShare.Api
RUN dotnet build -c Release -o /app/build

# Publish backend
RUN dotnet publish -c Release -o /app/publish /p:UseAppHost=false

# Generate self-signed certificate
RUN mkdir -p /app/publish/certs && \
    openssl req -x509 -newkey rsa:4096 -keyout /app/publish/certs/key.pem -out /app/publish/certs/cert.pem -days 365 -nodes -subj "/CN=localhost" && \
    openssl pkcs12 -export -out /app/publish/certs/cert.pfx -inkey /app/publish/certs/key.pem -in /app/publish/certs/cert.pem -passout pass:your_cert_password

# Frontend build stage
FROM node:20-alpine AS frontend-build
WORKDIR /app
COPY ui/package.json .
RUN npm install
COPY ui/ .

# Pass build-time environment variables to Vite
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

ARG VITE_APP_NAME
ENV VITE_APP_NAME=$VITE_APP_NAME

ARG VITE_DEMO_MODE
ENV VITE_DEMO_MODE=$VITE_DEMO_MODE

# Build the frontend application
RUN npm run build

# Final stage
FROM nginx:alpine
WORKDIR /app

# Install .NET runtime - use the correct package name for Alpine
RUN apk add --no-cache \
    aspnetcore9-runtime \
    && rm -rf /var/cache/apk/*

# Copy frontend files to nginx
COPY --from=frontend-build /app/dist /usr/share/nginx/html

# Copy backend files
COPY --from=backend-build /app/publish /app/backend
COPY --from=backend-build /app/publish/certs /app/certs
COPY --from=backend-build /app/MeowShare.Api/seed-data.yaml /app/backend/

# Configure nginx with proxy
RUN echo 'server { \
    listen 80; \
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
        proxy_pass https://localhost:8080; \
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

# Create startup script to run both services - Fix for proper newlines
RUN printf '#!/bin/sh\n\
# Start the backend in the background\n\
cd /app/backend\n\
export ASPNETCORE_ENVIRONMENT=Production\n\
export ASPNETCORE_URLS=https://+:8080\n\
export ASPNETCORE_Kestrel__Certificates__Default__Path=/app/certs/cert.pfx\n\
export ASPNETCORE_Kestrel__Certificates__Default__Password=your_cert_password\n\
dotnet MeowShare.Api.dll &\n\
\n\
# Start nginx in the foreground\n\
nginx -g "daemon off;"\n\
' > /app/start.sh

RUN chmod +x /app/start.sh

EXPOSE 80
CMD ["/app/start.sh"] 