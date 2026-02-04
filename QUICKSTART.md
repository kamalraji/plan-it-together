# Quick Start Guide

This guide will help you get Thittam1Hub up and running quickly.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **npm** (comes with Node.js)
- **Docker Desktop** - [Download](https://www.docker.com/products/docker-desktop/)

## Quick Setup

### Option 1: Automated Setup (Recommended)

**For Windows (PowerShell):**
```powershell
.\setup.ps1
```

**For macOS/Linux:**
```bash
chmod +x setup.sh
./setup.sh
```

This script will:
- Start PostgreSQL and Redis containers
- Install all dependencies
- Set up environment files
- Generate Prisma client
- Run database migrations

### Option 2: Manual Setup

#### 1. Start Docker Services

```bash
docker-compose up -d
```

This starts PostgreSQL and Redis in the background.

#### 2. Setup Backend

```bash
cd backend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate
```

#### 3. Setup Frontend

```bash
cd frontend

# Copy environment file
cp .env.example .env

# Install dependencies
npm install
```

## Running the Application

### Start Backend (Terminal 1)

```bash
cd backend
npm run dev
```

Backend will be available at: **http://localhost:3000**

### Start Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend will be available at: **http://localhost:5173**

## Verify Installation

1. Open your browser and navigate to **http://localhost:5173**
2. You should see the Thittam1Hub home page
3. Check the backend health endpoint: **http://localhost:3000/health**

## Development Services

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **PostgreSQL**: localhost:5432
  - Database: `thittam1hub`
  - User: `postgres`
  - Password: `postgres`
- **Redis**: localhost:6379

## Useful Commands

### Backend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code
npm run prisma:studio # Open Prisma Studio (database GUI)
```

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm test             # Run tests
npm run lint         # Lint code
npm run format       # Format code
```

### Docker

```bash
docker-compose up -d      # Start services
docker-compose down       # Stop services
docker-compose logs       # View logs
docker-compose ps         # List running services
```

## Troubleshooting

### Port Already in Use

If you get a "port already in use" error:

**Backend (port 3000):**
- Stop any other services using port 3000
- Or change the PORT in `backend/.env`

**Frontend (port 5173):**
- Stop any other Vite dev servers
- Or change the port in `frontend/vite.config.ts`

**PostgreSQL (port 5432):**
- Stop any local PostgreSQL instances
- Or change the port mapping in `docker-compose.yml`

### Database Connection Issues

If the backend can't connect to PostgreSQL:

1. Ensure Docker containers are running:
   ```bash
   docker-compose ps
   ```

2. Check PostgreSQL logs:
   ```bash
   docker-compose logs postgres
   ```

3. Verify the DATABASE_URL in `backend/.env` matches your setup

### Prisma Issues

If you encounter Prisma-related errors:

```bash
cd backend
npm run prisma:generate  # Regenerate Prisma client
npm run prisma:migrate   # Re-run migrations
```

## Next Steps

1. Review the [README.md](./README.md) for detailed documentation
2. Check the [design document](./.kiro/specs/thittam1hub/design.md) for architecture details
3. Review the [requirements](./.kiro/specs/thittam1hub/requirements.md) for feature specifications
4. Start implementing features from the [task list](./.kiro/specs/thittam1hub/tasks.md)

## Getting Help

If you encounter any issues:

1. Check the logs in both backend and frontend terminals
2. Review Docker container logs: `docker-compose logs`
3. Ensure all prerequisites are properly installed
4. Verify environment variables are correctly set

Happy coding! 🚀
