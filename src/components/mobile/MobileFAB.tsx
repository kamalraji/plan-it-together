import React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface MobileFABProps {
  onPress: () => void;
}

export const MobileFAB: React.FC<MobileFABProps> = ({ onPress }) => {
  return (
    <Button
      onClick={onPress}
      className="fixed bottom-20 right-4 z-40 h-14 w-14 rounded-full shadow-lg shadow-primary/30 bg-primary hover:bg-primary/90"
      size="icon"
    >
      <Plus className="h-6 w-6 text-primary-foreground" />
    </Button>
  );
};
