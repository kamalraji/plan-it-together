import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User } from 'lucide-react';

export interface AttendeeDetails {
  name: string;
  email: string;
  phone: string;
}

interface AttendeeDetailsFormProps {
  index: number;
  values: AttendeeDetails;
  onChange: (values: AttendeeDetails) => void;
  isPrimary?: boolean;
  disabled?: boolean;
}

export const AttendeeDetailsForm: React.FC<AttendeeDetailsFormProps> = ({
  index,
  values,
  onChange,
  isPrimary = false,
  disabled = false,
}) => {
  const handleChange = (field: keyof AttendeeDetails, value: string) => {
    onChange({ ...values, [field]: value });
  };

  return (
    <Card className={isPrimary ? 'border-primary/50' : ''}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <User className="h-4 w-4" />
          {isPrimary ? 'Your Details' : `Attendee ${index + 1}`}
          {isPrimary && (
            <span className="text-xs font-normal text-muted-foreground ml-1">
              (Primary Contact)
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`attendee-${index}-name`}>Full Name *</Label>
            <Input
              id={`attendee-${index}-name`}
              value={values.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="Enter full name"
              required
              disabled={disabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`attendee-${index}-email`}>Email *</Label>
            <Input
              id={`attendee-${index}-email`}
              type="email"
              value={values.email}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="Enter email address"
              required
              disabled={disabled}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`attendee-${index}-phone`}>Phone Number</Label>
          <Input
            id={`attendee-${index}-phone`}
            type="tel"
            value={values.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="Enter phone number"
            disabled={disabled}
          />
        </div>
      </CardContent>
    </Card>
  );
};
