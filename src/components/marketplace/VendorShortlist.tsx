import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VendorService {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  pricing_type: string;
  base_price: number | null;
  vendors?: {
    id: string;
    business_name: string;
    verification_status: string;
  };
}

interface ShortlistItem {
  id: string;
  event_id: string;
  service_id: string;
  added_at: string;
  notes: string | null;
  vendor_services?: VendorService;
}

interface VendorShortlistProps {
  eventId: string;
  onRequestQuote: (service: {
    id: string;
    title: string;
    description: string;
    category: string;
    pricing: {
      type: string;
      basePrice?: number;
      currency: string;
    };
    vendor: {
      id: string;
      businessName: string;
      verificationStatus: string;
      rating: number;
      reviewCount: number;
    };
  }) => void;
}

const VendorShortlist: React.FC<VendorShortlistProps> = ({ eventId, onRequestQuote }) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const queryClient = useQueryClient();

  // Fetch shortlist items from vendor_shortlist table
  const { data: shortlistItems, isLoading } = useQuery({
    queryKey: ['vendor-shortlist', eventId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Check if vendor_shortlist table exists and fetch data
      const { data, error } = await supabase
        .from('vendor_shortlist')
        .select(`
          *,
          vendor_services (
            id,
            vendor_id,
            name,
            description,
            category,
            pricing_type,
            base_price,
            vendors (id, business_name, verification_status)
          )
        `)
        .eq('event_id', eventId)
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        // Table may not exist yet - return empty array
        console.log('Shortlist table not available:', error.message);
        return [];
      }

      return (data || []) as ShortlistItem[];
    },
  });

  // Remove from shortlist mutation
  const removeFromShortlistMutation = useMutation({
    mutationFn: async (shortlistItemId: string) => {
      const { error } = await supabase
        .from('vendor_shortlist')
        .delete()
        .eq('id', shortlistItemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-shortlist', eventId] });
      toast.success('Removed from shortlist');
    },
    onError: () => {
      toast.error('Failed to remove from shortlist');
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
      const { error } = await supabase
        .from('vendor_shortlist')
        .update({ notes })
        .eq('id', itemId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-shortlist', eventId] });
      setEditingNotes(null);
      setNoteText('');
      toast.success('Notes updated');
    },
    onError: () => {
      toast.error('Failed to update notes');
    },
  });

  const handleEditNotes = (item: ShortlistItem) => {
    setEditingNotes(item.id);
    setNoteText(item.notes || '');
  };

  const handleSaveNotes = (itemId: string) => {
    updateNotesMutation.mutate({ itemId, notes: noteText });
  };

  const handleCancelEdit = () => {
    setEditingNotes(null);
    setNoteText('');
  };

  const formatPrice = (pricingType: string, basePrice: number | null) => {
    if (pricingType === 'CUSTOM_QUOTE' || !basePrice) {
      return 'Custom Quote';
    }
    
    switch (pricingType) {
      case 'FIXED':
        return `₹${basePrice.toLocaleString()}`;
      case 'HOURLY':
        return `₹${basePrice.toLocaleString()}/hour`;
      case 'PER_PERSON':
        return `₹${basePrice.toLocaleString()}/person`;
      default:
        return 'Contact for pricing';
    }
  };

  const handleRequestQuote = (item: ShortlistItem) => {
    if (!item.vendor_services) return;

    const service = item.vendor_services;
    onRequestQuote({
      id: service.id,
      title: service.name,
      description: service.description || '',
      category: service.category,
      pricing: {
        type: service.pricing_type,
        basePrice: service.base_price || undefined,
        currency: 'INR',
      },
      vendor: {
        id: service.vendor_id,
        businessName: service.vendors?.business_name || 'Unknown Vendor',
        verificationStatus: service.vendors?.verification_status || 'pending',
        rating: 0, // Would need vendor_reviews aggregation
        reviewCount: 0,
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Vendor Shortlist
          </h3>
          <p className="text-sm text-muted-foreground">
            Services you've saved for this event
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          {shortlistItems?.length || 0} services saved
        </div>
      </div>

      {/* Shortlist Items */}
      {shortlistItems && shortlistItems.length > 0 ? (
        <div className="space-y-4">
          {shortlistItems.map((item) => {
            const service = item.vendor_services;
            if (!service) return null;

            return (
              <div key={item.id} className="bg-card border border-border rounded-lg p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Service Info */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-foreground mb-2">
                          {service.name}
                        </h4>
                        {service.description && (
                          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        
                        {/* Vendor Info */}
                        <div className="flex items-center space-x-4 mb-3">
                          <div className="flex items-center">
                            <span className="text-sm font-medium text-foreground">
                              {service.vendors?.business_name}
                            </span>
                            {service.vendors?.verification_status === 'verified' && (
                              <svg className="ml-1 w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Category and Pricing */}
                        <div className="flex items-center justify-between mb-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-muted text-foreground">
                            {service.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                          <div className="text-lg font-semibold text-foreground">
                            {formatPrice(service.pricing_type, service.base_price)}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes Section */}
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-sm font-medium text-foreground">Notes</label>
                        {editingNotes !== item.id && (
                          <button
                            onClick={() => handleEditNotes(item)}
                            className="text-sm text-primary hover:text-primary/80"
                          >
                            {item.notes ? 'Edit' : 'Add Note'}
                          </button>
                        )}
                      </div>
                      
                      {editingNotes === item.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={noteText}
                            onChange={(e) => setNoteText(e.target.value)}
                            placeholder="Add notes about this vendor..."
                            rows={3}
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus-visible:ring-ring text-sm"
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSaveNotes(item.id)}
                              disabled={updateNotesMutation.isPending}
                              className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90 disabled:opacity-50"
                            >
                              {updateNotesMutation.isPending ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="px-3 py-1 border border-input text-foreground text-sm rounded hover:bg-muted/50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm text-muted-foreground bg-muted/50 rounded-md p-3 min-h-[60px]">
                          {item.notes || 'No notes added yet'}
                        </div>
                      )}
                    </div>

                    {/* Added Date */}
                    <div className="text-xs text-muted-foreground mb-4">
                      Added on {new Date(item.added_at).toLocaleDateString()}
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleRequestQuote(item)}
                        className="bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors text-sm"
                      >
                        Request Quote
                      </button>
                      <button
                        onClick={() => removeFromShortlistMutation.mutate(item.id)}
                        disabled={removeFromShortlistMutation.isPending}
                        className="border border-red-300 text-red-700 px-4 py-2 rounded-md hover:bg-red-50 transition-colors text-sm disabled:opacity-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        {removeFromShortlistMutation.isPending ? 'Removing...' : 'Remove from Shortlist'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-muted-foreground mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No vendors in shortlist</h3>
          <p className="text-muted-foreground">
            Start adding services to your shortlist to compare and manage vendors for this event.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorShortlist;
