import { getCommitteeConfig, getCommitteeColors } from '@/lib/committeeConfig';
import { Users, CheckCircle2, LayoutGrid } from 'lucide-react';

interface CommitteeHeaderCardProps {
  workspaceName: string;
  memberCount: number;
  tasksCompleted: number;
  tasksTotal: number;
  teamsCount: number;
}

export function CommitteeHeaderCard({
  workspaceName,
  memberCount,
  tasksCompleted,
  tasksTotal,
  teamsCount,
}: CommitteeHeaderCardProps) {
  const config = getCommitteeConfig(workspaceName);
  
  if (!config) {
    // Fallback for unrecognized committee types
    return (
      <div className="bg-card rounded-xl border border-border shadow-sm p-4 sm:p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-xl bg-secondary">
            <LayoutGrid className="h-6 w-6 text-secondary-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-lg font-semibold text-foreground">{workspaceName}</h2>
              <span className="px-2 py-0.5 text-xs font-medium bg-secondary text-secondary-foreground rounded-full">
                Committee
              </span>
            </div>
            <p className="text-sm text-muted-foreground">Manage committee operations and tasks</p>
          </div>
        </div>
      </div>
    );
  }

  const colors = getCommitteeColors(config.color);
  const Icon = config.icon;
  const progress = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0;

  return (
    <div className={`rounded-xl border ${colors.border} shadow-sm p-4 sm:p-6 bg-gradient-to-br from-card via-card to-transparent`}>
      <div className="flex items-start gap-4">
        <div className={`p-3 rounded-xl ${colors.bg}`}>
          <Icon className={`h-6 w-6 ${colors.icon}`} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h2 className="text-lg font-semibold text-foreground">{config.name}</h2>
            <span className={`px-2 py-0.5 text-xs font-medium ${colors.bg} ${colors.text} rounded-full`}>
              Committee
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{config.description}</p>
          
          {/* Stats Row */}
          <div className="flex flex-wrap items-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{memberCount} Members</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>{progress}% Complete</span>
            </div>
            {teamsCount > 0 && (
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <LayoutGrid className="h-4 w-4" />
                <span>{teamsCount} Teams</span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}
