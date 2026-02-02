import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../lib/api';

interface ShortlistItem {
  id: string;
  eventId: string;
  serviceListingId: string;
  addedAt: string;
  notes?: string;
  serviceListing: {
    id: string;
    title: string;
    description: string;
    category: string;
    pricing: {
      type: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM_QUOTE';
      basePrice?: number;
      currency: string;
    };
    vendor: {
      id: string;
      businessName: string;
      verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
      rating: number;
      reviewCount: number;
      responseTime: number;
    };
  };
}

interface VendorShortlistProps {
  eventId: string;
  onRequestQuote: (service: ShortlistItem['serviceListing']) => void;
}

const VendorShortlist: React.FC<VendorShortlistProps> = ({ eventId, onRequestQuote }) => {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const queryClient = useQueryClient();

  // Fetch shortlist items
  const { data: shortlistItems, isLoading } = useQuery({
    queryKey: ['vendor-shortlist', eventId],
    queryFn: async () => {
      const response = await api.get(`/marketplace/shortlist/${eventId}`);
      return response.data.items as ShortlistItem[];
    },
  });

  // Remove from shortlist mutation
  const removeFromShortlistMutation = useMutation({
    mutationFn: async (shortlistItemId: string) => {
      await api.delete(`/marketplace/shortlist/${shortlistItemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-shortlist', eventId] });
    },
  });

  // Update notes mutation
  const updateNotesMutation = useMutation({
    mutationFn: async ({ itemId, notes }: { itemId: string; notes: string }) => {
      await api.patch(`/marketplace/shortlist/${itemId}`, { notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-shortlist', eventId] });
      setEditingNotes(null);
      setNoteText('');
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

  const formatPrice = (pricing: ShortlistItem['serviceListing']['pricing']) => {
    if (pricing.type === 'CUSTOM_QUOTE') {
      return 'Custom Quote';
    }
    
    const price = pricing.basePrice || 0;
    const currency = pricing.currency || 'USD';
    
    switch (pricing.type) {
      case 'FIXED':
        return `${currency} ${price.toLocaleString()}`;
      case 'HOURLY':
        return `${currency} ${price.toLocaleString()}/hour`;
      case 'PER_PERSON':
        return `${currency} ${price.toLocaleString()}/person`;
      default:
        return 'Contact for pricing';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Vendor Shortlist
          </h3>
          <p className="text-sm text-gray-600">
            Services you've saved for this event
          </p>
        </div>
        <div className="text-sm text-gray-500">
          {shortlistItems?.length || 0} services saved
        </div>
      </div>

      {/* Shortlist Items */}
      {shortlistItems && shortlistItems.length > 0 ? (
        <div className="space-y-4">
          {shortlistItems.map((item) => (
            <div key={item.id} className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Service Info */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        {item.serviceListing.title}
                      </h4>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {item.serviceListing.description}
                      </p>
                      
                      {/* Vendor Info */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {item.serviceListing.vendor.businessName}
                          </span>
                          {item.serviceListing.vendor.verificationStatus === 'VERIFIED' && (
                            <svg className="ml-1 w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        
                        <div className="flex items-center">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${
                                  i < Math.floor(item.serviceListing.vendor.rating)
                                    ? 'text-yellow-400'
                                    : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="ml-1 text-sm text-gray-600">
                            {item.serviceListing.vendor.rating.toFixed(1)} ({item.serviceListing.vendor.reviewCount} reviews)
                          </span>
                        </div>
                        
                        <span className="text-sm text-gray-500">
                          Responds in ~{item.serviceListing.vendor.responseTime}h
                        </span>
                      </div>

                      {/* Category and Pricing */}
                      <div className="flex items-center justify-between mb-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {item.serviceListing.category.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                        <div className="text-lg font-semibold text-gray-900">
                          {formatPrice(item.serviceListing.pricing)}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium text-gray-700">Notes</label>
                      {editingNotes !== item.id && (
                        <button
                          onClick={() => handleEditNotes(item)}
                          className="text-sm text-blue-600 hover:text-blue-800"
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
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveNotes(item.id)}
                            disabled={updateNotesMutation.isPending}
                            className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                          >
                            {updateNotesMutation.isPending ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="px-3 py-1 border border-gray-300 text-gray-700 text-sm rounded hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-600 bg-gray-50 rounded-md p-3 min-h-[60px]">
                        {item.notes || 'No notes added yet'}
                      </div>
                    )}
                  </div>

                  {/* Added Date */}
                  <div className="text-xs text-gray-500 mb-4">
                    Added on {new Date(item.addedAt).toLocaleDateString()}
                  </div>

                  {/* Actions */}
                  <div className="flex space-x-3">
                    <button
                      onClick={() => onRequestQuote(item.serviceListing)}
                      className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors text-sm"
                    >
                      Request Quote
                    </button>
                    <button
                      onClick={() => removeFromShortlistMutation.mutate(item.id)}
                      disabled={removeFromShortlistMutation.isPending}
                      className="border border-red-300 text-red-700 px-4 py-2 rounded-md hover:bg-red-50 transition-colors text-sm disabled:opacity-50"
                    >
                      {removeFromShortlistMutation.isPending ? 'Removing...' : 'Remove from Shortlist'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No vendors in shortlist</h3>
          <p className="text-gray-600">
            Start adding services to your shortlist to compare and manage vendors for this event.
          </p>
        </div>
      )}
    </div>
  );
};

export default VendorShortlist;