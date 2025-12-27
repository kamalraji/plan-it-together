export interface WorkspaceTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  eventSizeMin: number;
  eventSizeMax: number;
  complexity: 'SIMPLE' | 'MODERATE' | 'COMPLEX';
  structure: {
    roles: Array<{
      role: string;
      count: number;
      permissions: string[];
      description: string;
    }>;
    taskCategories: Array<{
      category: string;
      tasks: Array<{
        title: string;
        description: string;
        priority: string;
        estimatedHours: number;
      }>;
    }>;
    channels: Array<{
      name: string;
      type: string;
      description: string;
      members: string[];
    }>;
    milestones: Array<{
      name: string;
      description: string;
      daysFromStart: number;
    }>;
  };
  metadata: any;
  effectiveness: any;
  usageCount: number;
  averageRating: number;
  createdAt: string;
  updatedAt?: string;
}