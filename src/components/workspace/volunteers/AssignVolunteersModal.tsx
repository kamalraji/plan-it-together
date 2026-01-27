import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, Users, Calendar, CheckCircle2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useVolunteerShifts } from '@/hooks/useVolunteerShifts';

interface TeamMember {
  id: string;
  userId: string;
  name: string;
  status: string;
  isAssigned: boolean;
}

interface AssignVolunteersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: string;
  preselectedShiftId?: string;
}

export function AssignVolunteersModal({ 
  open, 
  onOpenChange, 
  workspaceId,
  preselectedShiftId,
}: AssignVolunteersModalProps) {
  const { shifts, assignVolunteers } = useVolunteerShifts(workspaceId);
  const [selectedShiftId, setSelectedShiftId] = useState<string>('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (preselectedShiftId) {
      setSelectedShiftId(preselectedShiftId);
    }
  }, [preselectedShiftId]);

  // Fetch team members with their assignment status for selected shift
  const { data: teamMembers = [], isLoading: isMembersLoading } = useQuery({
    queryKey: ['team-members-for-assignment', workspaceId, selectedShiftId],
    queryFn: async (): Promise<TeamMember[]> => {
      const { data: members, error } = await supabase
        .from('workspace_team_members')
        .select('id, user_id, status')
        .eq('workspace_id', workspaceId)
        .eq('status', 'ACTIVE');

      if (error) throw error;
      if (!members?.length) return [];

      const userIds = members.map(m => m.user_id);
      
      // Get profiles
      const { data: profiles } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      // Get existing assignments for selected shift
      let assignedUserIds = new Set<string>();
      if (selectedShiftId) {
        const { data: assignments } = await supabase
          .from('volunteer_assignments')
          .select('user_id')
          .eq('shift_id', selectedShiftId)
          .neq('status', 'CANCELLED');

        assignedUserIds = new Set(assignments?.map(a => a.user_id) || []);
      }

      return members.map(m => ({
        id: m.id,
        userId: m.user_id,
        name: profileMap.get(m.user_id) || 'Unknown',
        status: m.status,
        isAssigned: assignedUserIds.has(m.user_id),
      }));
    },
    enabled: !!workspaceId,
  });

  const selectedShift = shifts.find(s => s.id === selectedShiftId);
  const unassignedMembers = teamMembers.filter(m => !m.isAssigned);
  const assignedMembers = teamMembers.filter(m => m.isAssigned);

  const handleToggleMember = (userId: string) => {
    setSelectedUserIds(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const allUnassignedIds = unassignedMembers.map(m => m.userId);
    setSelectedUserIds(allUnassignedIds);
  };

  const handleClearAll = () => {
    setSelectedUserIds([]);
  };

  const handleSubmit = async () => {
    if (!selectedShiftId || selectedUserIds.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await assignVolunteers.mutateAsync({
        shiftId: selectedShiftId,
        userIds: selectedUserIds,
      });
      setSelectedUserIds([]);
      onOpenChange(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedUserIds([]);
    setSelectedShiftId(preselectedShiftId || '');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-pink-500" />
            Assign Volunteers to Shift
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Shift Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Select Shift
            </label>
            <Select value={selectedShiftId} onValueChange={setSelectedShiftId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a shift..." />
              </SelectTrigger>
              <SelectContent>
                {shifts.map(shift => (
                  <SelectItem key={shift.id} value={shift.id}>
                    <div className="flex items-center gap-2">
                      <span>{shift.name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({shift.date} • {shift.startTime})
                      </span>
                      <Badge 
                        variant="outline" 
                        className={
                          shift.assignedVolunteers >= shift.requiredVolunteers
                            ? 'bg-emerald-500/10 text-emerald-600'
                            : 'bg-amber-500/10 text-amber-600'
                        }
                      >
                        {shift.assignedVolunteers}/{shift.requiredVolunteers}
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedShiftId && (
            <>
              {/* Shift Info */}
              {selectedShift && (
                <div className="rounded-lg bg-muted/50 p-3 text-sm">
                  <div className="font-medium">{selectedShift.name}</div>
                  <div className="text-muted-foreground text-xs mt-1">
                    {selectedShift.date} • {selectedShift.startTime} - {selectedShift.endTime}
                    {selectedShift.location && ` • ${selectedShift.location}`}
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline">
                      {selectedShift.assignedVolunteers}/{selectedShift.requiredVolunteers} volunteers assigned
                    </Badge>
                    {selectedShift.assignedVolunteers >= selectedShift.requiredVolunteers && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                  </div>
                </div>
              )}

              {/* Already Assigned */}
              {assignedMembers.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Already Assigned ({assignedMembers.length})
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {assignedMembers.map(member => (
                      <Badge key={member.userId} variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                        {member.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Volunteers */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">
                    Available Volunteers ({unassignedMembers.length})
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={handleSelectAll}
                      disabled={unassignedMembers.length === 0}
                    >
                      Select All
                    </Button>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="sm"
                      onClick={handleClearAll}
                      disabled={selectedUserIds.length === 0}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {isMembersLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : unassignedMembers.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">All team members are already assigned</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[200px] rounded-md border p-2">
                    <div className="space-y-2">
                      {unassignedMembers.map(member => (
                        <div
                          key={member.userId}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                          onClick={() => handleToggleMember(member.userId)}
                        >
                          <Checkbox
                            checked={selectedUserIds.includes(member.userId)}
                            onCheckedChange={() => handleToggleMember(member.userId)}
                          />
                          <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-pink-500/10 text-pink-600 text-xs">
                              {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{member.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </div>
            </>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isSubmitting || !selectedShiftId || selectedUserIds.length === 0}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Assign {selectedUserIds.length > 0 && `(${selectedUserIds.length})`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
