/**
 * DragToAssign - Drag tasks onto team member avatars to assign
 */
import { useState, DragEvent, ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TeamMember } from '@/types';
import { Check } from 'lucide-react';

interface DragToAssignProps {
  members: TeamMember[];
  onAssign: (taskId: string, memberId: string) => void;
  children: ReactNode;
  className?: string;
}

interface AssignableAvatarProps {
  member: TeamMember;
  isDropTarget: boolean;
  onDragOver: (e: DragEvent) => void;
  onDragLeave: () => void;
  onDrop: (e: DragEvent) => void;
  justAssigned: boolean;
}

function AssignableAvatar({
  member,
  isDropTarget,
  onDragOver,
  onDragLeave,
  onDrop,
  justAssigned,
}: AssignableAvatarProps) {
  const memberName = member.user?.name || 'Unknown';
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              'relative transition-all duration-200 cursor-pointer',
              isDropTarget && 'scale-125 ring-2 ring-primary ring-offset-2 ring-offset-background',
              justAssigned && 'ring-2 ring-emerald-500 ring-offset-2'
            )}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
          >
            <Avatar className="h-10 w-10">
              <AvatarImage src={undefined} alt={memberName} />
              <AvatarFallback className="text-xs">
                {memberName.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {justAssigned && (
              <div className="absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 flex items-center justify-center">
                <Check className="h-3 w-3 text-primary-foreground" />
              </div>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="font-medium">{memberName}</p>
          <p className="text-xs text-muted-foreground">Drop task to assign</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function DragToAssign({ members, onAssign, children, className }: DragToAssignProps) {
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [justAssigned, setJustAssigned] = useState<string | null>(null);

  const handleDragOver = (memberId: string) => (e: DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(memberId);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (memberId: string) => (e: DragEvent) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (taskId) {
      onAssign(taskId, memberId);
      setJustAssigned(memberId);
      setTimeout(() => setJustAssigned(null), 2000);
    }
    
    setDropTarget(null);
  };

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Team member avatars for drop targets */}
      <div className="flex items-center gap-2 p-3 rounded-lg border border-dashed border-border bg-muted/30">
        <span className="text-sm text-muted-foreground mr-2">Assign to:</span>
        <div className="flex items-center gap-2">
          {members.map((member) => (
            <AssignableAvatar
              key={member.id}
              member={member}
              isDropTarget={dropTarget === member.id}
              onDragOver={handleDragOver(member.id)}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop(member.id)}
              justAssigned={justAssigned === member.id}
            />
          ))}
        </div>
      </div>

      {/* Draggable content */}
      {children}
    </div>
  );
}
