import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  Search,
  Mail,
  Phone,
  Globe,
  MapPin,
  Loader2,
  Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { format } from 'date-fns';

type VendorStatus = 'PENDING' | 'VERIFIED' | 'REJECTED' | 'SUSPENDED';

interface Vendor {
  id: string;
  user_id: string;
  business_name: string;
  business_type: string;
  description: string | null;
  contact_email: string;
  contact_phone: string | null;
  website: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  categories: string[];
  documents: any[];
  portfolio_urls: string[];
  verification_status: VendorStatus;
  verified_at: string | null;
  verified_by: string | null;
  rejection_reason: string | null;
  created_at: string;
}

const getStatusBadge = (status: VendorStatus) => {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="secondary" className="gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          <Clock className="w-3 h-3" />
          Pending
        </Badge>
      );
    case 'VERIFIED':
      return (
        <Badge variant="secondary" className="gap-1.5 bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
          <CheckCircle2 className="w-3 h-3" />
          Verified
        </Badge>
      );
    case 'REJECTED':
      return (
        <Badge variant="secondary" className="gap-1.5 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
          <XCircle className="w-3 h-3" />
          Rejected
        </Badge>
      );
    case 'SUSPENDED':
      return (
        <Badge variant="secondary" className="gap-1.5 bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200">
          <AlertCircle className="w-3 h-3" />
          Suspended
        </Badge>
      );
    default:
      return null;
  }
};

export const VendorApprovalPanel: React.FC = () => {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<VendorStatus | 'all'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch all vendors
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ['admin-vendors'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Vendor[];
    },
  });

  // Helper to send status email
  const sendStatusEmail = async (vendor: Vendor, status: 'VERIFIED' | 'REJECTED' | 'SUSPENDED', rejectionReason?: string) => {
    try {
      await supabase.functions.invoke('send-vendor-status-email', {
        body: {
          vendorEmail: vendor.contact_email,
          vendorName: vendor.business_name,
          status,
          rejectionReason,
        },
      });
      console.log(`Status email sent to ${vendor.contact_email}`);
    } catch (error) {
      console.error('Failed to send status email:', error);
      // Don't throw - email failure shouldn't block the status update
    }
  };

  // Approve vendor mutation
  const approveMutation = useMutation({
    mutationFn: async (vendor: Vendor) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('vendors')
        .update({
          verification_status: 'VERIFIED',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          rejection_reason: null,
        })
        .eq('id', vendor.id);
      
      if (error) throw error;
      
      // Send approval email
      await sendStatusEmail(vendor, 'VERIFIED');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success('Vendor approved successfully', {
        description: 'An email notification has been sent to the vendor.',
      });
      setShowDetailsDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to approve vendor');
    },
  });

  // Reject vendor mutation
  const rejectMutation = useMutation({
    mutationFn: async ({ vendor, reason }: { vendor: Vendor; reason: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('vendors')
        .update({
          verification_status: 'REJECTED',
          verified_at: new Date().toISOString(),
          verified_by: user?.id,
          rejection_reason: reason,
        })
        .eq('id', vendor.id);
      
      if (error) throw error;
      
      // Send rejection email
      await sendStatusEmail(vendor, 'REJECTED', reason);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success('Vendor rejected', {
        description: 'An email notification has been sent to the vendor.',
      });
      setShowRejectDialog(false);
      setShowDetailsDialog(false);
      setRejectionReason('');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to reject vendor');
    },
  });

  // Suspend vendor mutation
  const suspendMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      const { error } = await supabase
        .from('vendors')
        .update({
          verification_status: 'SUSPENDED',
        })
        .eq('id', vendorId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vendors'] });
      toast.success('Vendor suspended');
      setShowDetailsDialog(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to suspend vendor');
    },
  });

  // Filter vendors
  const filteredVendors = vendors.filter(vendor => {
    const matchesTab = activeTab === 'all' || vendor.verification_status === activeTab;
    const matchesSearch = !searchQuery || 
      vendor.business_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vendor.contact_email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTab && matchesSearch;
  });

  // Count by status
  const statusCounts = vendors.reduce((acc, vendor) => {
    acc[vendor.verification_status] = (acc[vendor.verification_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleApprove = (vendor: Vendor) => {
    approveMutation.mutate(vendor);
  };

  const handleReject = () => {
    if (!selectedVendor || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    rejectMutation.mutate({ vendor: selectedVendor, reason: rejectionReason });
  };

  const handleSuspend = (vendorId: string) => {
    suspendMutation.mutate(vendorId);
  };

  const openVendorDetails = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowDetailsDialog(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Vendor Management</h2>
          <p className="text-muted-foreground">Review and manage vendor applications</p>
        </div>
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search vendors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as VendorStatus | 'all')}>
        <TabsList>
          <TabsTrigger value="all" className="gap-2">
            All
            <Badge variant="secondary" className="ml-1">{vendors.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="PENDING" className="gap-2">
            <Clock className="w-4 h-4" />
            Pending
            <Badge variant="secondary" className="ml-1 bg-amber-100 text-amber-800">{statusCounts.PENDING || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="VERIFIED" className="gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Verified
            <Badge variant="secondary" className="ml-1">{statusCounts.VERIFIED || 0}</Badge>
          </TabsTrigger>
          <TabsTrigger value="REJECTED" className="gap-2">
            <XCircle className="w-4 h-4" />
            Rejected
            <Badge variant="secondary" className="ml-1">{statusCounts.REJECTED || 0}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : filteredVendors.length === 0 ? (
            <Card className="p-12 text-center">
              <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">No vendors found</h3>
              <p className="text-muted-foreground">
                {searchQuery ? 'Try adjusting your search' : 'No vendors in this category'}
              </p>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredVendors.map((vendor) => (
                <Card key={vendor.id} className="overflow-hidden">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Building2 className="w-6 h-6 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold text-foreground">{vendor.business_name}</h3>
                            {getStatusBadge(vendor.verification_status)}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {vendor.contact_email}
                            </span>
                            {vendor.city && vendor.country && (
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {vendor.city}, {vendor.country}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {vendor.categories?.slice(0, 3).map((cat) => (
                              <Badge key={cat} variant="outline" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                            {vendor.categories?.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{vendor.categories.length - 3} more
                              </Badge>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            Applied: {format(new Date(vendor.created_at), 'MMM d, yyyy')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openVendorDetails(vendor)}
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                        {vendor.verification_status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleApprove(vendor)}
                              disabled={approveMutation.isPending}
                            >
                              {approveMutation.isPending ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-2" />
                                  Approve
                                </>
                              )}
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                setSelectedVendor(vendor);
                                setShowRejectDialog(true);
                              }}
                            >
                              <XCircle className="w-4 h-4 mr-2" />
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Vendor Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vendor Details</DialogTitle>
            <DialogDescription>
              Review the vendor application details
            </DialogDescription>
          </DialogHeader>
          {selectedVendor && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedVendor.business_name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    {getStatusBadge(selectedVendor.verification_status)}
                    <span className="text-sm text-muted-foreground">
                      Applied: {format(new Date(selectedVendor.created_at), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    {selectedVendor.contact_email}
                  </p>
                </div>
                {selectedVendor.contact_phone && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Phone</label>
                    <p className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {selectedVendor.contact_phone}
                    </p>
                  </div>
                )}
                {selectedVendor.website && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Website</label>
                    <p className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                      <a href={selectedVendor.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        {selectedVendor.website}
                      </a>
                    </p>
                  </div>
                )}
                {(selectedVendor.city || selectedVendor.country) && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Location</label>
                    <p className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {[selectedVendor.city, selectedVendor.state, selectedVendor.country].filter(Boolean).join(', ')}
                    </p>
                  </div>
                )}
              </div>

              {selectedVendor.description && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Description</label>
                  <p className="mt-1 text-sm">{selectedVendor.description}</p>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-muted-foreground">Categories</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedVendor.categories?.map((cat) => (
                    <Badge key={cat} variant="secondary">{cat}</Badge>
                  ))}
                </div>
              </div>

              {selectedVendor.rejection_reason && (
                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
                  <label className="text-sm font-medium text-red-800 dark:text-red-200">Rejection Reason</label>
                  <p className="mt-1 text-sm text-red-700 dark:text-red-300">{selectedVendor.rejection_reason}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="gap-2">
            {selectedVendor?.verification_status === 'PENDING' && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => setShowRejectDialog(true)}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedVendor)}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  Approve Vendor
                </Button>
              </>
            )}
            {selectedVendor?.verification_status === 'VERIFIED' && (
              <Button
                variant="destructive"
                onClick={() => handleSuspend(selectedVendor.id)}
                disabled={suspendMutation.isPending}
              >
                {suspendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <AlertCircle className="w-4 h-4 mr-2" />
                )}
                Suspend Vendor
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Vendor Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting this vendor application.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Rejection Reason *</label>
              <Textarea
                placeholder="Explain why this application is being rejected..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <XCircle className="w-4 h-4 mr-2" />
              )}
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VendorApprovalPanel;
