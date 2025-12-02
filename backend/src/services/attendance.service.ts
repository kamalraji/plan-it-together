import { PrismaClient } from '@prisma/client';
import * as QRCode from 'qrcode';
import {
  QRCodeData,
  AttendanceRecord,
  AttendanceReport,
  CheckInDTO,
} from '../types';

const prisma = new PrismaClient();

export class AttendanceService {
  /**
   * Generate QR code image for a registration
   */
  async generateQRCode(registrationId: string): Promise<QRCodeData> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Generate QR code as data URL
    const qrCodeDataUrl = await QRCode.toDataURL(registration.qrCode, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
      margin: 1,
    });

    return {
      code: registration.qrCode,
      imageUrl: qrCodeDataUrl,
      registrationId: registration.id,
    };
  }

  /**
   * Check in a participant using QR code
   */
  async checkIn(checkInData: CheckInDTO): Promise<AttendanceRecord> {
    const { qrCode, sessionId, volunteerId } = checkInData;

    // Validate QR code and get registration
    const registration = await this.validateQRCode(qrCode);

    if (!registration) {
      throw new Error('Invalid QR code');
    }

    // Check if already checked in for this session
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        registrationId: registration.id,
        sessionId: sessionId || null,
      },
    });

    if (existingAttendance) {
      throw new Error('Participant already checked in for this session');
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        registrationId: registration.id,
        sessionId: sessionId || null,
        checkInMethod: 'QR_SCAN',
        volunteerId: volunteerId || null,
      },
    });

    return this.mapAttendanceToRecord(attendance);
  }

  /**
   * Validate a QR code
   */
  async validateQRCode(qrCode: string): Promise<any> {
    const registration = await prisma.registration.findUnique({
      where: { qrCode },
      include: {
        event: true,
        user: true,
      },
    });

    return registration;
  }

  /**
   * Get attendance report for an event
   */
  async getAttendanceReport(eventId: string): Promise<AttendanceReport> {
    // Get all registrations for the event
    const registrations = await prisma.registration.findMany({
      where: { eventId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        attendance: true,
      },
    });

    const totalRegistrations = registrations.length;
    const attendedCount = registrations.filter(
      (reg) => reg.attendance.length > 0
    ).length;
    const checkInRate =
      totalRegistrations > 0 ? (attendedCount / totalRegistrations) * 100 : 0;

    const attendanceRecords = registrations.map((reg) => ({
      registrationId: reg.id,
      userId: reg.userId,
      userName: reg.user.name,
      userEmail: reg.user.email,
      status: reg.status,
      attended: reg.attendance.length > 0,
      checkInTime: reg.attendance[0]?.checkInTime || null,
      checkInMethod: reg.attendance[0]?.checkInMethod || null,
    }));

    return {
      eventId,
      totalRegistrations,
      attendedCount,
      checkInRate,
      attendanceRecords,
    };
  }

  /**
   * Get attendance records for a specific registration
   */
  async getRegistrationAttendance(
    registrationId: string
  ): Promise<AttendanceRecord[]> {
    const attendanceRecords = await prisma.attendance.findMany({
      where: { registrationId },
      orderBy: { checkInTime: 'desc' },
    });

    return attendanceRecords.map((record) =>
      this.mapAttendanceToRecord(record)
    );
  }

  /**
   * Manual check-in (without QR code)
   */
  async manualCheckIn(
    registrationId: string,
    volunteerId?: string,
    sessionId?: string
  ): Promise<AttendanceRecord> {
    const registration = await prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new Error('Registration not found');
    }

    // Check if already checked in for this session
    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        registrationId,
        sessionId: sessionId || null,
      },
    });

    if (existingAttendance) {
      throw new Error('Participant already checked in for this session');
    }

    // Create attendance record
    const attendance = await prisma.attendance.create({
      data: {
        registrationId,
        sessionId: sessionId || null,
        checkInMethod: 'MANUAL',
        volunteerId: volunteerId || null,
      },
    });

    return this.mapAttendanceToRecord(attendance);
  }

  /**
   * Get attendance statistics by session
   */
  async getSessionAttendance(
    eventId: string,
    sessionId: string
  ): Promise<{
    sessionId: string;
    totalAttendees: number;
    attendanceRecords: AttendanceRecord[];
  }> {
    const attendanceRecords = await prisma.attendance.findMany({
      where: {
        sessionId,
        registration: {
          eventId,
        },
      },
      include: {
        registration: {
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { checkInTime: 'desc' },
    });

    return {
      sessionId,
      totalAttendees: attendanceRecords.length,
      attendanceRecords: attendanceRecords.map((record) =>
        this.mapAttendanceToRecord(record)
      ),
    };
  }

  /**
   * Map database attendance to record format
   */
  private mapAttendanceToRecord(attendance: any): AttendanceRecord {
    return {
      id: attendance.id,
      registrationId: attendance.registrationId,
      sessionId: attendance.sessionId,
      checkInTime: attendance.checkInTime,
      checkInMethod: attendance.checkInMethod,
      volunteerId: attendance.volunteerId,
    };
  }
}

export const attendanceService = new AttendanceService();
