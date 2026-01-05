import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  FileCheck,
  AlertCircle,
  Download
} from 'lucide-react';

interface MaterialStatus {
  speakerId: string;
  speakerName: string;
  bio: { submitted: boolean; approved: boolean };
  photo: { submitted: boolean; approved: boolean };
  presentation: { submitted: boolean; approved: boolean };
  avRequirements: { submitted: boolean; approved: boolean };
}

export function MaterialsTracker() {
  const materials: MaterialStatus[] = [
    {
      speakerId: '1',
      speakerName: 'Dr. Sarah Chen',
      bio: { submitted: true, approved: true },
      photo: { submitted: true, approved: true },
      presentation: { submitted: true, approved: true },
      avRequirements: { submitted: true, approved: true },
    },
    {
      speakerId: '2',
      speakerName: 'James Wilson',
      bio: { submitted: true, approved: true },
      photo: { submitted: true, approved: false },
      presentation: { submitted: false, approved: false },
      avRequirements: { submitted: true, approved: true },
    },
    {
      speakerId: '3',
      speakerName: 'Maria Garcia',
      bio: { submitted: false, approved: false },
      photo: { submitted: false, approved: false },
      presentation: { submitted: false, approved: false },
      avRequirements: { submitted: false, approved: false },
    },
    {
      speakerId: '4',
      speakerName: 'Prof. Robert Kim',
      bio: { submitted: true, approved: true },
      photo: { submitted: true, approved: true },
      presentation: { submitted: true, approved: false },
      avRequirements: { submitted: true, approved: true },
    },
  ];

  const getStatusIcon = (status: { submitted: boolean; approved: boolean }) => {
    if (status.approved) return <FileCheck className="h-3 w-3 text-emerald-500" />;
    if (status.submitted) return <AlertCircle className="h-3 w-3 text-amber-500" />;
    return <AlertCircle className="h-3 w-3 text-muted-foreground" />;
  };


  const calculateProgress = (material: MaterialStatus) => {
    const items = [material.bio, material.photo, material.presentation, material.avRequirements];
    const approved = items.filter(i => i.approved).length;
    return (approved / items.length) * 100;
  };

  const totalApproved = materials.reduce((sum, m) => {
    const items = [m.bio, m.photo, m.presentation, m.avRequirements];
    return sum + items.filter(i => i.approved).length;
  }, 0);
  const totalItems = materials.length * 4;

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
              {totalApproved}/{totalItems} items approved
            </p>
          </div>
          <Button variant="outline" size="sm">
            <Download className="h-3 w-3 mr-1" />
            Export All
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Column Headers */}
        <div className="grid grid-cols-5 gap-2 text-xs text-muted-foreground px-3 pb-2 border-b border-border/50">
          <span>Speaker</span>
          <span className="text-center">Bio</span>
          <span className="text-center">Photo</span>
          <span className="text-center">Slides</span>
          <span className="text-center">A/V</span>
        </div>

        {materials.map((material) => {
          const progress = calculateProgress(material);
          
          return (
            <div
              key={material.speakerId}
              className="p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors"
            >
              <div className="grid grid-cols-5 gap-2 items-center mb-2">
                <span className="text-sm font-medium truncate">{material.speakerName}</span>
                <div className="flex justify-center">{getStatusIcon(material.bio)}</div>
                <div className="flex justify-center">{getStatusIcon(material.photo)}</div>
                <div className="flex justify-center">{getStatusIcon(material.presentation)}</div>
                <div className="flex justify-center">{getStatusIcon(material.avRequirements)}</div>
              </div>
              <div className="flex items-center gap-2">
                <Progress value={progress} className="h-1.5 flex-1" />
                <span className="text-xs text-muted-foreground">{Math.round(progress)}%</span>
              </div>
            </div>
          );
        })}

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
      </CardContent>
    </Card>
  );
}
