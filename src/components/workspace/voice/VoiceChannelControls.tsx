import React from 'react';
import { Mic, MicOff, Volume2, VolumeX, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AudioDevice {
  deviceId: string;
  label: string;
}

interface VoiceChannelControlsProps {
  isMuted: boolean;
  isDeafened: boolean;
  inputVolume: number;
  outputVolume: number;
  inputDevices: AudioDevice[];
  outputDevices: AudioDevice[];
  selectedInputDevice: string;
  selectedOutputDevice: string;
  noiseSuppression: boolean;
  echoCancellation: boolean;
  onToggleMute: () => void;
  onToggleDeafen: () => void;
  onInputVolumeChange: (volume: number) => void;
  onOutputVolumeChange: (volume: number) => void;
  onInputDeviceChange: (deviceId: string) => void;
  onOutputDeviceChange: (deviceId: string) => void;
  onNoiseSuppressionChange: (enabled: boolean) => void;
  onEchoCancellationChange: (enabled: boolean) => void;
}

export const VoiceChannelControls: React.FC<VoiceChannelControlsProps> = ({
  isMuted,
  isDeafened,
  inputVolume,
  outputVolume,
  inputDevices,
  outputDevices,
  selectedInputDevice,
  selectedOutputDevice,
  noiseSuppression,
  echoCancellation,
  onToggleMute,
  onToggleDeafen,
  onInputVolumeChange,
  onOutputVolumeChange,
  onInputDeviceChange,
  onOutputDeviceChange,
  onNoiseSuppressionChange,
  onEchoCancellationChange,
}) => {
  return (
    <div className="flex items-center gap-2">
      {/* Mute Button */}
      <Button
        variant={isMuted ? "destructive" : "secondary"}
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={onToggleMute}
      >
        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>

      {/* Deafen Button */}
      <Button
        variant={isDeafened ? "destructive" : "secondary"}
        size="icon"
        className="h-10 w-10 rounded-full"
        onClick={onToggleDeafen}
      >
        {isDeafened ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
      </Button>

      {/* Settings Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
            <Settings className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80" align="end">
          <div className="space-y-6">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Audio Settings</h4>
              <p className="text-xs text-muted-foreground">
                Configure your microphone and speaker settings
              </p>
            </div>

            {/* Input Device */}
            <div className="space-y-2">
              <Label className="text-xs">Input Device</Label>
              <Select value={selectedInputDevice} onValueChange={onInputDeviceChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select microphone" />
                </SelectTrigger>
                <SelectContent>
                  {inputDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || 'Default Microphone'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Input Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Input Volume</Label>
                <span className="text-xs text-muted-foreground">{inputVolume}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Mic className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[inputVolume]}
                  onValueChange={([value]) => onInputVolumeChange(value)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Output Device */}
            <div className="space-y-2">
              <Label className="text-xs">Output Device</Label>
              <Select value={selectedOutputDevice} onValueChange={onOutputDeviceChange}>
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Select speaker" />
                </SelectTrigger>
                <SelectContent>
                  {outputDevices.map((device) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || 'Default Speaker'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Output Volume */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Output Volume</Label>
                <span className="text-xs text-muted-foreground">{outputVolume}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Volume2 className="h-4 w-4 text-muted-foreground" />
                <Slider
                  value={[outputVolume]}
                  onValueChange={([value]) => onOutputVolumeChange(value)}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>

            {/* Advanced Settings */}
            <div className="space-y-3 pt-2 border-t border-border">
              <h4 className="font-medium text-xs text-muted-foreground">Advanced</h4>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="noise-suppression" className="text-sm">
                  Noise Suppression
                </Label>
                <Switch
                  id="noise-suppression"
                  checked={noiseSuppression}
                  onCheckedChange={onNoiseSuppressionChange}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="echo-cancellation" className="text-sm">
                  Echo Cancellation
                </Label>
                <Switch
                  id="echo-cancellation"
                  checked={echoCancellation}
                  onCheckedChange={onEchoCancellationChange}
                />
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default VoiceChannelControls;
