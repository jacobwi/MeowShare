# MeowShare UI

A modern React application for sharing files securely, built with TypeScript and Vite.

## Features

- Secure file sharing with optional password protection
- Custom expiry dates for shared files
- File preview support
- Download tracking
- Debug mode for API request monitoring

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:

```bash
npm install
```

### Environment Setup

Copy the `.env.example` file to `.env` and update the values:

```bash
cp .env.example .env
```

Required environment variables:

- `VITE_API_URL`: API endpoint URL
- `VITE_DEBUG_MODE`: Enable/disable debug mode ("true"/"false")

### Development

Start the development server:

```bash
npm run dev
```

### Building for Production

```bash
npm run build
```

## Debug Mode

The application includes a debug interceptor for monitoring API requests. To use it:

1. Enable debug mode in your `.env`:

```
VITE_DEBUG_MODE=true
```

2. Or enable it programmatically:

```typescript
import { debugInterceptor } from "./utils/DebugInterceptor";
debugInterceptor.setDebugModeCallback(() => true);
```

The debug interceptor provides:

- Request/response logging
- Performance monitoring
- Error tracking
- Sanitized data logging (sensitive information is redacted)

## ESLint Configuration

The project uses a modern ESLint setup with TypeScript support. See `eslint.config.js` for the complete configuration.

## License

[MIT](LICENSE)
