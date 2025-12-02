import { Router, Request, Response } from 'express';
import { attendanceService } from '../services/attendance.service';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { Permission } from '../services/permission.service';
import { CheckInDTO } from '../types';

const router = Router();

/**
 * POST /api/attendance/check-in
 * Check in a participant using QR code
 */
router.post(
  '/check-in',
  authenticate,
  requirePermission(Permission.CHECK_IN_PARTICIPANTS),
  async (req: Request, res: Response) => {
    try {
      const checkInData: CheckInDTO = {
        qrCode: req.body.qrCode,
        sessionId: req.body.sessionId,
        volunteerId: req.user?.userId,
      };

      const attendanceRecord = await attendanceService.checkIn(checkInData);

      res.status(201).json({
        success: true,
        data: attendanceRecord,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'CHECK_IN_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * POST /api/attendance/manual-check-in
 * Manually check in a participant
 */
router.post(
  '/manual-check-in',
  authenticate,
  requirePermission(Permission.CHECK_IN_PARTICIPANTS),
  async (req: Request, res: Response) => {
    try {
      const { registrationId, sessionId } = req.body;
      const volunteerId = req.user?.userId;

      const attendanceRecord = await attendanceService.manualCheckIn(
        registrationId,
        volunteerId,
        sessionId
      );

      res.status(201).json({
        success: true,
        data: attendanceRecord,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'MANUAL_CHECK_IN_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/attendance/events/:eventId/report
 * Get attendance report for an event
 */
router.get(
  '/events/:eventId/report',
  authenticate,
  requirePermission(Permission.VIEW_ATTENDANCE),
  async (req: Request, res: Response) => {
    try {
      const { eventId } = req.params;

      const report = await attendanceService.getAttendanceReport(eventId);

      res.json({
        success: true,
        data: report,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'REPORT_GENERATION_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/attendance/events/:eventId/sessions/:sessionId
 * Get attendance for a specific session
 */
router.get(
  '/events/:eventId/sessions/:sessionId',
  authenticate,
  requirePermission(Permission.VIEW_ATTENDANCE),
  async (req: Request, res: Response) => {
    try {
      const { eventId, sessionId } = req.params;

      const sessionAttendance = await attendanceService.getSessionAttendance(
        eventId,
        sessionId
      );

      res.json({
        success: true,
        data: sessionAttendance,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'SESSION_ATTENDANCE_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/attendance/registrations/:registrationId/qr-code
 * Get QR code for a registration
 */
router.get(
  '/registrations/:registrationId/qr-code',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { registrationId } = req.params;

      const qrCodeData = await attendanceService.generateQRCode(registrationId);

      res.json({
        success: true,
        data: qrCodeData,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'QR_CODE_GENERATION_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * GET /api/attendance/registrations/:registrationId
 * Get attendance records for a registration
 */
router.get(
  '/registrations/:registrationId',
  authenticate,
  async (req: Request, res: Response) => {
    try {
      const { registrationId } = req.params;

      const attendanceRecords =
        await attendanceService.getRegistrationAttendance(registrationId);

      res.json({
        success: true,
        data: attendanceRecords,
      });
    } catch (error: any) {
      res.status(400).json({
        success: false,
        error: {
          code: 'ATTENDANCE_FETCH_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

/**
 * POST /api/attendance/validate-qr
 * Validate a QR code without checking in
 */
router.post(
  '/validate-qr',
  authenticate,
  requirePermission(Permission.CHECK_IN_PARTICIPANTS),
  async (req: Request, res: Response) => {
    try {
      const { qrCode } = req.body;

      const registration = await attendanceService.validateQRCode(qrCode);

      if (!registration) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'INVALID_QR_CODE',
            message: 'QR code is not valid',
            timestamp: new Date().toISOString(),
          },
        });
      }

      return res.json({
        success: true,
        data: {
          valid: true,
          registration: {
            id: registration.id,
            eventId: registration.eventId,
            userName: registration.user.name,
            userEmail: registration.user.email,
            status: registration.status,
          },
        },
      });
    } catch (error: any) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'QR_VALIDATION_FAILED',
          message: error.message,
          timestamp: new Date().toISOString(),
        },
      });
    }
  }
);

export default router;
