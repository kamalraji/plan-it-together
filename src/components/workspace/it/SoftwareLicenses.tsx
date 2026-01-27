import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { AppWindow, Check, Clock, X, Plus, Edit2, Trash2, Package, AlertTriangle, Loader2 } from 'lucide-react';
import { useSoftwareLicenses, SoftwareLicense } from '@/hooks/useSoftwareLicenses';
import { differenceInDays } from 'date-fns';

type LicenseType = 'perpetual' | 'subscription' | 'trial' | 'open_source';

interface SoftwareLicensesProps {
  workspaceId: string;
  eventId?: string;
}

export function SoftwareLicenses({ workspaceId, eventId }: SoftwareLicensesProps) {
  const {
    licenses,
    stats,
    isLoading,
    createLicense,
    updateLicense,
    deleteLicense,
    loadDefaultTemplates,
  } = useSoftwareLicenses(workspaceId);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingLicense, setEditingLicense] = useState<SoftwareLicense | null>(null);
  const [formData, setFormData] = useState<{
    name: string;
    vendor: string;
    version: string;
    license_type: LicenseType;
    total_seats: number;
    used_seats: number;
    expiry_date: string;
    total_cost: string;
    auto_renew: boolean;
    notes: string;
  }>({
    name: '',
    vendor: '',
    version: '',
    license_type: 'subscription',
    total_seats: 1,
    used_seats: 0,
    expiry_date: '',
    total_cost: '',
    auto_renew: false,
    notes: '',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      vendor: '',
      version: '',
      license_type: 'subscription',
      total_seats: 1,
      used_seats: 0,
      expiry_date: '',
      total_cost: '',
      auto_renew: false,
      notes: '',
    });
  };

  const handleOpenAdd = () => {
    resetForm();
    setEditingLicense(null);
    setIsAddDialogOpen(true);
  };

  const handleOpenEdit = (license: SoftwareLicense) => {
    setFormData({
      name: license.name,
      vendor: license.vendor || '',
      version: license.version || '',
      license_type: license.license_type,
      total_seats: license.total_seats,
      used_seats: license.used_seats,
      expiry_date: license.expiry_date || '',
      total_cost: license.total_cost?.toString() || '',
      auto_renew: license.auto_renew,
      notes: license.notes || '',
    });
    setEditingLicense(license);
    setIsAddDialogOpen(true);
  };

  const handleSubmit = async () => {
    const licenseData = {
      name: formData.name,
      vendor: formData.vendor || null,
      version: formData.version || null,
      license_type: formData.license_type,
      total_seats: formData.total_seats,
      used_seats: formData.used_seats,
      expiry_date: formData.expiry_date || null,
      total_cost: formData.total_cost ? parseFloat(formData.total_cost) : null,
      auto_renew: formData.auto_renew,
      notes: formData.notes || null,
      event_id: eventId || null,
      license_key: null,
      cost_per_seat: null,
      currency: 'USD',
      purchase_date: null,
      renewal_date: null,
      status: 'active' as const,
      expiry_alert_days: 30,
      seat_alert_threshold: 80,
      assigned_to_department: null,
      primary_contact_name: null,
      documentation_url: null,
      created_by: null,
    };

    if (editingLicense) {
      await updateLicense.mutateAsync({ id: editingLicense.id, ...licenseData });
    } else {
      await createLicense.mutateAsync(licenseData);
    }

    setIsAddDialogOpen(false);
    resetForm();
    setEditingLicense(null);
  };

  const handleDelete = async (id: string) => {
    await deleteLicense.mutateAsync(id);
  };

  const getStatusBadge = (license: SoftwareLicense) => {
    const { status, expiry_date, expiry_alert_days } = license;
    
    // Calculate actual status based on expiry
    let displayStatus = status;
    if (expiry_date) {
      const daysUntilExpiry = differenceInDays(new Date(expiry_date), new Date());
      if (daysUntilExpiry < 0) displayStatus = 'expired';
      else if (daysUntilExpiry <= expiry_alert_days) displayStatus = 'expiring';
    }

    switch (displayStatus) {
      case 'active':
        return (
          <Badge className="bg-success/10 text-success border-success/20">
            <Check className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'expiring':
        return (
          <Badge className="bg-warning/10 text-warning border-warning/20">
            <Clock className="h-3 w-3 mr-1" />
            Expiring
          </Badge>
        );
      case 'expired':
        return (
          <Badge className="bg-destructive/10 text-destructive border-destructive/20">
            <X className="h-3 w-3 mr-1" />
            Expired
          </Badge>
        );
      case 'suspended':
        return (
          <Badge className="bg-muted text-muted-foreground border-muted">
            <AlertTriangle className="h-3 w-3 mr-1" />
            Suspended
          </Badge>
        );
      default:
        return null;
    }
  };

  const getSeatUtilization = (used: number, total: number) => {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  };

  const getExpiryText = (expiryDate: string | null) => {
    if (!expiryDate) return null;
    const days = differenceInDays(new Date(expiryDate), new Date());
    if (days < 0) return `Expired ${Math.abs(days)} days ago`;
    if (days === 0) return 'Expires today';
    if (days === 1) return 'Expires tomorrow';
    return `Expires in ${days} days`;
  };

  if (isLoading) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AppWindow className="h-5 w-5 text-primary" />
          Software Licenses
        </CardTitle>
        <div className="flex items-center gap-2">
          {licenses.length === 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadDefaultTemplates.mutate()}
              disabled={loadDefaultTemplates.isPending}
            >
              {loadDefaultTemplates.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Package className="h-4 w-4 mr-1" />
              )}
              Load Defaults
            </Button>
          )}
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={handleOpenAdd}>
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingLicense ? 'Edit License' : 'Add License'}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Badge Printing Suite"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Input
                      id="vendor"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      placeholder="e.g., BadgeTech"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="version">Version</Label>
                    <Input
                      id="version"
                      value={formData.version}
                      onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                      placeholder="e.g., v3.2.1"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="license_type">License Type</Label>
                    <Select
                      value={formData.license_type}
                      onValueChange={(value: 'perpetual' | 'subscription' | 'trial' | 'open_source') =>
                        setFormData({ ...formData, license_type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="subscription">Subscription</SelectItem>
                        <SelectItem value="perpetual">Perpetual</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="open_source">Open Source</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="expiry_date">Expiry Date</Label>
                    <Input
                      id="expiry_date"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="total_seats">Total Seats</Label>
                    <Input
                      id="total_seats"
                      type="number"
                      min={1}
                      value={formData.total_seats}
                      onChange={(e) => setFormData({ ...formData, total_seats: parseInt(e.target.value) || 1 })}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="used_seats">Used Seats</Label>
                    <Input
                      id="used_seats"
                      type="number"
                      min={0}
                      max={formData.total_seats}
                      value={formData.used_seats}
                      onChange={(e) => setFormData({ ...formData, used_seats: parseInt(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="total_cost">Annual Cost ($)</Label>
                  <Input
                    id="total_cost"
                    type="number"
                    step="0.01"
                    value={formData.total_cost}
                    onChange={(e) => setFormData({ ...formData, total_cost: e.target.value })}
                    placeholder="e.g., 1200.00"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Input
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Additional notes..."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={!formData.name || createLicense.isPending || updateLicense.isPending}
                >
                  {(createLicense.isPending || updateLicense.isPending) && (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  )}
                  {editingLicense ? 'Update' : 'Add'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Stats Summary */}
        {licenses.length > 0 && (
          <div className="grid grid-cols-4 gap-2 mb-4 p-3 rounded-lg bg-muted/30">
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{stats.active}</div>
              <div className="text-xs text-muted-foreground">Active</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-warning">{stats.expiring}</div>
              <div className="text-xs text-muted-foreground">Expiring</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-destructive">{stats.expired}</div>
              <div className="text-xs text-muted-foreground">Expired</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-foreground">{stats.seatUtilization}%</div>
              <div className="text-xs text-muted-foreground">Seats Used</div>
            </div>
          </div>
        )}

        {/* License List */}
        <div className="space-y-3">
          {licenses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AppWindow className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>No licenses tracked yet</p>
              <p className="text-sm">Add licenses or load default templates</p>
            </div>
          ) : (
            licenses.map((license) => {
              const seatUtilization = getSeatUtilization(license.used_seats, license.total_seats);
              const expiryText = getExpiryText(license.expiry_date);

              return (
                <div key={license.id} className="p-3 rounded-lg bg-muted/50 group">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{license.name}</span>
                      {license.version && (
                        <span className="text-xs text-muted-foreground">{license.version}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(license)}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleOpenEdit(license)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete License</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{license.name}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(license.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>

                  {/* Seat Progress Bar */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>Seats: {license.used_seats} / {license.total_seats}</span>
                      <span className={seatUtilization >= license.seat_alert_threshold ? 'text-warning' : ''}>
                        {seatUtilization}%
                      </span>
                    </div>
                    <Progress
                      value={seatUtilization}
                      className={`h-1.5 ${seatUtilization >= license.seat_alert_threshold ? '[&>div]:bg-warning' : ''}`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{license.vendor || 'Unknown vendor'}</span>
                    {expiryText && (
                      <span className={license.status === 'expiring' || license.status === 'expired' ? 'text-warning' : ''}>
                        {expiryText}
                      </span>
                    )}
                    {license.total_cost && (
                      <span>${license.total_cost.toLocaleString()}/yr</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
