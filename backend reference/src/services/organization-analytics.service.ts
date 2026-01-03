import { PrismaClient } from '@prisma/client';
import { OrganizationAnalytics, OrganizationAnalyticsReport } from '../types';

const prisma = new PrismaClient();

export interface FollowerGrowthData {
  month: string;
  count: number;
  cumulativeCount: number;
}

export interface EventPerformanceData {
  eventId: string;
  eventName: string;
  registrationCount: number;
  attendanceCount: number;
  attendanceRate: number;
  startDate: Date;
  status: string;
}

export interface FollowerDemographics {
  byRole: Record<string, number>;
  byRegistrationDate: Record<string, number>;
}

export class OrganizationAnalyticsService {
  /**
   * Calculate total event count for an organization
   * Requirements: 23.1
   */
  async calculateTotalEventCount(organizationId: string): Promise<number> {
    const count = await prisma.event.count({
      where: { organizationId },
    });

    return count;
  }

  /**
   * Track follower growth over time
   * Requirements: 23.2
   */
  async calculateFollowerGrowthOverTime(organizationId: string): Promise<FollowerGrowthData[]> {
    const follows = await prisma.follow.findMany({
      where: { organizationId },
      orderBy: { followedAt: 'asc' },
      select: {
        followedAt: true,
      },
    });

    // Group by month
    const monthMap = new Map<string, number>();
    follows.forEach((follow) => {
      const month = follow.followedAt.toISOString().substring(0, 7); // YYYY-MM
      monthMap.set(month, (monthMap.get(month) || 0) + 1);
    });

    // Convert to array and calculate cumulative counts
    const sortedMonths = Array.from(monthMap.keys()).sort();
    let cumulativeCount = 0;
    
    return sortedMonths.map((month) => {
      const count = monthMap.get(month) || 0;
      cumulativeCount += count;
      return {
        month,
        count,
        cumulativeCount,
      };
    });
  }

  /**
   * Calculate page views (placeholder - would need actual tracking)
   * Requirements: 23.2
   */
  async calculatePageViews(_organizationId: string): Promise<number> {
    // In a real implementation, this would query a page views tracking table
    // For now, return 0 as a placeholder
    return 0;
  }

  /**
   * Aggregate registration and attendance across all organization events
   * Requirements: 23.2
   */
  async aggregateRegistrationAndAttendance(organizationId: string): Promise<{
    totalRegistrations: number;
    totalAttendance: number;
  }> {
    const events = await prisma.event.findMany({
      where: { organizationId },
      include: {
        registrations: {
          include: {
            attendance: true,
          },
        },
      },
    });

    let totalRegistrations = 0;
    let totalAttendance = 0;

    events.forEach((event) => {
      totalRegistrations += event.registrations.length;
      
      // Count unique attendees (participants who have at least one attendance record)
      const attendedRegistrations = event.registrations.filter(
        (reg) => reg.attendance.length > 0
      );
      totalAttendance += attendedRegistrations.length;
    });

    return {
      totalRegistrations,
      totalAttendance,
    };
  }

  /**
   * Display follower demographics
   * Requirements: 23.3
   */
  async calculateFollowerDemographics(organizationId: string): Promise<FollowerDemographics> {
    const follows = await prisma.follow.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            role: true,
            createdAt: true,
          },
        },
      },
    });

    // Demographics by role
    const byRole: Record<string, number> = {};
    follows.forEach((follow) => {
      const role = follow.user.role;
      byRole[role] = (byRole[role] || 0) + 1;
    });

    // Demographics by registration date (by month)
    const byRegistrationDate: Record<string, number> = {};
    follows.forEach((follow) => {
      const month = follow.user.createdAt.toISOString().substring(0, 7); // YYYY-MM
      byRegistrationDate[month] = (byRegistrationDate[month] || 0) + 1;
    });

    return {
      byRole,
      byRegistrationDate,
    };
  }

  /**
   * Get detailed event performance data
   * Requirements: 23.2
   */
  async getEventPerformanceData(organizationId: string): Promise<EventPerformanceData[]> {
    const events = await prisma.event.findMany({
      where: { organizationId },
      include: {
        registrations: {
          include: {
            attendance: true,
          },
        },
      },
      orderBy: { startDate: 'desc' },
    });

    return events.map((event) => {
      const registrationCount = event.registrations.length;
      const attendanceCount = event.registrations.filter(
        (reg) => reg.attendance.length > 0
      ).length;
      const attendanceRate = registrationCount > 0 
        ? (attendanceCount / registrationCount) * 100 
        : 0;

      return {
        eventId: event.id,
        eventName: event.name,
        registrationCount,
        attendanceCount,
        attendanceRate,
        startDate: event.startDate,
        status: event.status,
      };
    });
  }

  /**
   * Get comprehensive organization analytics
   * Requirements: 23.1, 23.2, 23.3
   */
  async getOrganizationAnalytics(organizationId: string): Promise<OrganizationAnalytics> {
    // Verify organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Calculate all analytics in parallel
    const [
      totalEvents,
      followerGrowthData,
      pageViews,
      registrationAndAttendance,
      followerDemographics,
      eventPerformanceData,
    ] = await Promise.all([
      this.calculateTotalEventCount(organizationId),
      this.calculateFollowerGrowthOverTime(organizationId),
      this.calculatePageViews(organizationId),
      this.aggregateRegistrationAndAttendance(organizationId),
      this.calculateFollowerDemographics(organizationId),
      this.getEventPerformanceData(organizationId),
    ]);

    // Convert follower growth data to the expected format
    const followerGrowth: Record<string, number> = {};
    followerGrowthData.forEach((data) => {
      followerGrowth[data.month] = data.count;
    });

    // Convert event performance data to the expected format
    const eventPerformance = eventPerformanceData.map((event) => ({
      eventId: event.eventId,
      eventName: event.eventName,
      registrationCount: event.registrationCount,
      attendanceCount: event.attendanceCount,
      attendanceRate: event.attendanceRate,
    }));

    return {
      totalEvents,
      totalFollowers: organization.followerCount,
      totalRegistrations: registrationAndAttendance.totalRegistrations,
      totalAttendance: registrationAndAttendance.totalAttendance,
      followerGrowth,
      eventPerformance,
      pageViews,
      followerDemographics,
    };
  }

  /**
   * Get comprehensive organization analytics report
   * Requirements: 23.1, 23.2, 23.3
   */
  async getOrganizationAnalyticsReport(organizationId: string): Promise<OrganizationAnalyticsReport> {
    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!organization) {
      throw new Error('Organization not found');
    }

    // Get analytics data
    const analytics = await this.getOrganizationAnalytics(organizationId);

    // Calculate summary statistics
    const averageAttendanceRate = analytics.eventPerformance.length > 0
      ? analytics.eventPerformance.reduce((sum, event) => sum + event.attendanceRate, 0) / analytics.eventPerformance.length
      : 0;

    // Calculate follower growth rate (month-over-month)
    const followerGrowthValues = Object.values(analytics.followerGrowth);
    const followerGrowthRate = followerGrowthValues.length > 1
      ? ((followerGrowthValues[followerGrowthValues.length - 1] - followerGrowthValues[0]) / followerGrowthValues[0]) * 100
      : 0;

    // Find most popular event
    const mostPopularEvent = analytics.eventPerformance.length > 0
      ? analytics.eventPerformance.reduce((max, event) => 
          event.registrationCount > max.registrationCount ? event : max
        )
      : null;

    return {
      organizationId: organization.id,
      organizationName: organization.name,
      generatedAt: new Date(),
      analytics,
      summary: {
        totalEvents: analytics.totalEvents,
        totalFollowers: analytics.totalFollowers,
        totalRegistrations: analytics.totalRegistrations,
        totalAttendance: analytics.totalAttendance,
        averageAttendanceRate,
        followerGrowthRate,
        mostPopularEvent: mostPopularEvent ? {
          eventId: mostPopularEvent.eventId,
          eventName: mostPopularEvent.eventName,
          registrationCount: mostPopularEvent.registrationCount,
        } : null,
      },
    };
  }

  /**
   * Get analytics for multiple organizations (for admin dashboard)
   */
  async getBatchOrganizationAnalytics(organizationIds: string[]): Promise<OrganizationAnalyticsReport[]> {
    const reports: OrganizationAnalyticsReport[] = [];

    for (const orgId of organizationIds) {
      try {
        const report = await this.getOrganizationAnalyticsReport(orgId);
        reports.push(report);
      } catch (error) {
        console.error(`Failed to get analytics for organization ${orgId}:`, error);
        // Continue with other organizations
      }
    }

    return reports;
  }

  /**
   * Get trending organizations based on follower growth
   */
  async getTrendingOrganizations(limit: number = 10): Promise<Array<{
    organizationId: string;
    organizationName: string;
    followerCount: number;
    recentGrowth: number;
  }>> {
    // Get organizations with recent follower activity
    const organizations = await prisma.organization.findMany({
      where: {
        verificationStatus: 'VERIFIED',
        followerCount: { gt: 0 },
      },
      orderBy: { followerCount: 'desc' },
      take: limit * 2, // Get more to filter for recent growth
      include: {
        follows: {
          where: {
            followedAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
            },
          },
        },
      },
    });

    // Calculate recent growth and sort
    const trending = organizations
      .map((org) => ({
        organizationId: org.id,
        organizationName: org.name,
        followerCount: org.followerCount,
        recentGrowth: org.follows.length,
      }))
      .sort((a, b) => b.recentGrowth - a.recentGrowth)
      .slice(0, limit);

    return trending;
  }
}

export const organizationAnalyticsService = new OrganizationAnalyticsService();