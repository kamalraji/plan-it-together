# Thittam1Hub

A unified event management and publishing platform designed to centralize the planning, management, tracking, and publishing of community or organizational events and projects.

## Project Structure

```
thittam1hub/
├── backend/          # Node.js/Express/TypeScript backend
│   ├── src/         # Source code
│   ├── prisma/      # Prisma schema and migrations
│   └── package.json
├── frontend/         # React/TypeScript frontend
│   ├── src/         # Source code
│   └── package.json
└── docker-compose.yml # Local development services
```

## Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose
- PostgreSQL 14+ (via Docker)

## Getting Started

### 1. Start Development Services

Start PostgreSQL and Redis using Docker Compose:

```bash
docker-compose up -d
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Start development server
npm run dev
```

The backend API will be available at `http://localhost:3000`

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Start development server
npm run dev
```

The frontend will be available at `http://localhost:5173`

## Development

### Backend Commands

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio

### Frontend Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier

## Technology Stack

### Backend
- Node.js with Express.js
- TypeScript
- Prisma ORM
- PostgreSQL
- JWT Authentication
- Bcrypt for password hashing

### Frontend
- React 18
- TypeScript
- Vite
- TanStack Query (React Query)
- React Router
- Tailwind CSS
- React Hook Form

### Development Services
- PostgreSQL 15
- Redis 7

## Environment Variables

### Backend (.env)
See `backend/.env.example` for required environment variables.

### Frontend (.env)
See `frontend/.env.example` for required environment variables.

## Payment System

**Current Status: Direct Payment Mode**

The marketplace currently operates in **direct payment mode**, where organizers and vendors arrange payments outside the platform. Integrated payment processing is planned for future implementation.

### How It Works

1. **Organizer** creates booking after accepting vendor quote
2. **Organizer** contacts vendor directly to arrange payment
3. **Payment** is made using organizer and vendor's preferred method
4. **Vendor** confirms payment received in the platform
5. **Service** proceeds as normal

### Supported Payment Methods

Since payments are handled directly between parties, any payment method can be used:
- Bank transfers
- Credit cards (directly with vendor)
- PayPal, Venmo, etc.
- Cash (for local services)
- Checks
- Any other mutually agreed method

### Benefits of Direct Payment

- ✅ **Flexibility** - Use any payment method
- ✅ **No platform fees** - No additional charges
- ✅ **Vendor control** - Vendors manage their own payment processing
- ✅ **Familiar process** - Similar to traditional business transactions

### Future: Integrated Payments

Integrated payment processing with escrow, automated payouts, and platform fees is planned for future implementation. This will be enabled via feature flags when ready.

For more details, see:
- `backend/PAYMENT_SYSTEM_STATUS.md` - Technical implementation details
- `PAYMENT_WORKFLOW_GUIDE.md` - User workflow guide

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## License

MIT
