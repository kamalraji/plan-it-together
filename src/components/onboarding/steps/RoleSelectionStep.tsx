import { motion } from 'framer-motion';
import { Users, Building2 } from 'lucide-react';
import { RoleCard } from '../components/RoleCard';
import { Button } from '@/components/ui/button';
import type { SelectedRole } from '../hooks/useOnboardingState';

interface RoleSelectionStepProps {
  selectedRole: SelectedRole | null;
  onRoleSelect: (role: SelectedRole) => void;
  onNext: () => void;
}

export function RoleSelectionStep({ selectedRole, onRoleSelect, onNext }: RoleSelectionStepProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-4xl mx-auto px-4"
    >
      {/* Header */}
      <div className="text-center mb-12">
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-coral to-teal bg-clip-text text-transparent mb-4"
        >
          Choose Your Journey
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-lg text-muted-foreground max-w-xl mx-auto"
        >
          Select how you want to use Thittam1Hub. You can always change this later.
        </motion.p>
      </div>

      {/* Role Cards */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <RoleCard
          title="Participant"
          description="Join events, build your portfolio, connect with peers, and grow your skills."
          icon={<Users className="h-7 w-7" />}
          features={[
            'Discover and register for events',
            'Build your professional portfolio',
            'AI-powered team matching',
            'Earn certificates and badges',
            'Network with fellow participants',
          ]}
          isSelected={selectedRole === 'participant'}
          onSelect={() => onRoleSelect('participant')}
          accentColor="coral"
        />

        <RoleCard
          title="Organizer"
          description="Create and manage events, build communities, and streamline operations."
          icon={<Building2 className="h-7 w-7" />}
          features={[
            'Create and publish events',
            'Manage registrations & check-ins',
            'Build your organization',
            'Access advanced analytics',
            'Coordinate with your team',
          ]}
          isSelected={selectedRole === 'organizer'}
          onSelect={() => onRoleSelect('organizer')}
          accentColor="teal"
        />
      </div>

      {/* Continue Button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: selectedRole ? 1 : 0.5 }}
        className="flex justify-center"
      >
        <Button
          onClick={onNext}
          disabled={!selectedRole}
          size="lg"
          className="px-12 py-6 text-lg font-semibold"
        >
          Continue as {selectedRole === 'participant' ? 'Participant' : selectedRole === 'organizer' ? 'Organizer' : '...'}
        </Button>
      </motion.div>
    </motion.div>
  );
}
