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
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
