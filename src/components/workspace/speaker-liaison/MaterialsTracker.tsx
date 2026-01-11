import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  FileCheck,
  AlertCircle,
  Download,
  Loader2
} from 'lucide-react';
import { useMaterialsStats, useUpdateSpeaker } from '@/hooks/useSpeakerLiaisonData';
import { Workspace } from '@/types';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MaterialsTrackerProps {
  workspace?: Workspace;
}

export function MaterialsTracker({ workspace }: MaterialsTrackerProps) {
  const { materials, totalItems, approvedItems, submittedItems } = useMaterialsStats(workspace?.id);
  const updateSpeaker = useUpdateSpeaker(workspace?.id);

  const getStatusIcon = (status: { submitted: boolean | null; approved: boolean | null }) => {
    if (status.approved) return <FileCheck className="h-3 w-3 text-emerald-500" />;
    if (status.submitted) return <AlertCircle className="h-3 w-3 text-amber-500" />;
    return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
  };

  const calculateProgress = (material: typeof materials[0]) => {
    const items = [material.bio, material.photo, material.presentation, material.avRequirements];
    const approved = items.filter(i => i.approved).length;
    return (approved / items.length) * 100;
  };

  const handleApprove = async (speakerId: string, field: string) => {
    await updateSpeaker.mutateAsync({
      id: speakerId,
      [`${field}_approved`]: true,
    });
  };

  if (!workspace?.id) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Materials Tracker
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {approvedItems}/{totalItems} items approved • {submittedItems} submitted
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-3 w-3 mr-1" />
            Export All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {materials.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No speakers to track materials for
          </div>
        ) : (
          <>
            {/* Column Headers */}
            <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground px-3 pb-2 border-b border-border/50">
              <span>Speaker</span>
              <span className="text-center">Bio</span>
              <span className="text-center">Photo</span>
              <span className="text-center">Slides</span>
              <span className="text-center">A/V</span>
            </div>

            <TooltipProvider>
              {materials.map((material) => {
                const progress = calculateProgress(material);
                
                return (
                  <div
                    key={material.speakerId}
                    className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <div className="grid grid-cols-5 gap-2 items-center mb-2">
                      <span className="text-sm font-medium truncate">{material.speakerName}</span>
                      
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="flex justify-center cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => material.bio.submitted && !material.bio.approved && 
                              handleApprove(material.speakerId, 'bio')}
                          >
                            {getStatusIcon(material.bio)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {material.bio.approved ? 'Approved' : material.bio.submitted ? 'Click to approve' : 'Not submitted'}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="flex justify-center cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => material.photo.submitted && !material.photo.approved && 
                              handleApprove(material.speakerId, 'photo')}
                          >
                            {getStatusIcon(material.photo)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {material.photo.approved ? 'Approved' : material.photo.submitted ? 'Click to approve' : 'Not submitted'}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="flex justify-center cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => material.presentation.submitted && !material.presentation.approved && 
                              handleApprove(material.speakerId, 'presentation')}
                          >
                            {getStatusIcon(material.presentation)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {material.presentation.approved ? 'Approved' : material.presentation.submitted ? 'Click to approve' : 'Not submitted'}
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button 
                            className="flex justify-center cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => material.avRequirements.submitted && !material.avRequirements.approved && 
                              handleApprove(material.speakerId, 'av_requirements')}
                          >
                            {getStatusIcon(material.avRequirements)}
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          {material.avRequirements.approved ? 'Approved' : material.avRequirements.submitted ? 'Click to approve' : 'Not submitted'}
                        </TooltipContent>
                      </Tooltip>
                    </div>
                    <div className="flex items-center gap-2">
                      <Progress value={progress} className="h-1.5 flex-1" />
                      <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
                    </div>
                  </div>
                );
              })}
            </TooltipProvider>

            {/* Legend */}
            <div className="flex items-center gap-4 pt-2 border-t border-border/50 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Approved</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <span>Pending Review</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-muted" />
                <span>Not Submitted</span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
