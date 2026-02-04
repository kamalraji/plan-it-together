import { useState, useEffect } from 'react';
import { 
  MapPinIcon,
  PhotoIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface MobileFeaturesPanelProps {
  workspaceId: string;
  taskId?: string;
  onLocationUpdate?: (location: LocationData) => void;
  onPhotoCapture?: (file: File) => void;
  onVoiceRecording?: (audioBlob: Blob) => void;
}

export function MobileFeaturesPanel({ 
  onLocationUpdate, 
  onPhotoCapture, 
  onVoiceRecording 
}: MobileFeaturesPanelProps) {
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'success' | 'error'>('idle');
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recordingInterval, setRecordingInterval] = useState<ReturnType<typeof setInterval> | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recordingInterval) {
        clearInterval(recordingInterval);
      }
      if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.stop();
      }
    };
  }, [recordingInterval, mediaRecorder]);

  const getCurrentLocation = async () => {
    if (!('geolocation' in navigator)) {
      setLocationStatus('error');
      return;
    }

    setLocationStatus('requesting');

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 300000 // 5 minutes
          }
        );
      });

      const locationData: LocationData = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        accuracy: position.coords.accuracy,
        timestamp: new Date().toISOString()
      };

      setCurrentLocation(locationData);
      setLocationStatus('success');
      
      if (onLocationUpdate) {
        onLocationUpdate(locationData);
      }

    } catch {
      setLocationStatus('error');
    }
  };

  const capturePhoto = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Use rear camera on mobile
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file && onPhotoCapture) {
        onPhotoCapture(file);
      }
    };
    
    input.click();
  };

  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        if (onVoiceRecording) {
          onVoiceRecording(audioBlob);
        }
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      setRecordingTime(0);

      // Start recording timer
      const interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      setRecordingInterval(interval);

    } catch {
      alert('Failed to access microphone. Please check permissions.');
    }
  };

  const stopVoiceRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      setIsRecording(false);
      setMediaRecorder(null);
      
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatLocation = (location: LocationData) => {
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  };

  const getLocationStatusIcon = () => {
    switch (locationStatus) {
      case 'requesting':
        return <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>;
      case 'success':
        return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
      case 'error':
        return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
      default:
        return <MapPinIcon className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="bg-card rounded-lg shadow-sm p-4 space-y-4">
      <div className="flex items-center space-x-2">
        <InformationCircleIcon className="w-5 h-5 text-blue-600" />
        <h3 className="text-sm font-medium text-foreground">Mobile Features</h3>
      </div>

      {/* Location Services */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {getLocationStatusIcon()}
            <span className="text-sm text-foreground">Location Services</span>
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={locationStatus === 'requesting'}
            className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md text-xs font-medium hover:bg-blue-100 disabled:opacity-50"
          >
            {locationStatus === 'requesting' ? 'Getting...' : 'Get Location'}
          </button>
        </div>

        {currentLocation && (
          <div className="p-2 bg-green-50 rounded-md">
            <p className="text-xs text-green-700">
              <strong>Location:</strong> {formatLocation(currentLocation)}
            </p>
            <p className="text-xs text-green-600">
              Accuracy: ±{Math.round(currentLocation.accuracy)}m
            </p>
          </div>
        )}

        {locationStatus === 'error' && (
          <div className="p-2 bg-red-50 rounded-md">
            <p className="text-xs text-red-700">
              Failed to get location. Please check permissions and try again.
            </p>
          </div>
        )}
      </div>

      {/* Photo Capture */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <PhotoIcon className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-foreground">Photo Capture</span>
          </div>
          <button
            onClick={capturePhoto}
            className="px-3 py-1 bg-green-50 text-green-700 rounded-md text-xs font-medium hover:bg-green-100"
          >
            Take Photo
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Capture photos for task documentation or workspace updates
        </p>
      </div>

      {/* Voice Recording */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MicrophoneIcon className={`w-4 h-4 ${isRecording ? 'text-red-600' : 'text-muted-foreground'}`} />
            <span className="text-sm text-foreground">Voice Recording</span>
          </div>
          <button
            onTouchStart={startVoiceRecording}
            onTouchEnd={stopVoiceRecording}
            onMouseDown={startVoiceRecording}
            onMouseUp={stopVoiceRecording}
            onMouseLeave={stopVoiceRecording}
            className={`px-3 py-1 rounded-md text-xs font-medium ${
              isRecording 
                ? 'bg-red-100 text-red-700' 
                : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
            }`}
          >
            {isRecording ? 'Recording...' : 'Hold to Record'}
          </button>
        </div>

        {isRecording && (
          <div className="p-2 bg-red-50 rounded-md">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-red-700 font-medium">
                Recording: {formatRecordingTime(recordingTime)}
              </span>
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Record voice messages or audio notes for quick communication
        </p>
      </div>

      {/* Feature Availability Info */}
      <div className="pt-3 border-t border-border">
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              'geolocation' in navigator ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-muted-foreground">
              Location Services: {'geolocation' in navigator ? 'Available' : 'Not Available'}
            </span>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
              'mediaDevices' in navigator ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-muted-foreground">
              Camera/Microphone: {'mediaDevices' in navigator ? 'Available' : 'Not Available'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}