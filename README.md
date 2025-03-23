# MeowShare - Self-Hosted Deployment

MeowShare is a secure file sharing application that can be easily self-hosted using Docker. This guide explains how to deploy MeowShare in a production environment.

## Quick Start with Docker Compose

1. Create a directory for your MeowShare deployment:
   ```bash
   mkdir meowshare && cd meowshare
   ```

2. Download the production Docker Compose file:
   ```bash
   curl -O https://raw.githubusercontent.com/jacobwi/meowshare/master/docker-compose.production.yaml
   # or manually create the file as shown below
   ```

3. Create a `.env` file with your configuration:
   ```bash
   # Basic configuration
   FRONTEND_PORT=80
   VITE_APP_NAME=MeowShare
   
   # Optional: Set to "true" to enable demo mode
   DEMO_MODE=false
   ```

4. Start MeowShare:
   ```bash
   docker-compose -f docker-compose.production.yaml up -d
   ```

5. Access your MeowShare instance at http://your-server-ip (or the configured port)

## Docker Compose Configuration

The Docker Compose file for production uses the pre-built image and handles all necessary configuration:

```yaml
version: '3.8'

services:
  meowshare:
    image: registry.bcat.cloud/bcat/meowshare:latest
    ports:
      - "${FRONTEND_PORT:-80}:80"
    environment:
      - ASPNETCORE_ENVIRONMENT=Production
      - VITE_APP_NAME=${VITE_APP_NAME:-MeowShare}
    restart: unless-stopped
    volumes:
      # Mount volumes for persistent data storage
      - meowshare-uploads:/app/backend/uploads
      - meowshare-appdata:/app/backend/App_Data
      # Mount volume for the SQLite database
      - meowshare-db:/app/backend

volumes:
  meowshare-uploads:
    driver: local
  meowshare-appdata:
    driver: local
  meowshare-db:
    driver: local
```

## Data Persistence

MeowShare uses Docker volumes to ensure your data persists across container restarts and updates:

- `meowshare-uploads`: Stores all uploaded files
- `meowshare-appdata`: Stores application data
- `meowshare-db`: Contains the SQLite database

To backup your data, you can use Docker's volume commands:

```bash
# List volumes
docker volume ls

# Backup a volume
docker run --rm -v meowshare-uploads:/source -v $(pwd):/backup alpine tar -czf /backup/meowshare-uploads.tar.gz -C /source .
```

## Environment Variables

MeowShare can be customized using environment variables. For a complete list of all available variables, see:
- [Environment Variables Reference](ENVIRONMENT.md)

The main variables you might want to configure in your `.env` file are:

| Variable | Description | Default |
|----------|-------------|---------|
| `FRONTEND_PORT` | The port to expose the application on | 80 |
| `VITE_APP_NAME` | The name displayed in the UI | MeowShare |
| `DEMO_MODE` | Enable demo mode with sample data | false |
| `ADMIN_EMAIL` | Administrator email for login | admin@yoursite.com |
| `ADMIN_PASSWORD` | Administrator password | YourSecurePassword123! |

## Custom Domain with HTTPS

For production use, it's recommended to set up a reverse proxy (like Nginx or Traefik) to handle SSL termination:

```yaml
# Example Traefik configuration
services:
  meowshare:
    # ... existing configuration
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.meowshare.rule=Host(`meowshare.yourdomain.com`)"
      - "traefik.http.routers.meowshare.entrypoints=websecure"
      - "traefik.http.routers.meowshare.tls.certresolver=myresolver"
```

## Upgrading

To upgrade to the latest version:

```bash
# Pull the latest image
docker-compose -f docker-compose.production.yaml pull

# Restart the service
docker-compose -f docker-compose.production.yaml up -d
```

## Troubleshooting

### Logs

To view logs for troubleshooting:

```bash
docker-compose -f docker-compose.production.yaml logs -f
```

### Container Shell Access

To access a shell inside the container:

```bash
docker-compose -f docker-compose.production.yaml exec meowshare sh
```

## Building Your Own Image

If you prefer to build the image yourself instead of using the pre-built one:

1. Clone the repository
2. Use the provided build scripts:
   ```bash
   # Using Podman (default)
   ./build-and-push.sh
   
   # Using Docker
   ./build-and-push.sh docker
   ```
