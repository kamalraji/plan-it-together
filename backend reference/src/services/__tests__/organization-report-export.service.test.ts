// Mock the analytics service
const mockAnalyticsService = {
  getOrganizationAnalyticsReport: jest.fn(),
  getBatchOrganizationAnalytics: jest.fn(),
};

jest.mock('../organization-analytics.service', () => ({
  organizationAnalyticsService: mockAnalyticsService,
}));

import { organizationReportExportService } from '../organization-report-export.service';

describe('OrganizationReportExportService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockReport = {
    organizationId: 'org-123',
    organizationName: 'Test Organization',
    generatedAt: new Date('2024-01-15T10:00:00Z'),
    analytics: {
      totalEvents: 5,
      totalFollowers: 100,
      totalRegistrations: 250,
      totalAttendance: 200,
      followerGrowth: {
        '2024-01': 50,
        '2024-02': 30,
        '2024-03': 20,
      },
      eventPerformance: [
        {
          eventId: 'event-1',
          eventName: 'Test Event 1',
          registrationCount: 100,
          attendanceCount: 80,
          attendanceRate: 80,
        },
        {
          eventId: 'event-2',
          eventName: 'Test Event 2',
          registrationCount: 150,
          attendanceCount: 120,
          attendanceRate: 80,
        },
      ],
      pageViews: 1000,
      followerDemographics: {
        byRole: {
          PARTICIPANT: 80,
          ORGANIZER: 20,
        },
        byRegistrationDate: {
          '2024-01': 60,
          '2024-02': 40,
        },
      },
    },
    summary: {
      totalEvents: 5,
      totalFollowers: 100,
      totalRegistrations: 250,
      totalAttendance: 200,
      averageAttendanceRate: 80,
      followerGrowthRate: 15,
      mostPopularEvent: {
        eventId: 'event-2',
        eventName: 'Test Event 2',
        registrationCount: 150,
      },
    },
  };

  describe('exportOrganizationReport', () => {
    it('should export CSV report successfully', async () => {
      mockAnalyticsService.getOrganizationAnalyticsReport.mockResolvedValue(mockReport);

      const result = await organizationReportExportService.exportOrganizationReport('org-123', 'CSV');

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/organization-analytics-org-123-\d+\.csv/);
      expect(result.buffer).toBeInstanceOf(Buffer);

      // Check that the CSV contains expected content
      const csvContent = result.buffer.toString('utf-8');
      expect(csvContent).toContain('Organization Analytics Report');
      expect(csvContent).toContain('Test Organization');
      expect(csvContent).toContain('Total Events,5');
      expect(csvContent).toContain('Total Followers,100');
      expect(csvContent).toContain('Test Event 1');
      expect(csvContent).toContain('Test Event 2');
    });

    it('should export PDF report successfully', async () => {
      mockAnalyticsService.getOrganizationAnalyticsReport.mockResolvedValue(mockReport);

      const result = await organizationReportExportService.exportOrganizationReport('org-123', 'PDF');

      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toMatch(/organization-analytics-org-123-\d+\.pdf/);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });

    it('should throw error for unsupported format', async () => {
      mockAnalyticsService.getOrganizationAnalyticsReport.mockResolvedValue(mockReport);

      await expect(
        organizationReportExportService.exportOrganizationReport('org-123', 'XML' as any)
      ).rejects.toThrow('Unsupported export format: XML');
    });
  });

  describe('exportBatchOrganizationReports', () => {
    it('should export multiple reports successfully', async () => {
      const report1 = { ...mockReport, organizationId: 'org-1', organizationName: 'Org 1' };
      const report2 = { ...mockReport, organizationId: 'org-2', organizationName: 'Org 2' };

      mockAnalyticsService.getOrganizationAnalyticsReport
        .mockResolvedValueOnce(report1)
        .mockResolvedValueOnce(report2);

      const results = await organizationReportExportService.exportBatchOrganizationReports(
        ['org-1', 'org-2'],
        'CSV'
      );

      expect(results).toHaveLength(2);
      expect(results[0].filename).toMatch(/organization-analytics-org-1-\d+\.csv/);
      expect(results[1].filename).toMatch(/organization-analytics-org-2-\d+\.csv/);
    });

    it('should continue with other organizations if one fails', async () => {
      const report2 = { ...mockReport, organizationId: 'org-2', organizationName: 'Org 2' };

      mockAnalyticsService.getOrganizationAnalyticsReport
        .mockRejectedValueOnce(new Error('Organization not found'))
        .mockResolvedValueOnce(report2);

      const results = await organizationReportExportService.exportBatchOrganizationReports(
        ['org-1', 'org-2'],
        'CSV'
      );

      expect(results).toHaveLength(1);
      expect(results[0].filename).toMatch(/organization-analytics-org-2-\d+\.csv/);
    });
  });

  describe('exportComparativeReport', () => {
    it('should export comparative CSV report successfully', async () => {
      const reports = [
        { ...mockReport, organizationId: 'org-1', organizationName: 'Org 1' },
        { ...mockReport, organizationId: 'org-2', organizationName: 'Org 2' },
      ];

      mockAnalyticsService.getBatchOrganizationAnalytics.mockResolvedValue(reports);

      const result = await organizationReportExportService.exportComparativeReport(
        ['org-1', 'org-2'],
        'CSV'
      );

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/comparative-organization-analytics-\d+\.csv/);
      expect(result.buffer).toBeInstanceOf(Buffer);

      const csvContent = result.buffer.toString('utf-8');
      expect(csvContent).toContain('Comparative Organization Analytics Report');
      expect(csvContent).toContain('Org 1');
      expect(csvContent).toContain('Org 2');
      expect(csvContent).toContain('ORGANIZATION COMPARISON');
    });

    it('should export comparative PDF report successfully', async () => {
      const reports = [
        { ...mockReport, organizationId: 'org-1', organizationName: 'Org 1' },
        { ...mockReport, organizationId: 'org-2', organizationName: 'Org 2' },
      ];

      mockAnalyticsService.getBatchOrganizationAnalytics.mockResolvedValue(reports);

      const result = await organizationReportExportService.exportComparativeReport(
        ['org-1', 'org-2'],
        'PDF'
      );

      expect(result.mimeType).toBe('application/pdf');
      expect(result.filename).toMatch(/comparative-organization-analytics-\d+\.pdf/);
      expect(result.buffer).toBeInstanceOf(Buffer);
      expect(result.buffer.length).toBeGreaterThan(0);
    });
  });
});