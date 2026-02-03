import { useState, useRef } from 'react';
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
  Calendar,
  Tag,
  Upload,
  FileSpreadsheet,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { Workspace } from '@/types';
import { useForm } from 'react-hook-form';
import { useManualRegistration, BulkImportAttendee } from '@/hooks/useManualRegistration';
import { usePromoCodeValidation } from '@/hooks/usePromoCodeValidation';
import { formatDiscount } from '@/types/promoCode';

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
  promoCode?: string;
}

type TabMode = 'single' | 'bulk' | 'import';

export function AddAttendeeTab({ workspace }: AddAttendeeTabProps) {
  const [mode, setMode] = useState<TabMode>('single');
  const [bulkEmails, setBulkEmails] = useState<string[]>(['']);
  const [bulkTicketType, setBulkTicketType] = useState<string>('');
  const [recentlyAdded, setRecentlyAdded] = useState<{ name: string; email: string; ticket: string }[]>([]);
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<BulkImportAttendee[]>([]);
  const [importSendEmail, setImportSendEmail] = useState(true);
  const [isParsingCsv, setIsParsingCsv] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    ticketTiers, 
    isLoading, 
    isSubmitting, 
    createManualRegistration,
    sendBulkInvitations,
    bulkImportAttendees
  } = useManualRegistration(workspace.eventId || null);

  const {
    isValidating,
    appliedPromoCode,
    promoError,
    validatePromoCode,
    clearPromoCode
  } = usePromoCodeValidation(workspace.eventId || null);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<AttendeeFormData>({
    defaultValues: {
      ticketType: '',
      sendConfirmation: true,
    }
  });

  const selectedTicketType = watch('ticketType');
  const selectedTier = ticketTiers.find(t => t.id === selectedTicketType);

  // Calculate discount amount
  const subtotal = selectedTier?.price || 0;
  const discountAmount = appliedPromoCode 
    ? (appliedPromoCode.discount_type === 'percentage' 
        ? (subtotal * appliedPromoCode.discount_value) / 100 
        : appliedPromoCode.discount_value)
    : 0;
  const finalAmount = Math.max(0, subtotal - discountAmount);

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

  const handleApplyPromoCode = async () => {
    if (!promoCodeInput.trim()) return;
    
    const result = await validatePromoCode(
      promoCodeInput,
      selectedTicketType,
      1,
      subtotal
    );
    
    if (result.isValid) {
      toast.success('Promo code applied!', {
        description: formatDiscount(result.promoCode!)
      });
    }
  };

  const handleRemovePromoCode = () => {
    clearPromoCode();
    setPromoCodeInput('');
  };

  const onSubmit = async (data: AttendeeFormData) => {
    const success = await createManualRegistration({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      ticketTierId: data.ticketType,
      notes: data.notes,
      sendConfirmation: data.sendConfirmation,
      promoCodeId: appliedPromoCode?.id,
      discountAmount: discountAmount
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
      handleRemovePromoCode();
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

  // CSV Import handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }

    setCsvFile(file);
    parseCsvFile(file);
  };

  const parseCsvFile = async (file: File) => {
    setIsParsingCsv(true);
    
    try {
      const text = await file.text();
      const lines = text.split('\n').filter(line => line.trim());
      
      if (lines.length < 2) {
        toast.error('CSV file must have a header row and at least one data row');
        setCsvFile(null);
        return;
      }

      const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      
      // Find column indices
      const nameIdx = headers.findIndex(h => h.includes('name') || h === 'fullname' || h === 'full_name');
      const emailIdx = headers.findIndex(h => h.includes('email'));
      const phoneIdx = headers.findIndex(h => h.includes('phone') || h.includes('mobile'));
      const ticketIdx = headers.findIndex(h => h.includes('ticket') || h.includes('tier'));
      const notesIdx = headers.findIndex(h => h.includes('note') || h.includes('comment'));

      if (emailIdx === -1) {
        toast.error('CSV must have an "email" column');
        setCsvFile(null);
        return;
      }

      if (nameIdx === -1) {
        toast.error('CSV must have a "name" or "fullname" column');
        setCsvFile(null);
        return;
      }

      const attendees: BulkImportAttendee[] = [];
      const defaultTicketId = ticketTiers[0]?.id || '';

      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        if (values.length === 0) continue;

        const email = values[emailIdx]?.trim().replace(/"/g, '');
        const name = values[nameIdx]?.trim().replace(/"/g, '');

        if (!email || !name) continue;

        // Try to match ticket tier by name
        let ticketTierId = defaultTicketId;
        if (ticketIdx !== -1 && values[ticketIdx]) {
          const ticketName = values[ticketIdx].trim().replace(/"/g, '').toLowerCase();
          const matchedTier = ticketTiers.find(t => 
            t.name.toLowerCase() === ticketName || 
            t.name.toLowerCase().includes(ticketName)
          );
          if (matchedTier) {
            ticketTierId = matchedTier.id;
          }
        }

        attendees.push({
          fullName: name,
          email: email.toLowerCase(),
          phone: phoneIdx !== -1 ? values[phoneIdx]?.trim().replace(/"/g, '') : undefined,
          ticketTierId,
          notes: notesIdx !== -1 ? values[notesIdx]?.trim().replace(/"/g, '') : undefined
        });
      }

      if (attendees.length === 0) {
        toast.error('No valid attendee data found in CSV');
        setCsvFile(null);
        return;
      }

      setCsvPreview(attendees);
      toast.success(`Found ${attendees.length} attendee(s) in CSV`);
    } catch {
      toast.error('Failed to parse CSV file');
      setCsvFile(null);
    } finally {
      setIsParsingCsv(false);
    }
  };

  // Helper to parse CSV lines (handles quoted values)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    return result;
  };

  const handleCsvImport = async () => {
    if (csvPreview.length === 0) {
      toast.error('No attendees to import');
      return;
    }

    const result = await bulkImportAttendees(csvPreview, importSendEmail);
    
    if (result.success > 0) {
      toast.success(`Successfully imported ${result.success} attendee(s)`, {
        description: result.failed > 0 ? `${result.failed} failed` : undefined
      });
      
      // Clear state
      setCsvFile(null);
      setCsvPreview([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } else {
      toast.error('Import failed', {
        description: result.errors[0] || 'All records failed to import'
      });
    }
  };

  const clearCsvImport = () => {
    setCsvFile(null);
    setCsvPreview([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
            <UserPlus className="w-6 h-6 text-primary" />
            Add Attendee
          </h2>
          <p className="text-muted-foreground mt-1">Manually register attendees, send invitations, or import from CSV</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mode === 'single' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('single')}
          >
            Single
          </Button>
          <Button
            variant={mode === 'bulk' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('bulk')}
          >
            <Users className="w-4 h-4 mr-1" />
            Bulk
          </Button>
          <Button
            variant={mode === 'import' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setMode('import')}
          >
            <Upload className="w-4 h-4 mr-1" />
            Import
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-lg">
                {mode === 'single' && 'Registration Form'}
                {mode === 'bulk' && 'Bulk Invitation'}
                {mode === 'import' && 'CSV Import'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mode === 'single' && (
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
                        onValueChange={(value) => {
                          setValue('ticketType', value);
                          // Re-validate promo code if applied
                          if (appliedPromoCode) {
                            const tier = ticketTiers.find(t => t.id === value);
                            validatePromoCode(promoCodeInput, value, 1, tier?.price || 0);
                          }
                        }}
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

                  {/* Promo Code Section */}
                  <div className="space-y-2">
                    <Label>Promo Code (Optional)</Label>
                    {appliedPromoCode ? (
                      <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-md">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-green-700">{appliedPromoCode.code}</span>
                          <Badge variant="secondary" className="bg-green-500/20 text-green-700">
                            {formatDiscount(appliedPromoCode)}
                          </Badge>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleRemovePromoCode}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            placeholder="Enter promo code"
                            value={promoCodeInput}
                            onChange={(e) => setPromoCodeInput(e.target.value.toUpperCase())}
                            className={`pl-9 ${promoError ? 'border-destructive' : ''}`}
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleApplyPromoCode}
                          disabled={isValidating || !promoCodeInput.trim()}
                        >
                          {isValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                        </Button>
                      </div>
                    )}
                    {promoError && (
                      <p className="text-xs text-destructive flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {promoError}
                      </p>
                    )}
                  </div>

                  {/* Price Summary */}
                  {selectedTier && (selectedTier.price > 0 || appliedPromoCode) && (
                    <div className="p-3 bg-muted/50 rounded-md space-y-1">
                      <div className="flex justify-between text-sm">
                        <span>Subtotal</span>
                        <span>₹{subtotal}</span>
                      </div>
                      {appliedPromoCode && discountAmount > 0 && (
                        <div className="flex justify-between text-sm text-green-600">
                          <span>Discount ({appliedPromoCode.code})</span>
                          <span>-₹{discountAmount.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-1 border-t border-border">
                        <span>Total</span>
                        <span>₹{finalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

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
                    <Button type="submit" disabled={isSubmitting} className="flex-1">
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Add Attendee
                        </>
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => {
                      reset();
                      handleRemovePromoCode();
                    }}>
                      Clear
                    </Button>
                  </div>
                </form>
              )}

              {mode === 'bulk' && (
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
                    className="w-full"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4 mr-2" />
                        Send {bulkEmails.filter(e => e.trim()).length} Invitation(s)
                      </>
                    )}
                  </Button>
                </div>
              )}

              {mode === 'import' && (
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                    {!csvFile ? (
                      <>
                        <FileSpreadsheet className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload a CSV file with attendee data
                        </p>
                        <p className="text-xs text-muted-foreground mb-4">
                          Required columns: <strong>name</strong> (or fullname), <strong>email</strong><br />
                          Optional: phone, ticket, notes
                        </p>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".csv"
                          onChange={handleFileSelect}
                          className="hidden"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={isParsingCsv}
                        >
                          {isParsingCsv ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Select CSV File
                        </Button>
                      </>
                    ) : (
                      <div className="text-left">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet className="w-5 h-5 text-primary" />
                            <span className="font-medium">{csvFile.name}</span>
                            <Badge variant="secondary">{csvPreview.length} attendees</Badge>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearCsvImport}
                            className="text-destructive hover:bg-destructive/10"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Preview Table */}
                        <div className="max-h-64 overflow-auto border rounded-md">
                          <table className="w-full text-sm">
                            <thead className="bg-muted sticky top-0">
                              <tr>
                                <th className="px-3 py-2 text-left font-medium">Name</th>
                                <th className="px-3 py-2 text-left font-medium">Email</th>
                                <th className="px-3 py-2 text-left font-medium">Ticket</th>
                              </tr>
                            </thead>
                            <tbody>
                              {csvPreview.slice(0, 10).map((attendee, idx) => {
                                const tier = ticketTiers.find(t => t.id === attendee.ticketTierId);
                                return (
                                  <tr key={idx} className="border-t">
                                    <td className="px-3 py-2">{attendee.fullName}</td>
                                    <td className="px-3 py-2">{attendee.email}</td>
                                    <td className="px-3 py-2">{tier?.name || 'Default'}</td>
                                  </tr>
                                );
                              })}
                              {csvPreview.length > 10 && (
                                <tr className="border-t bg-muted/50">
                                  <td colSpan={3} className="px-3 py-2 text-center text-muted-foreground">
                                    ... and {csvPreview.length - 10} more
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>

                  {csvPreview.length > 0 && (
                    <>
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="importSendEmail" 
                          checked={importSendEmail}
                          onCheckedChange={(checked) => setImportSendEmail(!!checked)}
                        />
                        <Label htmlFor="importSendEmail" className="text-sm font-normal cursor-pointer">
                          Send confirmation emails to all imported attendees
                        </Label>
                      </div>

                      <Button 
                        onClick={handleCsvImport} 
                        disabled={isSubmitting}
                        className="w-full"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Importing...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4 mr-2" />
                            Import {csvPreview.length} Attendee(s)
                          </>
                        )}
                      </Button>
                    </>
                  )}

                  {/* Sample CSV Download */}
                  <div className="pt-4 border-t">
                    <p className="text-xs text-muted-foreground mb-2">Need a template?</p>
                    <Button
                      type="button"
                      variant="link"
                      size="sm"
                      className="h-auto p-0"
                      onClick={() => {
                        const csv = 'name,email,phone,ticket,notes\nJohn Doe,john@example.com,+1234567890,Early Bird,VIP guest\nJane Smith,jane@example.com,,Regular,';
                        const blob = new Blob([csv], { type: 'text/csv' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'attendee_import_template.csv';
                        a.click();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      Download sample CSV template
                    </Button>
                  </div>
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
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  Recently Added
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentlyAdded.map((attendee, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="truncate">
                      <p className="font-medium truncate">{attendee.name}</p>
                      <p className="text-muted-foreground text-xs truncate">{attendee.email}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0 ml-2">
                      {attendee.ticket}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Quick Tips */}
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>• Single mode creates confirmed registrations immediately</p>
              <p>• Bulk mode sends invitation emails for self-registration</p>
              <p>• CSV import supports name, email, phone, ticket, and notes columns</p>
              <p>• Promo codes are validated against the event's configured codes</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
