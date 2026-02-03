import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import onboardingRoutes from './routes/onboarding.routes';
import eventRoutes from './routes/event.routes';
import registrationRoutes from './routes/registration.routes';
import attendanceRoutes from './routes/attendance.routes';
import communicationRoutes from './routes/communication.routes';
import judgingRoutes from './routes/judging.routes';
import certificateRoutes from './routes/certificate.routes';
import organizationRoutes from './routes/organization.routes';
import discoveryRoutes from './routes/discovery.routes';
import vendorRoutes from './routes/vendor.routes';
import marketplaceRoutes from './routes/marketplace.routes';
import bookingRoutes from './routes/booking.routes';
import paymentRoutes from './routes/payment.routes';
import serviceAgreementRoutes from './routes/service-agreement.routes';
import reviewRoutes from './routes/review.routes';
import eventMarketplaceIntegrationRoutes from './routes/event-marketplace-integration.routes';
import workspaceLifecycleRoutes from './routes/workspace-lifecycle.routes';
import workspaceRoutes from './routes/workspace.routes';
import teamRoutes from './routes/team.routes';
import taskRoutes from './routes/task.routes';
import workspaceCommunicationRoutes from './routes/workspace-communication.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files for certificates and QR codes
app.use('/storage', express.static('storage'));

// Health check endpoint
app.get('/health', async (_req, res) => {
  try {
    // Basic health check
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Health check failed',
    });
  }
});

// API health check endpoint
app.get('/api/health', async (_req, res) => {
  try {
    // More detailed health check including database connectivity
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();

    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      services: {
        database: 'ok',
        api: 'ok',
      },
      memory: process.memoryUsage(),
    };

    res.json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: 'error',
        api: 'ok',
      },
      error: 'Database connection failed',
    });
  }
});

// API routes
app.get('/api', (_req, res) => {
  res.json({ message: 'Thittam1Hub API' });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Onboarding routes
app.use('/api/onboarding', onboardingRoutes);

// Event routes
app.use('/api/events', eventRoutes);

// Registration routes
app.use('/api/registrations', registrationRoutes);

// Attendance routes
app.use('/api/attendance', attendanceRoutes);

// Communication routes
app.use('/api/communications', communicationRoutes);

// Judging routes
app.use('/api/judging', judgingRoutes);

// Certificate routes
app.use('/api/certificates', certificateRoutes);

// Organization routes
app.use('/api/organizations', organizationRoutes);

// Discovery routes
app.use('/api/discovery', discoveryRoutes);

// Vendor routes
app.use('/api/vendors', vendorRoutes);

// Marketplace routes
app.use('/api/marketplace', marketplaceRoutes);

// Booking routes
app.use('/api/bookings', bookingRoutes);

// Payment routes
app.use('/api/payments', paymentRoutes);

// Service Agreement routes
app.use('/api/service-agreements', serviceAgreementRoutes);

// Review routes
app.use('/api/reviews', reviewRoutes);

// Event-Marketplace Integration routes
app.use('/api/event-marketplace-integration', eventMarketplaceIntegrationRoutes);

// Workspace Lifecycle routes
app.use('/api/workspace-lifecycle', workspaceLifecycleRoutes);

// Workspace routes
app.use('/api/workspace', workspaceRoutes);

// Team Management routes
app.use('/api/team', teamRoutes);

// Task Management routes
app.use('/api/task', taskRoutes);

// Workspace Communication routes
app.use('/api/workspace-communication', workspaceCommunicationRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start workspace dissolution scheduler
  try {
    const { workspaceSchedulerService } = require('./services/workspace-scheduler.service');
    workspaceSchedulerService.start();
    console.log('Workspace dissolution scheduler started');
  } catch (error) {
    console.error('Failed to start workspace dissolution scheduler:', error);
  }
});

export default app;
