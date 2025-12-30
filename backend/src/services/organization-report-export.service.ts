import PDFDocument from 'pdfkit';
import { OrganizationAnalyticsReport } from '../types';
import { organizationAnalyticsService } from './organization-analytics.service';

export type OrganizationExportFormat = 'CSV' | 'PDF';

export interface OrganizationExportOptions {
  format: OrganizationExportFormat;
  includeCharts?: boolean;
}

export interface OrganizationExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export class OrganizationReportExportService {
  /**
   * Export organization analytics report in specified format
   * Requirements: 23.4
   */
  async exportOrganizationReport(
    organizationId: string,
    format: OrganizationExportFormat
  ): Promise<OrganizationExportResult> {
    // Get comprehensive analytics report
    const report = await organizationAnalyticsService.getOrganizationAnalyticsReport(organizationId);

    if (format === 'CSV') {
      return this.exportToCSV(report);
    } else if (format === 'PDF') {
      return this.exportToPDF(report);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate CSV export for organization data
   * Requirements: 23.4
   */
  private async exportToCSV(report: OrganizationAnalyticsReport): Promise<OrganizationExportResult> {
    const lines: string[] = [];

    // Header
    lines.push(`Organization Analytics Report`);
    lines.push(`Organization: ${report.organizationName}`);
    lines.push(`Generated: ${report.generatedAt.toISOString()}`);
    lines.push('');

    // Summary Section
    lines.push('SUMMARY');
    lines.push('Metric,Value');
    lines.push(`Total Events,${report.summary.totalEvents}`);
    lines.push(`Total Followers,${report.summary.totalFollowers}`);
    lines.push(`Total Registrations,${report.summary.totalRegistrations}`);
    lines.push(`Total Attendance,${report.summary.totalAttendance}`);
    lines.push(`Average Attendance Rate,${report.summary.averageAttendanceRate.toFixed(2)}%`);
    lines.push(`Follower Growth Rate,${report.summary.followerGrowthRate.toFixed(2)}%`);
    
    if (report.summary.mostPopularEvent) {
      lines.push(`Most Popular Event,${report.summary.mostPopularEvent.eventName} (${report.summary.mostPopularEvent.registrationCount} registrations)`);
    } else {
      lines.push(`Most Popular Event,N/A`);
    }
    lines.push('');

    // Follower Growth Over Time
    lines.push('FOLLOWER GROWTH OVER TIME');
    lines.push('Month,New Followers');
    Object.entries(report.analytics.followerGrowth)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, count]) => {
        lines.push(`${month},${count}`);
      });
    lines.push('');

    // Event Performance
    lines.push('EVENT PERFORMANCE');
    lines.push('Event Name,Registrations,Attendance,Attendance Rate (%)');
    report.analytics.eventPerformance.forEach((event) => {
      lines.push(
        `"${event.eventName}",${event.registrationCount},${event.attendanceCount},${event.attendanceRate.toFixed(2)}`
      );
    });
    lines.push('');

    // Follower Demographics by Role
    lines.push('FOLLOWER DEMOGRAPHICS BY ROLE');
    lines.push('Role,Count');
    Object.entries(report.analytics.followerDemographics.byRole)
      .sort(([, a], [, b]) => b - a)
      .forEach(([role, count]) => {
        lines.push(`${role},${count}`);
      });
    lines.push('');

    // Follower Demographics by Registration Date
    lines.push('FOLLOWER DEMOGRAPHICS BY REGISTRATION DATE');
    lines.push('Month,Count');
    Object.entries(report.analytics.followerDemographics.byRegistrationDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .forEach(([month, count]) => {
        lines.push(`${month},${count}`);
      });
    lines.push('');

    // Additional Analytics
    lines.push('ADDITIONAL METRICS');
    lines.push('Metric,Value');
    lines.push(`Page Views,${report.analytics.pageViews}`);
    lines.push(`Average Registrations per Event,${report.analytics.totalEvents > 0 ? (report.analytics.totalRegistrations / report.analytics.totalEvents).toFixed(2) : 0}`);
    lines.push(`Average Attendance per Event,${report.analytics.totalEvents > 0 ? (report.analytics.totalAttendance / report.analytics.totalEvents).toFixed(2) : 0}`);

    const csvContent = lines.join('\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    return {
      buffer,
      filename: `organization-analytics-${report.organizationId}-${Date.now()}.csv`,
      mimeType: 'text/csv',
    };
  }

  /**
   * Generate PDF export for organization data
   * Requirements: 23.4
   */
  private async exportToPDF(report: OrganizationAnalyticsReport): Promise<OrganizationExportResult> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            filename: `organization-analytics-${report.organizationId}-${Date.now()}.pdf`,
            mimeType: 'application/pdf',
          });
        });
        doc.on('error', reject);

        // Title
        doc.fontSize(20).text('Organization Analytics Report', { align: 'center' });
        doc.moveDown();

        // Organization Info
        doc.fontSize(14).text(`Organization: ${report.organizationName}`);
        doc.fontSize(10).text(`Generated: ${report.generatedAt.toLocaleString()}`);
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Total Events: ${report.summary.totalEvents}`);
        doc.text(`Total Followers: ${report.summary.totalFollowers}`);
        doc.text(`Total Registrations: ${report.summary.totalRegistrations}`);
        doc.text(`Total Attendance: ${report.summary.totalAttendance}`);
        doc.text(`Average Attendance Rate: ${report.summary.averageAttendanceRate.toFixed(2)}%`);
        doc.text(`Follower Growth Rate: ${report.summary.followerGrowthRate.toFixed(2)}%`);
        
        if (report.summary.mostPopularEvent) {
          doc.text(`Most Popular Event: ${report.summary.mostPopularEvent.eventName} (${report.summary.mostPopularEvent.registrationCount} registrations)`);
        } else {
          doc.text(`Most Popular Event: N/A`);
        }
        doc.moveDown(2);

        // Follower Growth Over Time
        doc.fontSize(16).text('Follower Growth Over Time', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        // Table header
        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 200;

        doc.text('Month', col1X, tableTop);
        doc.text('New Followers', col2X, tableTop);
        doc.moveDown(0.5);

        // Table rows (limit to first 12 months for space)
        const followerGrowthEntries = Object.entries(report.analytics.followerGrowth)
          .sort(([a], [b]) => a.localeCompare(b))
          .slice(0, 12);

        followerGrowthEntries.forEach(([month, count]) => {
          const y = doc.y;
          doc.text(month, col1X, y);
          doc.text(count.toString(), col2X, y);
          doc.moveDown(0.3);
        });

        if (Object.keys(report.analytics.followerGrowth).length > 12) {
          doc.text(`... and ${Object.keys(report.analytics.followerGrowth).length - 12} more months`);
        }
        doc.moveDown(2);

        // Event Performance
        doc.fontSize(16).text('Event Performance', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        // Limit to top 10 events for space
        const topEvents = report.analytics.eventPerformance
          .sort((a, b) => b.registrationCount - a.registrationCount)
          .slice(0, 10);

        topEvents.forEach((event) => {
          doc.text(
            `${event.eventName}: ${event.registrationCount} registrations, ${event.attendanceCount} attendance (${event.attendanceRate.toFixed(2)}%)`
          );
          doc.moveDown(0.3);
        });

        if (report.analytics.eventPerformance.length > 10) {
          doc.text(`... and ${report.analytics.eventPerformance.length - 10} more events`);
        }
        doc.moveDown(2);

        // Add new page if needed
        if (doc.y > 650) {
          doc.addPage();
        }

        // Follower Demographics by Role
        doc.fontSize(16).text('Follower Demographics by Role', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        Object.entries(report.analytics.followerDemographics.byRole)
          .sort(([, a], [, b]) => b - a)
          .forEach(([role, count]) => {
            doc.text(`${role}: ${count} followers`);
            doc.moveDown(0.3);
          });
        doc.moveDown(2);

        // Additional Metrics
        doc.fontSize(16).text('Additional Metrics', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);
        
        const avgRegistrationsPerEvent = report.analytics.totalEvents > 0 
          ? (report.analytics.totalRegistrations / report.analytics.totalEvents).toFixed(2) 
          : '0';
        const avgAttendancePerEvent = report.analytics.totalEvents > 0 
          ? (report.analytics.totalAttendance / report.analytics.totalEvents).toFixed(2) 
          : '0';

        doc.text(`Page Views: ${report.analytics.pageViews}`);
        doc.text(`Average Registrations per Event: ${avgRegistrationsPerEvent}`);
        doc.text(`Average Attendance per Event: ${avgAttendancePerEvent}`);

        // Footer
        doc.fontSize(8).text(
          `Report generated by Thittam1Hub on ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Export multiple organization reports in batch
   * Requirements: 23.4
   */
  async exportBatchOrganizationReports(
    organizationIds: string[],
    format: OrganizationExportFormat
  ): Promise<OrganizationExportResult[]> {
    const results: OrganizationExportResult[] = [];

    for (const orgId of organizationIds) {
      try {
        const result = await this.exportOrganizationReport(orgId, format);
        results.push(result);
      } catch (error) {
        console.error(`Failed to export report for organization ${orgId}:`, error);
        // Continue with other organizations
      }
    }

    return results;
  }

  /**
   * Export comparative report for multiple organizations
   * Requirements: 23.4
   */
  async exportComparativeReport(
    organizationIds: string[],
    format: OrganizationExportFormat
  ): Promise<OrganizationExportResult> {
    // Get reports for all organizations
    const reports = await organizationAnalyticsService.getBatchOrganizationAnalytics(organizationIds);

    if (format === 'CSV') {
      return this.exportComparativeCSV(reports);
    } else if (format === 'PDF') {
      return this.exportComparativePDF(reports);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate comparative CSV export
   */
  private async exportComparativeCSV(reports: OrganizationAnalyticsReport[]): Promise<OrganizationExportResult> {
    const lines: string[] = [];

    // Header
    lines.push(`Comparative Organization Analytics Report`);
    lines.push(`Generated: ${new Date().toISOString()}`);
    lines.push(`Organizations: ${reports.length}`);
    lines.push('');

    // Summary Comparison
    lines.push('ORGANIZATION COMPARISON');
    lines.push('Organization,Total Events,Total Followers,Total Registrations,Total Attendance,Avg Attendance Rate (%),Follower Growth Rate (%)');
    
    reports.forEach((report) => {
      lines.push(
        `"${report.organizationName}",${report.summary.totalEvents},${report.summary.totalFollowers},${report.summary.totalRegistrations},${report.summary.totalAttendance},${report.summary.averageAttendanceRate.toFixed(2)},${report.summary.followerGrowthRate.toFixed(2)}`
      );
    });
    lines.push('');

    // Top Performing Organizations
    lines.push('TOP PERFORMING ORGANIZATIONS BY REGISTRATIONS');
    lines.push('Rank,Organization,Total Registrations');
    
    const sortedByRegistrations = [...reports].sort((a, b) => b.summary.totalRegistrations - a.summary.totalRegistrations);
    sortedByRegistrations.forEach((report, index) => {
      lines.push(`${index + 1},"${report.organizationName}",${report.summary.totalRegistrations}`);
    });
    lines.push('');

    // Top Performing Organizations by Followers
    lines.push('TOP PERFORMING ORGANIZATIONS BY FOLLOWERS');
    lines.push('Rank,Organization,Total Followers');
    
    const sortedByFollowers = [...reports].sort((a, b) => b.summary.totalFollowers - a.summary.totalFollowers);
    sortedByFollowers.forEach((report, index) => {
      lines.push(`${index + 1},"${report.organizationName}",${report.summary.totalFollowers}`);
    });

    const csvContent = lines.join('\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    return {
      buffer,
      filename: `comparative-organization-analytics-${Date.now()}.csv`,
      mimeType: 'text/csv',
    };
  }

  /**
   * Generate comparative PDF export
   */
  private async exportComparativePDF(reports: OrganizationAnalyticsReport[]): Promise<OrganizationExportResult> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        // Collect PDF data
        doc.on('data', (chunk) => chunks.push(chunk));
        doc.on('end', () => {
          const buffer = Buffer.concat(chunks);
          resolve({
            buffer,
            filename: `comparative-organization-analytics-${Date.now()}.pdf`,
            mimeType: 'application/pdf',
          });
        });
        doc.on('error', reject);

        // Title
        doc.fontSize(20).text('Comparative Organization Analytics Report', { align: 'center' });
        doc.moveDown();

        // Report Info
        doc.fontSize(12).text(`Organizations: ${reports.length}`);
        doc.fontSize(10).text(`Generated: ${new Date().toLocaleString()}`);
        doc.moveDown(2);

        // Summary Table
        doc.fontSize(16).text('Organization Comparison', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(8);

        // Table headers
        const tableTop = doc.y;
        const orgCol = 50;
        const eventsCol = 150;
        const followersCol = 200;
        const regsCol = 250;
        const attCol = 300;
        const rateCol = 350;

        doc.text('Organization', orgCol, tableTop);
        doc.text('Events', eventsCol, tableTop);
        doc.text('Followers', followersCol, tableTop);
        doc.text('Registrations', regsCol, tableTop);
        doc.text('Attendance', attCol, tableTop);
        doc.text('Rate %', rateCol, tableTop);
        doc.moveDown(0.5);

        // Table rows (limit to prevent overflow)
        const limitedReports = reports.slice(0, 15);
        limitedReports.forEach((report) => {
          const y = doc.y;
          const orgName = report.organizationName.length > 15 
            ? report.organizationName.substring(0, 12) + '...' 
            : report.organizationName;
          
          doc.text(orgName, orgCol, y);
          doc.text(report.summary.totalEvents.toString(), eventsCol, y);
          doc.text(report.summary.totalFollowers.toString(), followersCol, y);
          doc.text(report.summary.totalRegistrations.toString(), regsCol, y);
          doc.text(report.summary.totalAttendance.toString(), attCol, y);
          doc.text(report.summary.averageAttendanceRate.toFixed(1), rateCol, y);
          doc.moveDown(0.3);
        });

        if (reports.length > 15) {
          doc.text(`... and ${reports.length - 15} more organizations`);
        }
        doc.moveDown(2);

        // Top Performers
        doc.fontSize(16).text('Top Performers by Registrations', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        const topByRegistrations = [...reports]
          .sort((a, b) => b.summary.totalRegistrations - a.summary.totalRegistrations)
          .slice(0, 5);

        topByRegistrations.forEach((report, index) => {
          doc.text(`${index + 1}. ${report.organizationName}: ${report.summary.totalRegistrations} registrations`);
          doc.moveDown(0.3);
        });

        doc.moveDown(1);

        doc.fontSize(16).text('Top Performers by Followers', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        const topByFollowers = [...reports]
          .sort((a, b) => b.summary.totalFollowers - a.summary.totalFollowers)
          .slice(0, 5);

        topByFollowers.forEach((report, index) => {
          doc.text(`${index + 1}. ${report.organizationName}: ${report.summary.totalFollowers} followers`);
          doc.moveDown(0.3);
        });

        // Footer
        doc.fontSize(8).text(
          `Report generated by Thittam1Hub on ${new Date().toLocaleString()}`,
          50,
          doc.page.height - 50,
          { align: 'center' }
        );

        // Finalize PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const organizationReportExportService = new OrganizationReportExportService();