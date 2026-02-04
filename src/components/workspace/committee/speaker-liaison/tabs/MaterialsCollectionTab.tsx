import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { 
  FileCheck, 
  Search, 
  CheckCircle, 
  AlertCircle, 
  Clock,
  Mail,
  FileText,
  Image,
  Presentation,
  Headphones
} from 'lucide-react';
import { 
  useMaterialsStats, 
  useSpeakerLiaisonSpeakers,
  useUpdateSpeaker,
  useSendBulkReminder
} from '@/hooks/useSpeakerLiaisonData';

interface MaterialsCollectionTabProps {
  workspaceId: string;
}

type MaterialType = 'bio' | 'photo' | 'presentation' | 'avRequirements';

export function MaterialsCollectionTab({ workspaceId }: MaterialsCollectionTabProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: speakers = [], isLoading } = useSpeakerLiaisonSpeakers(workspaceId);
  const { materials, totalItems, approvedItems } = useMaterialsStats(workspaceId);
  const updateSpeaker = useUpdateSpeaker(workspaceId);
  const sendBulkReminder = useSendBulkReminder(workspaceId);

  const filteredMaterials = materials.filter(m =>
    m.speakerName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const overallProgress = totalItems > 0 ? (approvedItems / totalItems) * 100 : 0;

  const getStatusIcon = (status: { submitted: boolean | null; approved: boolean | null }) => {
    if (status.approved) return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    if (status.submitted) return <AlertCircle className="h-4 w-4 text-amber-500" />;
    return <Clock className="h-4 w-4 text-muted-foreground" />;
  };

  const getMaterialIcon = (type: MaterialType) => {
    const icons: Record<MaterialType, React.ElementType> = {
      bio: FileText,
      photo: Image,
      presentation: Presentation,
      avRequirements: Headphones,
    };
    return icons[type];
  };

  const handleApprove = (speakerId: string, materialType: MaterialType) => {
    const fieldMap: Record<MaterialType, string> = {
      bio: 'bio_approved',
      photo: 'photo_approved',
      presentation: 'presentation_approved',
      avRequirements: 'av_requirements_approved',
    };
    updateSpeaker.mutate({ id: speakerId, [fieldMap[materialType]]: true });
  };


  const handleSendReminders = () => {
    const pendingSpeakers = speakers
      .filter(s => !s.bio_submitted || !s.photo_submitted || !s.presentation_submitted)
      .map(s => s.id);
    
    if (pendingSpeakers.length > 0) {
      sendBulkReminder.mutate(pendingSpeakers);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground mt-2">Loading materials...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overview Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <FileCheck className="h-5 w-5 text-primary" />
                <h3 className="font-semibold">Materials Collection Progress</h3>
              </div>
              <Progress value={overallProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {approvedItems} of {totalItems} items approved ({Math.round(overallProgress)}%)
              </p>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleSendReminders}
                disabled={sendBulkReminder.isPending}
              >
                <Mail className="h-4 w-4 mr-1" />
                Send Reminders
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Materials Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="flex items-center gap-2">
              Materials Tracker
              <Badge variant="secondary">{filteredMaterials.length} speakers</Badge>
            </CardTitle>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search speakers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-[200px]"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Speaker</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Bio</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Photo</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Presentation</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">A/V</th>
                  <th className="text-center py-3 px-2 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredMaterials.map((material) => {
                  const materialTypes: MaterialType[] = ['bio', 'photo', 'presentation', 'avRequirements'];
                  
                  return (
                    <tr key={material.speakerId} className="hover:bg-muted/30">
                      <td className="py-3 px-2">
                        <span className="font-medium text-sm">{material.speakerName}</span>
                      </td>
                      {materialTypes.map((type) => {
                        const Icon = getMaterialIcon(type);
                        const status = material[type];
                        return (
                          <td key={type} className="text-center py-3 px-2">
                            <div className="flex items-center justify-center gap-1">
                              <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                              {getStatusIcon(status)}
                            </div>
                          </td>
                        );
                      })}
                      <td className="text-center py-3 px-2">
                        <div className="flex items-center justify-center gap-1">
                          {materialTypes.map((type) => {
                            const status = material[type];
                            if (status.submitted && !status.approved) {
                              return (
                                <Button
                                  key={type}
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-xs"
                                  onClick={() => handleApprove(material.speakerId, type)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approve {type}
                                </Button>
                              );
                            }
                            return null;
                          })}
                          {materialTypes.every(type => !material[type].submitted) && (
                            <span className="text-xs text-muted-foreground">Awaiting</span>
                          )}
                          {materialTypes.every(type => material[type].approved) && (
                            <Badge className="bg-emerald-500/10 text-emerald-600 text-xs">Complete</Badge>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredMaterials.length === 0 && (
            <div className="text-center py-12">
              <FileCheck className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-muted-foreground">No speakers found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
