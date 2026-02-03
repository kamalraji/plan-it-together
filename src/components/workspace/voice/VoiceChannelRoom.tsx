import React, { useState } from 'react';
import { 
  Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, 
  Monitor, MonitorOff, Settings, Users, Crown, 
  MoreVertical, X 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

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

interface VoiceChannelRoomProps {
  channelId: string;
  channelName: string;
  isStageMode: boolean;
  maxParticipants: number;
  participants: VoiceParticipant[];
  currentUserId: string;
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  isScreenSharing: boolean;
  onJoin: () => void;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onToggleScreenShare: () => void;
  onClose: () => void;
}

export const VoiceChannelRoom: React.FC<VoiceChannelRoomProps> = ({
  channelName,
  isStageMode,
  maxParticipants,
  participants,
  currentUserId,
  isConnected,
  isMuted,
  isDeafened,
  isScreenSharing,
  onJoin,
  onLeave,
  onToggleMute,
  onToggleDeafen,
  onToggleScreenShare,
  onClose,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const speakers = participants.filter(p => p.isHost || p.isSpeaking);
  const listeners = participants.filter(p => !p.isHost && !p.isSpeaking);

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="w-full max-w-4xl"
      >
        <Card className="bg-card border-primary/20 shadow-2xl">
          {/* Header */}
          <CardHeader className="border-b border-border/50 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Phone className="h-5 w-5 text-emerald-500" />
                  {isConnected && (
                    <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <CardTitle className="text-lg">{channelName}</CardTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="secondary" className="text-xs">
                      <Users className="h-3 w-3 mr-1" />
                      {participants.length}/{maxParticipants}
                    </Badge>
                    {isStageMode && (
                      <Badge variant="outline" className="text-xs">
                        Stage Mode
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)}>
                  <Settings className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" onClick={onClose}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Participants Grid */}
            <div className="space-y-6">
              {/* Speakers / Active */}
              {isStageMode && speakers.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Crown className="h-4 w-4 text-amber-500" />
                    Speakers
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {speakers.map((participant) => (
                      <ParticipantCard
                        key={participant.id}
                        participant={participant}
                        isCurrentUser={participant.userId === currentUserId}
                        isLarge
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* All Participants or Listeners */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  {isStageMode ? 'Listeners' : 'Participants'}
                </h3>
                <ScrollArea className="h-[300px]">
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3">
                    {(isStageMode ? listeners : participants).map((participant) => (
                      <ParticipantCard
                        key={participant.id}
                        participant={participant}
                        isCurrentUser={participant.userId === currentUserId}
                      />
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-3 mt-6 pt-6 border-t border-border/50">
              {!isConnected ? (
                <Button 
                  onClick={onJoin}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Join Call
                </Button>
              ) : (
                <>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={isMuted ? "destructive" : "secondary"}
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={onToggleMute}
                      >
                        {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={isDeafened ? "destructive" : "secondary"}
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={onToggleDeafen}
                      >
                        {isDeafened ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isDeafened ? "Undeafen" : "Deafen"}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={isScreenSharing ? "default" : "secondary"}
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={onToggleScreenShare}
                      >
                        {isScreenSharing ? <MonitorOff className="h-5 w-5" /> : <Monitor className="h-5 w-5" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{isScreenSharing ? "Stop sharing" : "Share screen"}</TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="destructive"
                        size="icon"
                        className="h-12 w-12 rounded-full"
                        onClick={onLeave}
                      >
                        <PhoneOff className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Leave call</TooltipContent>
                  </Tooltip>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

interface ParticipantCardProps {
  participant: VoiceParticipant;
  isCurrentUser: boolean;
  isLarge?: boolean;
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({
  participant,
  isCurrentUser,
  isLarge = false,
}) => {
  return (
    <div className={cn(
      "flex flex-col items-center p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors",
      participant.isSpeaking && "ring-2 ring-emerald-500 ring-offset-2 ring-offset-background",
      isLarge && "p-4"
    )}>
      <div className="relative">
        <Avatar className={cn(
          "border-2 transition-colors",
          isLarge ? "h-16 w-16" : "h-12 w-12",
          participant.isSpeaking ? "border-emerald-500" : "border-transparent"
        )}>
          <AvatarImage src={participant.avatarUrl} />
          <AvatarFallback className={cn(isLarge ? "text-lg" : "text-sm")}>
            {participant.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Status indicators */}
        <div className="absolute -bottom-1 -right-1 flex gap-0.5">
          {participant.isMuted && (
            <div className="bg-destructive rounded-full p-0.5">
              <MicOff className="h-3 w-3 text-destructive-foreground" />
            </div>
          )}
          {participant.isDeafened && (
            <div className="bg-muted-foreground rounded-full p-0.5">
              <VolumeX className="h-3 w-3 text-background" />
            </div>
          )}
          {participant.isScreenSharing && (
            <div className="bg-primary rounded-full p-0.5">
              <Monitor className="h-3 w-3 text-primary-foreground" />
            </div>
          )}
        </div>
        
        {participant.isHost && (
          <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5">
            <Crown className="h-3 w-3 text-amber-950" />
          </div>
        )}
      </div>
      
      <span className={cn(
        "mt-2 text-center truncate w-full",
        isLarge ? "text-sm font-medium" : "text-xs"
      )}>
        {isCurrentUser ? 'You' : participant.name}
      </span>
      
      {!isCurrentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-6 w-6 mt-1 opacity-0 group-hover:opacity-100">
              <MoreVertical className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center">
            <DropdownMenuItem>View Profile</DropdownMenuItem>
            <DropdownMenuItem>Send Message</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export default VoiceChannelRoom;
