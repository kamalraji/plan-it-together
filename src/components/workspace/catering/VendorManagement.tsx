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
  Trash2
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
import { toast } from 'sonner';

interface Vendor {
  id: string;
  name: string;
  type: 'caterer' | 'bakery' | 'beverage' | 'specialty';
  contactName: string;
  phone: string;
  email: string;
  address: string;
  rating: number;
  status: 'confirmed' | 'pending' | 'contacted';
  contractValue: number;
  notes: string;
}

interface VendorManagementProps {
  workspaceId: string;
}

export function VendorManagement({ workspaceId: _workspaceId }: VendorManagementProps) {
  const [vendors, setVendors] = useState<Vendor[]>([
    {
      id: '1',
      name: 'Gourmet Events Co.',
      type: 'caterer',
      contactName: 'Sarah Johnson',
      phone: '+1 (555) 123-4567',
      email: 'sarah@gourmetevents.com',
      address: '123 Culinary Lane, Food City',
      rating: 4.8,
      status: 'confirmed',
      contractValue: 15000,
      notes: 'Primary caterer for main meals',
    },
    {
      id: '2',
      name: 'Sweet Delights Bakery',
      type: 'bakery',
      contactName: 'Mike Brown',
      phone: '+1 (555) 234-5678',
      email: 'mike@sweetdelights.com',
      address: '456 Pastry Ave, Bake Town',
      rating: 4.6,
      status: 'confirmed',
      contractValue: 3500,
      notes: 'Desserts and pastries',
    },
    {
      id: '3',
      name: 'Premium Beverages Inc.',
      type: 'beverage',
      contactName: 'Lisa Chen',
      phone: '+1 (555) 345-6789',
      email: 'lisa@premiumbev.com',
      address: '789 Drink Blvd, Refresh City',
      rating: 4.5,
      status: 'pending',
      contractValue: 5000,
      notes: 'Coffee, tea, and specialty drinks',
    },
  ]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'caterer' as Vendor['type'],
    contactName: '',
    phone: '',
    email: '',
    address: '',
    contractValue: 0,
    notes: '',
  });

  const vendorTypeConfig = {
    caterer: { label: 'Caterer', color: 'text-orange-500', bgColor: 'bg-orange-500/10' },
    bakery: { label: 'Bakery', color: 'text-pink-500', bgColor: 'bg-pink-500/10' },
    beverage: { label: 'Beverage', color: 'text-blue-500', bgColor: 'bg-blue-500/10' },
    specialty: { label: 'Specialty', color: 'text-purple-500', bgColor: 'bg-purple-500/10' },
  };

  const statusConfig = {
    confirmed: { label: 'Confirmed', color: 'bg-green-500/10 text-green-600 border-green-500/20' },
    pending: { label: 'Pending', color: 'bg-amber-500/10 text-amber-600 border-amber-500/20' },
    contacted: { label: 'Contacted', color: 'bg-blue-500/10 text-blue-600 border-blue-500/20' },
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error('Please enter vendor name');
      return;
    }

    const newVendor: Vendor = {
      id: editingVendor?.id || Date.now().toString(),
      name: formData.name,
      type: formData.type,
      contactName: formData.contactName,
      phone: formData.phone,
      email: formData.email,
      address: formData.address,
      rating: editingVendor?.rating || 0,
      status: editingVendor?.status || 'contacted',
      contractValue: formData.contractValue,
      notes: formData.notes,
    };

    if (editingVendor) {
      setVendors(v => v.map(vendor => vendor.id === editingVendor.id ? newVendor : vendor));
      toast.success('Vendor updated');
    } else {
      setVendors(v => [...v, newVendor]);
      toast.success('Vendor added');
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'caterer',
      contactName: '',
      phone: '',
      email: '',
      address: '',
      contractValue: 0,
      notes: '',
    });
    setEditingVendor(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setFormData({
      name: vendor.name,
      type: vendor.type,
      contactName: vendor.contactName,
      phone: vendor.phone,
      email: vendor.email,
      address: vendor.address,
      contractValue: vendor.contractValue,
      notes: vendor.notes,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setVendors(v => v.filter(vendor => vendor.id !== id));
    toast.success('Vendor removed');
  };

  const confirmVendor = (id: string) => {
    setVendors(v => v.map(vendor => 
      vendor.id === id ? { ...vendor, status: 'confirmed' as const } : vendor
    ));
    toast.success('Vendor confirmed');
  };

  const totalContractValue = vendors.reduce((acc, v) => acc + v.contractValue, 0);
  const confirmedVendors = vendors.filter(v => v.status === 'confirmed').length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="h-5 w-5 text-orange-500" />
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
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as Vendor['type'] })}
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
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    placeholder="Contact person"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Contract Value ($)</Label>
                  <Input
                    type="number"
                    value={formData.contractValue}
                    onChange={(e) => setFormData({ ...formData, contractValue: parseInt(e.target.value) || 0 })}
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
                <Button onClick={handleSubmit}>{editingVendor ? 'Update' : 'Add'}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3">
        {vendors.map((vendor) => {
          const typeConfig = vendorTypeConfig[vendor.type];
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
                      {vendor.rating > 0 && (
                        <span className="flex items-center text-xs text-muted-foreground">
                          <Star className="h-3 w-3 text-amber-500 mr-1" />
                          {vendor.rating}
                        </span>
                      )}
                      <span className="text-xs text-muted-foreground">
                        ${vendor.contractValue.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  {vendor.status !== 'confirmed' && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => confirmVendor(vendor.id)}>
                      <Check className="h-4 w-4 text-green-500" />
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
