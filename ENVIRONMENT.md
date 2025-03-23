# MeowShare Environment Variables Reference

This document provides a comprehensive guide to all environment variables used in MeowShare. These variables control various aspects of the application's behavior across both frontend and backend services.

## Environment Files

- `.env` - Main environment file used by both services
- `ui/.env` - Frontend-specific environment variables (optional)

## Core Application Settings

| Variable | Service | Description | Default | Required |
|----------|---------|-------------|---------|----------|
| `DEMO_MODE` | Both | Enable demo mode with pre-filled credentials | `true` | No |
| `VITE_APP_NAME` | Frontend | Application name displayed in UI | `MeowShare` | No |
| `VITE_APP_VERSION` | Frontend | Application version | From package.json | No |

## Frontend Environment Variables

All frontend variables must be prefixed with `VITE_` to be accessible in the browser.

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | API endpoint URL | `/api` or `http://localhost:5000/api` | Yes |
| `VITE_DEMO_MODE` | Mirror of DEMO_MODE for frontend use | `false` | No |
| `VITE_DEBUG_MODE` | Enable additional console logging | `false` | No |
| `VITE_MAX_FILE_SIZE` | Maximum file size in bytes | `104857600` (100MB) | No |
| `VITE_CHUNK_SIZE` | Chunk size for file uploads in bytes | `5242880` (5MB) | No |
| `VITE_DEFAULT_EXPIRATION_DAYS` | Default file expiration in days | `7` | No |

## Backend Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `ADMIN_EMAIL` | Default admin email/username | `admin@yoursite.com` | Yes, if not in demo mode |
| `ADMIN_PASSWORD` | Default admin password | `YourSecurePassword123!` | Yes, if not in demo mode |
| `DB_PATH` | SQLite database file path | `./data/meowshare.db` | No |
| `UPLOAD_PATH` | File upload directory | `./uploads` | No |
| `VERBOSE_LOGGING` | Enable additional server logging | `false` | No |

## Docker Deployment Variables

These variables are used when deploying with Docker and docker-compose:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `FRONTEND_PORT` | Port to expose the frontend on host | `80` | No |
| `ASPNETCORE_ENVIRONMENT` | ASP.NET Core environment | `Production` | No |
| `ASPNETCORE_URLS` | ASP.NET Core listening URLs | `https://+:8080` | Yes, for backend |
| `CERT_PASSWORD` | SSL certificate password | `your_cert_password` | Yes, for production |

## Package Management Variables

Required only if using private NuGet packages:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NUGET_USERNAME` | NuGet repository username | None | Only for private packages |
| `NUGET_PASSWORD` | NuGet repository token/password | None | Only for private packages |
| `NUGET_SOURCE` | NuGet repository URL | None | Only for private packages |

## Development-Only Variables

These variables are typically only used during development:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `USE_API_PROXY` | Enable API proxy for development | `true` | No |
| `API_TARGET` | API target URL for proxy | `http://localhost:5000` | No |

## Environment Variable Precedence

Variables are loaded in the following order (later sources override earlier ones):
1. Default values in code
2. `.env` file in project root
3. Environment variables set in the system
4. Command line arguments

## Examples

### Production Environment
DEMO_MODE=false
VITE_APP_NAME=MeowShare
ADMIN_EMAIL=admin@company.com
ADMIN_PASSWORD=SecurePassword123!
CERT_PASSWORD=SecureCertificatePassword


### Development Environment
DEMO_MODE=true
VITE_API_URL=http://localhost:5000/api
USE_API_PROXY=true
ASPNETCORE_ENVIRONMENT=Development\

## Troubleshooting

- **Frontend can't connect to API**: Check `VITE_API_URL` is correctly set and matches backend URL
- **Demo mode not working**: Ensure `DEMO_MODE=true` and `VITE_DEMO_MODE=true` are both set
- **Changes to environment variables not taking effect**: Most variables require application restart or rebuild
