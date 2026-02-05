import React from 'react';
import { Mic, MicOff, VolumeX, Monitor, Crown, MoreVertical } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

interface VoiceParticipant {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
  isScreenSharing: boolean;
  isHost?: boolean;
}

interface VoiceParticipantListProps {
  participants: VoiceParticipant[];
  currentUserId: string;
  isHost: boolean;
  onMuteParticipant?: (userId: string) => void;
  onKickParticipant?: (userId: string) => void;
  onPromoteToHost?: (userId: string) => void;
  onViewProfile?: (userId: string) => void;
  className?: string;
}

export const VoiceParticipantList: React.FC<VoiceParticipantListProps> = ({
  participants,
  currentUserId,
  isHost,
  onMuteParticipant,
  onKickParticipant,
  onPromoteToHost,
  onViewProfile,
  className,
}) => {
  // Sort participants: host first, then speaking, then alphabetically
  const sortedParticipants = [...participants].sort((a, b) => {
    if (a.isHost && !b.isHost) return -1;
    if (!a.isHost && b.isHost) return 1;
    if (a.isSpeaking && !b.isSpeaking) return -1;
    if (!a.isSpeaking && b.isSpeaking) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div className="space-y-1 p-2">
        {sortedParticipants.map((participant) => (
          <ParticipantRow
            key={participant.id}
            participant={participant}
            isCurrentUser={participant.userId === currentUserId}
            canModerate={isHost && participant.userId !== currentUserId}
            onMute={() => onMuteParticipant?.(participant.userId)}
            onKick={() => onKickParticipant?.(participant.userId)}
            onPromote={() => onPromoteToHost?.(participant.userId)}
            onViewProfile={() => onViewProfile?.(participant.userId)}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

interface ParticipantRowProps {
  participant: VoiceParticipant;
  isCurrentUser: boolean;
  canModerate: boolean;
  onMute?: () => void;
  onKick?: () => void;
  onPromote?: () => void;
  onViewProfile?: () => void;
}

const ParticipantRow: React.FC<ParticipantRowProps> = ({
  participant,
  isCurrentUser,
  canModerate,
  onMute,
  onKick,
  onPromote,
  onViewProfile,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-2 rounded-lg transition-colors group",
        participant.isSpeaking ? "bg-emerald-500/10" : "hover:bg-muted/50"
      )}
    >
      {/* Avatar */}
      <div className="relative">
        <Avatar className={cn(
          "h-9 w-9 border-2 transition-colors",
          participant.isSpeaking ? "border-emerald-500" : "border-transparent"
        )}>
          <AvatarImage src={participant.avatarUrl} />
          <AvatarFallback className="text-sm">
            {participant.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {participant.isHost && (
          <div className="absolute -top-1 -right-1 bg-warning rounded-full p-0.5">
            <Crown className="h-2.5 w-2.5 text-amber-950" />
          </div>
        )}
      </div>

      {/* Name and status */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-sm font-medium truncate",
            participant.isSpeaking && "text-emerald-500"
          )}>
            {isCurrentUser ? `${participant.name} (You)` : participant.name}
          </span>
        </div>
        {participant.isScreenSharing && (
          <div className="flex items-center gap-1 text-xs text-primary">
            <Monitor className="h-3 w-3" />
            <span>Sharing screen</span>
          </div>
        )}
      </div>

      {/* Status icons */}
      <div className="flex items-center gap-1.5">
        {participant.isMuted ? (
          <MicOff className="h-4 w-4 text-destructive" />
        ) : (
          <Mic className={cn(
            "h-4 w-4",
            participant.isSpeaking ? "text-emerald-500" : "text-muted-foreground"
          )} />
        )}
        
        {participant.isDeafened && (
          <VolumeX className="h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Actions dropdown */}
      {!isCurrentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onViewProfile}>
              View Profile
            </DropdownMenuItem>
            {canModerate && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onMute}>
                  {participant.isMuted ? 'Unmute' : 'Mute'} User
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onPromote}>
                  Make Host
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={onKick}
                  className="text-destructive focus:text-destructive"
                >
                  Remove from Call
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default VoiceParticipantList;
