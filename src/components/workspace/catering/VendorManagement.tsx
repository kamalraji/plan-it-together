import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus, 
  ChefHat, 
  Phone, 
  Mail, 
  MapPin,
  Star,
  Check,
  Clock,
  Edit2,
  Trash2,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCateringVendors, useCateringVendorMutations, CateringVendor } from '@/hooks/useCateringData';

interface VendorManagementProps {
  workspaceId: string;
}

export function VendorManagement({ workspaceId }: VendorManagementProps) {
  const { data: vendors = [], isLoading } = useCateringVendors(workspaceId);
  const { createVendor, updateVendor, deleteVendor } = useCateringVendorMutations(workspaceId);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<CateringVendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    vendor_type: 'caterer' as CateringVendor['vendor_type'],
    contact_name: '',
    phone: '',
    email: '',
    address: '',
    contract_value: 0,
    notes: '',
  });

  const vendorTypeConfig = {
    caterer: { label: 'Caterer', color: 'text-warning', bgColor: 'bg-warning/10' },
    bakery: { label: 'Bakery', color: 'text-primary', bgColor: 'bg-primary/10' },
    beverage: { label: 'Beverage', color: 'text-info', bgColor: 'bg-info/10' },
    specialty: { label: 'Specialty', color: 'text-primary', bgColor: 'bg-primary/10' },
  };

  const statusConfig = {
    confirmed: { label: 'Confirmed', color: 'bg-success/10 text-success border-success/20' },
    pending: { label: 'Pending', color: 'bg-warning/10 text-warning border-warning/20' },
    contacted: { label: 'Contacted', color: 'bg-info/10 text-info border-info/20' },
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    const vendorData = {
      name: formData.name,
      vendor_type: formData.vendor_type,
      contact_name: formData.contact_name || null,
      phone: formData.phone || null,
      email: formData.email || null,
      address: formData.address || null,
      rating: editingVendor?.rating || 0,
      status: editingVendor?.status || 'contacted' as const,
      contract_value: formData.contract_value,
      notes: formData.notes || null,
    };

    if (editingVendor) {
      await updateVendor.mutateAsync({ id: editingVendor.id, ...vendorData });
    } else {
      await createVendor.mutateAsync(vendorData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      vendor_type: 'caterer',
      contact_name: '',
      phone: '',
      email: '',
      address: '',
      contract_value: 0,
      notes: '',
    });
    setEditingVendor(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (vendor: CateringVendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      vendor_type: vendor.vendor_type,
      contact_name: vendor.contact_name || '',
      phone: vendor.phone || '',
      email: vendor.email || '',
      address: vendor.address || '',
      contract_value: vendor.contract_value,
      notes: vendor.notes || '',
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteVendor.mutate(id);
  };

  const confirmVendor = (id: string) => {
    updateVendor.mutate({ id, status: 'confirmed' });
  };

  const totalContractValue = vendors.reduce((acc, v) => acc + Number(v.contract_value), 0);
  const confirmedVendors = vendors.filter(v => v.status === 'confirmed').length;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-warning" />
            Vendor Management
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-warning" />
            Vendor Management
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            {confirmedVendors}/{vendors.length} confirmed • ${totalContractValue.toLocaleString()} total
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-1" />
              Add Vendor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{editingVendor ? 'Edit Vendor' : 'Add Vendor'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Vendor Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Vendor name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Type</Label>
                  <select 
                    className="w-full p-2 border rounded-md bg-background"
                    value={formData.vendor_type}
                    onChange={(e) => setFormData({ ...formData, vendor_type: e.target.value as CateringVendor['vendor_type'] })}
                  >
                    <option value="caterer">Caterer</option>
                    <option value="bakery">Bakery</option>
                    <option value="beverage">Beverage</option>
                    <option value="specialty">Specialty</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Contact Name</Label>
                  <Input
                    value={formData.contact_name}
                    onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                    placeholder="Contact person"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Value ($)</Label>
                  <Input
                    type="number"
                    value={formData.contract_value}
                    onChange={(e) => setFormData({ ...formData, contract_value: parseInt(e.target.value) || 0 })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@vendor.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Address</Label>
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Vendor address"
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={resetForm}>Cancel</Button>
                <Button 
                  onClick={handleSubmit}
                  disabled={createVendor.isPending || updateVendor.isPending}
                >
                  {(createVendor.isPending || updateVendor.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingVendor ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {vendors.map((vendor) => {
          const typeConfig = vendorTypeConfig[vendor.vendor_type];
          const status = statusConfig[vendor.status];
          return (
            <div
              key={vendor.id}
              className="p-4 rounded-lg border border-border/50 bg-muted/30 space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${typeConfig.bgColor}`}>
                    <ChefHat className={`h-4 w-4 ${typeConfig.color}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{vendor.name}</h4>
                      <Badge variant="outline" className={`text-xs ${status.color}`}>
                        {vendor.status === 'confirmed' ? <Check className="h-3 w-3 mr-1" /> : <Clock className="h-3 w-3 mr-1" />}
                        {status.label}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">{typeConfig.label}</Badge>
                      {Number(vendor.rating) > 0 && (
                        <span className="flex items-center text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-warning mr-1" />
                          {vendor.rating}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ${Number(vendor.contract_value).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {vendor.status !== 'confirmed' && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => confirmVendor(vendor.id)}>
                      <Check className="h-4 w-4 text-success" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleEdit(vendor)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDelete(vendor.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Phone className="h-3 w-3" />
                  {vendor.phone || 'No phone'}
                </div>
                <div className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {vendor.email || 'No email'}
                </div>
                <div className="flex items-center gap-1 col-span-2">
                  <MapPin className="h-3 w-3" />
                  {vendor.address || 'No address'}
                </div>
              </div>
              
              {vendor.notes && (
                <p className="text-xs text-muted-foreground italic">"{vendor.notes}"</p>
              )}
            </div>
          );
        })}
        
        {vendors.length === 0 && (
          <p className="text-center text-muted-foreground py-8">No vendors added yet</p>
        )}
      </CardContent>
    </Card>
  );
}
