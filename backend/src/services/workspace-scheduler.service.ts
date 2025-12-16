import { workspaceLifecycleService } from './workspace-lifecycle.service';

export class WorkspaceSchedulerService {
  private intervalId: NodeJS.Timeout | null = null;
  private readonly CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

  /**
   * Start the workspace dissolution scheduler
   */
  start(): void {
    if (this.intervalId) {
      console.log('Workspace scheduler is already running');
      return;
    }

    console.log('Starting workspace dissolution scheduler');
    
    // Run immediately on start
    this.processScheduledTasks();

    // Schedule regular checks
    this.intervalId = setInterval(() => {
      this.processScheduledTasks();
    }, this.CHECK_INTERVAL);
  }

  /**
   * Stop the workspace dissolution scheduler
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log('Workspace dissolution scheduler stopped');
    }
  }

  /**
   * Process scheduled workspace dissolution tasks
   */
  private async processScheduledTasks(): Promise<void> {
    try {
      console.log('Processing scheduled workspace dissolutions...');
      await workspaceLifecycleService.processScheduledDissolutions();
      console.log('Scheduled workspace dissolutions processed successfully');
    } catch (error) {
      console.error('Error processing scheduled workspace dissolutions:', error);
    }
  }

  /**
   * Manually trigger scheduled task processing (for testing)
   */
  async triggerManualProcessing(): Promise<void> {
    await this.processScheduledTasks();
  }

  /**
   * Get scheduler status
   */
  getStatus(): { running: boolean; nextRun?: Date } {
    const running = this.intervalId !== null;
    const nextRun = running ? new Date(Date.now() + this.CHECK_INTERVAL) : undefined;

    return {
      running,
      nextRun,
    };
  }
}

export const workspaceSchedulerService = new WorkspaceSchedulerService();