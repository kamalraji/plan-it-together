import React, { useState } from 'react';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Users, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface VoiceParticipant {
  id: string;
  userId: string;
  name: string;
  avatarUrl?: string;
  isMuted: boolean;
  isDeafened: boolean;
  isSpeaking: boolean;
}

interface VoiceChannelWidgetProps {
  channelName: string;
  participants: VoiceParticipant[];
  isConnected: boolean;
  isMuted: boolean;
  isDeafened: boolean;
  onLeave: () => void;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onExpandRoom: () => void;
}

export const VoiceChannelWidget: React.FC<VoiceChannelWidgetProps> = ({
  channelName,
  participants,
  isConnected,
  isMuted,
  isDeafened,
  onLeave,
  onToggleMute,
  onToggleDeafen,
  onExpandRoom,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isConnected) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        className="fixed bottom-4 right-4 z-50"
      >
        <Card className={cn(
          "bg-card/95 backdrop-blur-lg border-primary/20 shadow-lg shadow-primary/10",
          isMinimized ? "w-auto" : "w-72"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b border-border/50">
            <div className="flex items-center gap-2">
              <div className="relative">
                <Phone className="h-4 w-4 text-emerald-500" />
                <span className="absolute -top-1 -right-1 h-2 w-2 bg-emerald-500 rounded-full animate-pulse" />
              </div>
              {!isMinimized && (
                <span className="text-sm font-medium truncate max-w-[120px]">
                  {channelName}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {!isMinimized && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-7 w-7"
                      onClick={onExpandRoom}
                    >
                      <Maximize2 className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Open full view</TooltipContent>
                </Tooltip>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-7 w-7"
                onClick={() => setIsMinimized(!isMinimized)}
              >
                <Minimize2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Participants */}
          {!isMinimized && (
            <div className="p-3 space-y-2">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" />
                <span>{participants.length} in call</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {participants.slice(0, 6).map((participant) => (
                  <Tooltip key={participant.id}>
                    <TooltipTrigger asChild>
                      <div className="relative">
                        <Avatar className={cn(
                          "h-8 w-8 border-2 transition-colors",
                          participant.isSpeaking 
                            ? "border-emerald-500 ring-2 ring-emerald-500/30" 
                            : "border-transparent"
                        )}>
                          <AvatarImage src={participant.avatarUrl} />
                          <AvatarFallback className="text-xs">
                            {participant.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {participant.isMuted && (
                          <div className="absolute -bottom-0.5 -right-0.5 bg-destructive rounded-full p-0.5">
                            <MicOff className="h-2.5 w-2.5 text-destructive-foreground" />
                          </div>
                        )}
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{participant.name}</p>
                      {participant.isMuted && <p className="text-xs text-muted-foreground">Muted</p>}
                    </TooltipContent>
                  </Tooltip>
                ))}
                {participants.length > 6 && (
                  <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                    +{participants.length - 6}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Controls */}
          <div className={cn(
            "flex items-center justify-center gap-2 p-3 border-t border-border/50",
            isMinimized && "border-t-0"
          )}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isMuted ? "destructive" : "secondary"}
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={onToggleMute}
                >
                  {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isMuted ? "Unmute" : "Mute"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isDeafened ? "destructive" : "secondary"}
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={onToggleDeafen}
                >
                  {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isDeafened ? "Undeafen" : "Deafen"}</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive"
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={onLeave}
                >
                  <PhoneOff className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Leave call</TooltipContent>
            </Tooltip>
          </div>
        </Card>
      </motion.div>
    </AnimatePresence>
  );
};

export default VoiceChannelWidget;
