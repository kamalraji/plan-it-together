import PDFDocument from 'pdfkit';
import { AnalyticsReport } from './analytics.service';
import { analyticsService } from './analytics.service';

export type ExportFormat = 'CSV' | 'PDF';

export interface ExportOptions {
  format: ExportFormat;
  includeCharts?: boolean;
}

export interface ExportResult {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}

export class ReportExportService {
  /**
   * Export analytics report in specified format
   * Requirements: 15.4
   */
  async exportReport(
    eventId: string,
    format: ExportFormat
  ): Promise<ExportResult> {
    // Get comprehensive analytics report
    const report = await analyticsService.getComprehensiveReport(eventId);

    if (format === 'CSV') {
      return this.exportToCSV(report);
    } else if (format === 'PDF') {
      return this.exportToPDF(report);
    } else {
      throw new Error(`Unsupported export format: ${format}`);
    }
  }

  /**
   * Generate CSV export
   * Requirements: 15.4
   */
  private async exportToCSV(report: AnalyticsReport): Promise<ExportResult> {
    const lines: string[] = [];

    // Header
    lines.push(`Event Analytics Report`);
    lines.push(`Event: ${report.eventName}`);
    lines.push(`Generated: ${report.generatedAt.toISOString()}`);
    lines.push('');

    // Summary Section
    lines.push('SUMMARY');
    lines.push('Metric,Value');
    lines.push(`Total Registrations,${report.summary.totalRegistrations}`);
    lines.push(`Confirmed Registrations,${report.summary.confirmedRegistrations}`);
    lines.push(`Total Attendance,${report.summary.totalAttendance}`);
    lines.push(`Overall Check-in Rate,${report.summary.overallCheckInRate.toFixed(2)}%`);
    lines.push(`Average Score,${report.summary.averageScore.toFixed(2)}`);
    lines.push(`Total Submissions,${report.summary.totalSubmissions}`);
    lines.push(`Total Judges,${report.summary.totalJudges}`);
    lines.push('');

    // Registration Over Time
    lines.push('REGISTRATIONS OVER TIME');
    lines.push('Date,Count,Cumulative Count');
    report.registrationOverTime.forEach((entry) => {
      lines.push(`${entry.date},${entry.count},${entry.cumulativeCount}`);
    });
    lines.push('');

    // Session Check-in Rates
    lines.push('SESSION CHECK-IN RATES');
    lines.push('Session,Total Registrations,Checked In,Check-in Rate (%)');
    report.sessionCheckInRates.forEach((session) => {
      lines.push(
        `${session.sessionName},${session.totalRegistrations},${session.checkedIn},${session.checkInRate.toFixed(2)}`
      );
    });
    lines.push('');

    // Score Distributions
    if (report.scoreDistributions.length > 0) {
      lines.push('SCORE DISTRIBUTIONS');
      lines.push('Range,Count,Percentage (%)');
      report.scoreDistributions.forEach((dist) => {
        lines.push(`${dist.range},${dist.count},${dist.percentage.toFixed(2)}`);
      });
      lines.push('');
    }

    // Judge Participation
    if (report.judgeParticipation.length > 0) {
      lines.push('JUDGE PARTICIPATION');
      lines.push('Judge Name,Assigned Submissions,Scored Submissions,Completion Rate (%)');
      report.judgeParticipation.forEach((judge) => {
        lines.push(
          `${judge.judgeName},${judge.assignedSubmissions},${judge.scoredSubmissions},${judge.completionRate.toFixed(2)}`
        );
      });
    }

    const csvContent = lines.join('\n');
    const buffer = Buffer.from(csvContent, 'utf-8');

    return {
      buffer,
      filename: `analytics-report-${report.eventId}-${Date.now()}.csv`,
      mimeType: 'text/csv',
    };
  }

  /**
   * Generate PDF export
   * Requirements: 15.4
   */
  private async exportToPDF(report: AnalyticsReport): Promise<ExportResult> {
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
            filename: `analytics-report-${report.eventId}-${Date.now()}.pdf`,
            mimeType: 'application/pdf',
          });
        });
        doc.on('error', reject);

        // Title
        doc.fontSize(20).text('Event Analytics Report', { align: 'center' });
        doc.moveDown();

        // Event Info
        doc.fontSize(14).text(`Event: ${report.eventName}`);
        doc.fontSize(10).text(`Generated: ${report.generatedAt.toLocaleString()}`);
        doc.moveDown(2);

        // Summary Section
        doc.fontSize(16).text('Summary', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(11);
        doc.text(`Total Registrations: ${report.summary.totalRegistrations}`);
        doc.text(`Confirmed Registrations: ${report.summary.confirmedRegistrations}`);
        doc.text(`Total Attendance: ${report.summary.totalAttendance}`);
        doc.text(`Overall Check-in Rate: ${report.summary.overallCheckInRate.toFixed(2)}%`);
        doc.text(`Average Score: ${report.summary.averageScore.toFixed(2)}`);
        doc.text(`Total Submissions: ${report.summary.totalSubmissions}`);
        doc.text(`Total Judges: ${report.summary.totalJudges}`);
        doc.moveDown(2);

        // Registration Over Time
        doc.fontSize(16).text('Registrations Over Time', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        // Table header
        const tableTop = doc.y;
        const col1X = 50;
        const col2X = 200;
        const col3X = 350;

        doc.text('Date', col1X, tableTop);
        doc.text('Count', col2X, tableTop);
        doc.text('Cumulative', col3X, tableTop);
        doc.moveDown(0.5);

        // Table rows (limit to first 10 for space)
        const regData = report.registrationOverTime.slice(0, 10);
        regData.forEach((entry) => {
          const y = doc.y;
          doc.text(entry.date, col1X, y);
          doc.text(entry.count.toString(), col2X, y);
          doc.text(entry.cumulativeCount.toString(), col3X, y);
          doc.moveDown(0.3);
        });

        if (report.registrationOverTime.length > 10) {
          doc.text(`... and ${report.registrationOverTime.length - 10} more entries`);
        }
        doc.moveDown(2);

        // Session Check-in Rates
        doc.fontSize(16).text('Session Check-in Rates', { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(10);

        report.sessionCheckInRates.forEach((session) => {
          doc.text(
            `${session.sessionName}: ${session.checkedIn}/${session.totalRegistrations} (${session.checkInRate.toFixed(2)}%)`
          );
          doc.moveDown(0.3);
        });
        doc.moveDown(2);

        // Score Distributions
        if (report.scoreDistributions.length > 0) {
          doc.fontSize(16).text('Score Distributions', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);

          report.scoreDistributions.forEach((dist) => {
            doc.text(
              `${dist.range}: ${dist.count} submissions (${dist.percentage.toFixed(2)}%)`
            );
            doc.moveDown(0.3);
          });
          doc.moveDown(2);
        }

        // Judge Participation
        if (report.judgeParticipation.length > 0) {
          // Add new page if needed
          if (doc.y > 650) {
            doc.addPage();
          }

          doc.fontSize(16).text('Judge Participation', { underline: true });
          doc.moveDown(0.5);
          doc.fontSize(10);

          report.judgeParticipation.forEach((judge) => {
            doc.text(
              `${judge.judgeName}: ${judge.scoredSubmissions}/${judge.assignedSubmissions} (${judge.completionRate.toFixed(2)}%)`
            );
            doc.moveDown(0.3);
          });
        }

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
   * Export multiple reports in batch
   */
  async exportBatchReports(
    eventIds: string[],
    format: ExportFormat
  ): Promise<ExportResult[]> {
    const results: ExportResult[] = [];

    for (const eventId of eventIds) {
      try {
        const result = await this.exportReport(eventId, format);
        results.push(result);
      } catch (error) {
        console.error(`Failed to export report for event ${eventId}:`, error);
        // Continue with other events
      }
    }

    return results;
  }
}

export const reportExportService = new ReportExportService();
