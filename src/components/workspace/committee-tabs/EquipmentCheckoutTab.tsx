import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useEquipmentCheckout, EquipmentCheckout } from '@/hooks/useEquipmentCheckout';
import { useEquipment } from '@/hooks/useEquipment';
import { Plus, AlertTriangle, Clock, Package, ArrowLeft, Trash2 } from 'lucide-react';
import { format, differenceInHours, differenceInDays } from 'date-fns';

interface EquipmentCheckoutTabProps {
  workspaceId: string;
  eventId?: string;
}

const CONDITION_OPTIONS = [
  { value: 'excellent', label: 'Excellent', color: 'bg-green-500/20 text-green-600' },
  { value: 'good', label: 'Good', color: 'bg-blue-500/20 text-blue-600' },
  { value: 'fair', label: 'Fair', color: 'bg-yellow-500/20 text-yellow-600' },
  { value: 'poor', label: 'Poor', color: 'bg-orange-500/20 text-orange-600' },
  { value: 'damaged', label: 'Damaged', color: 'bg-red-500/20 text-red-600' },
];

export function EquipmentCheckoutTab({ workspaceId, eventId }: EquipmentCheckoutTabProps) {
  const { 
    checkouts, activeCheckouts, overdueCheckouts, overdueCount, isLoading,
    checkoutEquipment, returnEquipment, markLost 
  } = useEquipmentCheckout({ workspaceId });
  
  const { equipment } = useEquipment({ workspaceId, eventId: eventId || '' });
  
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [selectedCheckout, setSelectedCheckout] = useState<EquipmentCheckout | null>(null);

  // Checkout form
  const [checkoutForm, setCheckoutForm] = useState({
    equipmentId: '',
    borrowedByName: '',
    borrowedByCommittee: '',
    expectedReturnDate: '',
    conditionAtCheckout: 'good' as const,
    checkoutNotes: '',
  });

  // Return form
  const [returnForm, setReturnForm] = useState({
    conditionAtReturn: 'good' as const,
    returnNotes: '',
  });

  const availableEquipment = equipment.filter(e => 
    e.status === 'passed' && !activeCheckouts.some(c => c.equipmentId === e.id)
  );

  const returnedCheckouts = checkouts.filter(c => c.status === 'returned' || c.status === 'damaged' || c.status === 'lost');

  const handleCheckout = async () => {
    await checkoutEquipment({
      equipmentId: checkoutForm.equipmentId,
      borrowedByName: checkoutForm.borrowedByName,
      borrowedByCommittee: checkoutForm.borrowedByCommittee,
      expectedReturnDate: new Date(checkoutForm.expectedReturnDate).toISOString(),
      conditionAtCheckout: checkoutForm.conditionAtCheckout,
      checkoutNotes: checkoutForm.checkoutNotes,
    });
    setCheckoutForm({
      equipmentId: '',
      borrowedByName: '',
      borrowedByCommittee: '',
      expectedReturnDate: '',
      conditionAtCheckout: 'good',
      checkoutNotes: '',
    });
    setIsCheckoutOpen(false);
  };

  const handleReturn = async () => {
    if (!selectedCheckout) return;
    await returnEquipment({
      id: selectedCheckout.id,
      conditionAtReturn: returnForm.conditionAtReturn,
      returnNotes: returnForm.returnNotes,
    });
    setReturnForm({ conditionAtReturn: 'good', returnNotes: '' });
    setIsReturnOpen(false);
    setSelectedCheckout(null);
  };

  const getOverdueText = (checkout: EquipmentCheckout) => {
    const now = new Date();
    const expected = new Date(checkout.expectedReturnDate);
    const hours = differenceInHours(now, expected);
    const days = differenceInDays(now, expected);
    
    if (days > 0) return `Overdue by ${days} day${days > 1 ? 's' : ''}`;
    return `Overdue by ${hours} hour${hours > 1 ? 's' : ''}`;
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Equipment Checkout</h2>
          <p className="text-sm text-muted-foreground">Track equipment loans to other committees</p>
        </div>
        <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" /> New Checkout</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Checkout Equipment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Equipment *</Label>
                <Select value={checkoutForm.equipmentId} onValueChange={v => setCheckoutForm(prev => ({ ...prev, equipmentId: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select equipment" /></SelectTrigger>
                  <SelectContent>
                    {availableEquipment.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Borrower Name *</Label>
                  <Input
                    value={checkoutForm.borrowedByName}
                    onChange={e => setCheckoutForm(prev => ({ ...prev, borrowedByName: e.target.value }))}
                    placeholder="Name of borrower"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Committee</Label>
                  <Input
                    value={checkoutForm.borrowedByCommittee}
                    onChange={e => setCheckoutForm(prev => ({ ...prev, borrowedByCommittee: e.target.value }))}
                    placeholder="e.g., Registration"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Expected Return *</Label>
                  <Input
                    type="datetime-local"
                    value={checkoutForm.expectedReturnDate}
                    onChange={e => setCheckoutForm(prev => ({ ...prev, expectedReturnDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Condition</Label>
                  <Select value={checkoutForm.conditionAtCheckout} onValueChange={v => setCheckoutForm(prev => ({ ...prev, conditionAtCheckout: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CONDITION_OPTIONS.slice(0, 4).map(c => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={checkoutForm.checkoutNotes}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, checkoutNotes: e.target.value }))}
                  placeholder="Any special notes about this checkout..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsCheckoutOpen(false)}>Cancel</Button>
                <Button 
                  onClick={handleCheckout} 
                  disabled={!checkoutForm.equipmentId || !checkoutForm.borrowedByName || !checkoutForm.expectedReturnDate}
                >
                  Checkout
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{activeCheckouts.length}</p>
            <p className="text-xs text-muted-foreground">Active Checkouts</p>
          </CardContent>
        </Card>
        <Card className={overdueCount > 0 ? 'border-red-500/30 bg-red-500/5' : ''}>
          <CardContent className="p-4 text-center">
            <p className={`text-2xl font-bold ${overdueCount > 0 ? 'text-red-600' : 'text-muted-foreground'}`}>{overdueCount}</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-600">{returnedCheckouts.length}</p>
            <p className="text-xs text-muted-foreground">Returned Today</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Items */}
      {overdueCheckouts.length > 0 && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" /> Overdue Items
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {overdueCheckouts.map(checkout => (
              <div key={checkout.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                <div className="flex items-center gap-3">
                  <Package className="h-5 w-5 text-red-600" />
                  <div>
                    <p className="font-medium">{checkout.equipmentName}</p>
                    <p className="text-sm text-muted-foreground">
                      To: {checkout.borrowedByCommittee || checkout.borrowedByName}
                    </p>
                    <p className="text-xs text-red-600">{getOverdueText(checkout)}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => { setSelectedCheckout(checkout); setIsReturnOpen(true); }}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" /> Return
                  </Button>
                  <Button 
                    size="sm" 
                    variant="destructive"
                    onClick={() => markLost(checkout.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Active Checkouts */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Active Checkouts</CardTitle>
        </CardHeader>
        <CardContent>
          {activeCheckouts.filter(c => !overdueCheckouts.includes(c)).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No active checkouts</p>
          ) : (
            <div className="space-y-3">
              {activeCheckouts.filter(c => !overdueCheckouts.includes(c)).map(checkout => (
                <div key={checkout.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <Package className="h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">{checkout.equipmentName}</p>
                      <p className="text-sm text-muted-foreground">
                        To: {checkout.borrowedByCommittee ? `${checkout.borrowedByCommittee} • ` : ''}{checkout.borrowedByName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className={CONDITION_OPTIONS.find(c => c.value === checkout.conditionAtCheckout)?.color}>
                          {checkout.conditionAtCheckout}
                        </Badge>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Due: {format(new Date(checkout.expectedReturnDate), 'MMM d, h:mm a')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => { setSelectedCheckout(checkout); setIsReturnOpen(true); }}
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" /> Return
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Return Dialog */}
      <Dialog open={isReturnOpen} onOpenChange={setIsReturnOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Return Equipment</DialogTitle>
          </DialogHeader>
          {selectedCheckout && (
            <div className="space-y-4 pt-4">
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="font-medium">{selectedCheckout.equipmentName}</p>
                <p className="text-sm text-muted-foreground">
                  Borrowed by: {selectedCheckout.borrowedByName}
                </p>
                <p className="text-sm text-muted-foreground">
                  Condition at checkout: {selectedCheckout.conditionAtCheckout}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Condition at Return *</Label>
                <Select value={returnForm.conditionAtReturn} onValueChange={v => setReturnForm(prev => ({ ...prev, conditionAtReturn: v as any }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPTIONS.map(c => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Return Notes</Label>
                <Textarea
                  value={returnForm.returnNotes}
                  onChange={e => setReturnForm(prev => ({ ...prev, returnNotes: e.target.value }))}
                  placeholder="Any damage or notes about the return..."
                  rows={2}
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsReturnOpen(false)}>Cancel</Button>
                <Button onClick={handleReturn}>Confirm Return</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
