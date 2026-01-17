import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  UserPlus,
  Mail,
  Phone,
  Ticket,
  Send,
  Users,
  CheckCircle2,
  Plus,
  Trash2,
  Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import { Workspace } from '@/types';
import { useForm } from 'react-hook-form';
import { useManualRegistration } from '@/hooks/useManualRegistration';

interface AddAttendeeTabProps {
  workspace: Workspace;
}

interface AttendeeFormData {
  fullName: string;
  email: string;
  phone?: string;
  ticketType: string;
  notes?: string;
  sendConfirmation: boolean;
}

export function AddAttendeeTab({ workspace }: AddAttendeeTabProps) {
  const [bulkMode, setBulkMode] = useState(false);
  const [bulkEmails, setBulkEmails] = useState<string[]>(['']);
  const [bulkTicketType, setBulkTicketType] = useState<string>('');
  const [recentlyAdded, setRecentlyAdded] = useState<{ name: string; email: string; ticket: string }[]>([]);

  const { 
    ticketTiers, 
    isLoading, 
    isSubmitting, 
    createManualRegistration,
    sendBulkInvitations 
  } = useManualRegistration(workspace.eventId || null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AttendeeFormData>({
    defaultValues: {
      ticketType: '',
      sendConfirmation: true,
    }
  });

  const selectedTicketType = watch('ticketType');

  // Set default ticket type when tiers load
  if (ticketTiers.length > 0 && !selectedTicketType) {
    const firstAvailable = ticketTiers.find(t => t.available > 0);
    if (firstAvailable) {
      setValue('ticketType', firstAvailable.id);
    }
  }

  // Set default bulk ticket type
  if (ticketTiers.length > 0 && !bulkTicketType) {
    const firstAvailable = ticketTiers.find(t => t.available > 0);
    if (firstAvailable) {
      setBulkTicketType(firstAvailable.id);
    }
  }

  const onSubmit = async (data: AttendeeFormData) => {
    const success = await createManualRegistration({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      ticketTierId: data.ticketType,
      notes: data.notes,
      sendConfirmation: data.sendConfirmation
    });

    if (success) {
      const tier = ticketTiers.find(t => t.id === data.ticketType);
      const newAttendee = {
        name: data.fullName,
        email: data.email,
        ticket: tier?.name || 'Ticket',
      };
      
      setRecentlyAdded(prev => [newAttendee, ...prev].slice(0, 5));
      
      if (data.sendConfirmation) {
        toast.success('Attendee added & confirmation sent!', {
          description: `${data.fullName} has been registered for ${newAttendee.ticket}`,
        });
      } else {
        toast.success('Attendee added successfully!', {
          description: `${data.fullName} registered - no email sent`,
        });
      }
      
      // Reset form but keep ticket type
      reset({ ticketType: data.ticketType, sendConfirmation: true });
    }
  };

  const handleBulkAdd = async () => {
    const validEmails = bulkEmails.filter(e => e.trim() && e.includes('@'));
    if (validEmails.length === 0) {
      toast.error('Please enter valid email addresses');
      return;
    }

    if (!bulkTicketType) {
      toast.error('Please select a ticket type');
      return;
    }

    const result = await sendBulkInvitations({
      emails: validEmails,
      ticketTierId: bulkTicketType
    });
    
    if (result.sent > 0) {
      toast.success(`${result.sent} invitation(s) sent!`, {
        description: result.failed > 0 ? `${result.failed} failed (duplicates or errors)` : undefined,
      });
      setBulkEmails(['']);
    } else if (result.failed > 0) {
      toast.error('Failed to send invitations', {
        description: 'All emails failed - they may already be registered',
      });
    }
  };

  const addBulkEmailField = () => {
    setBulkEmails(prev => [...prev, '']);
  };

  const updateBulkEmail = (index: number, value: string) => {
    setBulkEmails(prev => {
      const updated = [...prev];
      updated[index] = value;
      return updated;
    });
  };

  const removeBulkEmail = (index: number) => {
    setBulkEmails(prev => prev.filter((_, i) => i !== index));
  };

  // No event linked
  if (!workspace.eventId) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Calendar className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Event Associated</h3>
        <p className="text-muted-foreground max-w-md">
          This workspace is not linked to an event. Link an event in workspace settings to add attendees.
        </p>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Skeleton className="h-96 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  // No ticket tiers configured
  if (ticketTiers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Ticket className="w-16 h-16 text-muted-foreground/50 mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Ticket Types Available</h3>
        <p className="text-muted-foreground max-w-md mb-4">
          Configure ticket tiers for this event before adding attendees. Make sure tickets are active and within sale windows.
        </p>
        <Button variant="outline" asChild>
          <a href={`/events/${workspace.eventId}/settings`}>Configure Tickets</a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-blue-500" />
            Add Attendee
          </h2>
          <p className="text-muted-foreground mt-1">Manually register new attendees or send bulk invitations</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={!bulkMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBulkMode(false)}
          >
            Single
          </Button>
          <Button
            variant={bulkMode ? 'default' : 'outline'}
            size="sm"
            onClick={() => setBulkMode(true)}
          >
            <Users className="w-4 h-4 mr-1" />
            Bulk
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {bulkMode ? 'Bulk Invitation' : 'Registration Form'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!bulkMode ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Full Name *</Label>
                      <Input
                        id="fullName"
                        placeholder="Enter full name"
                        {...register('fullName', { required: 'Name is required' })}
                        className={errors.fullName ? 'border-destructive' : ''}
                      />
                      {errors.fullName && (
                        <p className="text-xs text-destructive">{errors.fullName.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder="email@example.com"
                          {...register('email', { 
                            required: 'Email is required',
                            pattern: { value: /^\S+@\S+$/i, message: 'Invalid email' }
                          })}
                          className={`pl-9 ${errors.email ? 'border-destructive' : ''}`}
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-destructive">{errors.email.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone (Optional)</Label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="phone"
                          placeholder="+1 (555) 000-0000"
                          {...register('phone')}
                          className="pl-9"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Ticket Type *</Label>
                      <Select 
                        value={selectedTicketType} 
                        onValueChange={(value) => setValue('ticketType', value)}
                      >
                        <SelectTrigger>
                          <Ticket className="w-4 h-4 mr-2" />
                          <SelectValue placeholder="Select ticket" />
                        </SelectTrigger>
                        <SelectContent>
                          {ticketTiers.map(ticket => (
                            <SelectItem 
                              key={ticket.id} 
                              value={ticket.id}
                              disabled={ticket.available <= 0}
                            >
                              <div className="flex items-center justify-between w-full">
                                <span>{ticket.name}</span>
                                <span className="text-muted-foreground ml-2">
                                  {ticket.price > 0 ? `₹${ticket.price}` : 'Free'} · {ticket.available > 0 ? `${ticket.available} left` : 'Sold Out'}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes (Optional)</Label>
                    <Textarea
                      id="notes"
                      placeholder="Special requirements, dietary restrictions, etc."
                      {...register('notes')}
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox 
                      id="sendConfirmation" 
                      checked={watch('sendConfirmation')}
                      onCheckedChange={(checked) => setValue('sendConfirmation', !!checked)}
                    />
                    <Label htmlFor="sendConfirmation" className="text-sm font-normal cursor-pointer">
                      Send confirmation email with ticket
                    </Label>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <Button type="submit" disabled={isSubmitting} className="flex-1 bg-blue-600 hover:bg-blue-700">
                      {isSubmitting ? (
                        <>Processing...</>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Attendee
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => reset()}>
                      Clear
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Enter email addresses to send registration invitations. Recipients will receive a link to complete their registration.
                  </p>
                  
                  <div className="space-y-3">
                    {bulkEmails.map((email, index) => (
                      <div key={index} className="flex gap-2">
                        <div className="relative flex-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            type="email"
                            placeholder="email@example.com"
                            value={email}
                            onChange={(e) => updateBulkEmail(index, e.target.value)}
                            className="pl-9"
                          />
                        </div>
                        {bulkEmails.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeBulkEmail(index)}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>

                  <Button type="button" variant="outline" onClick={addBulkEmailField} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Email
                  </Button>

                  <div className="space-y-2">
                    <Label>Ticket Type for All</Label>
                    <Select value={bulkTicketType} onValueChange={setBulkTicketType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select ticket type" />
                      </SelectTrigger>
                      <SelectContent>
                        {ticketTiers.map(ticket => (
                          <SelectItem 
                            key={ticket.id} 
                            value={ticket.id}
                            disabled={ticket.available <= 0}
                          >
                            {ticket.name} {ticket.available <= 0 && '(Sold Out)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button 
                    onClick={handleBulkAdd} 
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {isSubmitting ? 'Sending...' : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send {bulkEmails.filter(e => e.trim()).length} Invitation(s)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Ticket Summary */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Ticket Availability</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {ticketTiers.map(ticket => (
                <div key={ticket.id} className="flex items-center justify-between">
                  <span className="text-sm">{ticket.name}</span>
                  {ticket.available <= 0 ? (
                    <Badge variant="destructive" className="text-xs">
                      Sold Out
                    </Badge>
                  ) : (
                    <Badge 
                      variant={ticket.available > 20 ? 'outline' : 'secondary'} 
                      className={ticket.available < 10 ? 'bg-amber-500/10 text-amber-600' : ''}
                    >
                      {ticket.available} left
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recently Added */}
          {recentlyAdded.length > 0 && (
            <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  Recently Added
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {recentlyAdded.map((attendee, index) => (
                  <div key={index} className="p-2 rounded-lg bg-muted/30">
                    <p className="text-sm font-medium">{attendee.name}</p>
                    <p className="text-xs text-muted-foreground">{attendee.email}</p>
                    <Badge variant="outline" className="mt-1 text-[10px]">{attendee.ticket}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
