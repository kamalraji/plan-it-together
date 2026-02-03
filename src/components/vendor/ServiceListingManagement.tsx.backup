import React, { useState, useEffect } from 'react';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface WeeklySchedule {
  monday?: TimeSlot[];
  tuesday?: TimeSlot[];
  wednesday?: TimeSlot[];
  thursday?: TimeSlot[];
  friday?: TimeSlot[];
  saturday?: TimeSlot[];
  sunday?: TimeSlot[];
}

interface CustomAvailabilitySlot {
  date: Date;
  available: boolean;
  timeSlots?: TimeSlot[];
}

interface AvailabilityCalendar {
  timezone: string;
  recurringAvailability: WeeklySchedule;
  blockedDates: Date[];
  customAvailability: CustomAvailabilitySlot[];
}

interface PackageDeal {
  name: string;
  description: string;
  services: string[];
  originalPrice: number;
  packagePrice: number;
  savings: number;
}

interface PricingModel {
  type: 'FIXED' | 'HOURLY' | 'PER_PERSON' | 'CUSTOM_QUOTE';
  basePrice?: number;
  currency: string;
  minimumOrder?: number;
  packageDeals?: PackageDeal[];
}

interface MediaFile {
  id: string;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  caption?: string;
  order: number;
}

enum ServiceCategory {
  VENUE = 'VENUE',
  CATERING = 'CATERING',
  PHOTOGRAPHY = 'PHOTOGRAPHY',
  VIDEOGRAPHY = 'VIDEOGRAPHY',
  ENTERTAINMENT = 'ENTERTAINMENT',
  DECORATION = 'DECORATION',
  AUDIO_VISUAL = 'AUDIO_VISUAL',
  TRANSPORTATION = 'TRANSPORTATION',
  SECURITY = 'SECURITY',
  CLEANING = 'CLEANING',
  EQUIPMENT_RENTAL = 'EQUIPMENT_RENTAL',
  PRINTING = 'PRINTING',
  MARKETING = 'MARKETING',
  OTHER = 'OTHER'
}

interface ServiceListing {
  id: string;
  vendorId: string;
  title: string;
  description: string;
  category: ServiceCategory;
  pricing: PricingModel;
  availability: AvailabilityCalendar;
  serviceArea: string[];
  requirements?: string;
  inclusions: string[];
  exclusions?: string[];
  media: MediaFile[];
  featured: boolean;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  viewCount: number;
  inquiryCount: number;
  bookingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateServiceDTO {
  title: string;
  description: string;
  category: ServiceCategory;
  pricing: PricingModel;
  availability: AvailabilityCalendar;
  serviceArea: string[];
  requirements?: string;
  inclusions: string[];
  exclusions?: string[];
  media: MediaFile[];
}

interface ServiceListingManagementProps {
  vendorId: string;
}

const ServiceListingManagement: React.FC<ServiceListingManagementProps> = ({ vendorId }) => {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceListing | null>(null);

  const [formData, setFormData] = useState<CreateServiceDTO>({
    title: '',
    description: '',
    category: ServiceCategory.OTHER,
    pricing: {
      type: 'FIXED',
      basePrice: 0,
      currency: 'USD',
      minimumOrder: 1,
      packageDeals: [],
    },
    availability: {
      timezone: 'UTC',
      recurringAvailability: {},
      blockedDates: [],
      customAvailability: [],
    },
    serviceArea: [],
    requirements: '',
    inclusions: [],
    exclusions: [],
    media: [],
  });

  const serviceCategories = [
    { value: ServiceCategory.VENUE, label: 'Venue & Location' },
    { value: ServiceCategory.CATERING, label: 'Catering' },
    { value: ServiceCategory.PHOTOGRAPHY, label: 'Photography' },
    { value: ServiceCategory.VIDEOGRAPHY, label: 'Videography' },
    { value: ServiceCategory.ENTERTAINMENT, label: 'Entertainment' },
    { value: ServiceCategory.DECORATION, label: 'Decoration' },
    { value: ServiceCategory.AUDIO_VISUAL, label: 'Audio/Visual' },
    { value: ServiceCategory.TRANSPORTATION, label: 'Transportation' },
    { value: ServiceCategory.SECURITY, label: 'Security' },
    { value: ServiceCategory.CLEANING, label: 'Cleaning' },
    { value: ServiceCategory.EQUIPMENT_RENTAL, label: 'Equipment Rental' },
    { value: ServiceCategory.PRINTING, label: 'Printing' },
    { value: ServiceCategory.MARKETING, label: 'Marketing' },
    { value: ServiceCategory.OTHER, label: 'Other' },
  ];

  const pricingTypes = [
    { value: 'FIXED', label: 'Fixed Price', description: 'One-time fixed cost' },
    { value: 'HOURLY', label: 'Hourly Rate', description: 'Price per hour' },
    { value: 'PER_PERSON', label: 'Per Person', description: 'Price per attendee' },
    { value: 'CUSTOM_QUOTE', label: 'Custom Quote', description: 'Contact for pricing' },
  ];

  useEffect(() => {
    fetchServices();
  }, [vendorId]);

  const fetchServices = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/vendors/${vendorId}/services`, {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to fetch services');
      }

      const data = await response.json();
      setServices(data.data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent: keyof CreateServiceDTO, field: string, value: any) => {
    setFormData(prev => {
      const parentValue = prev[parent];
      if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
        return {
          ...prev,
          [parent]: {
            ...parentValue,
            [field]: value,
          },
        };
      }
      return prev;
    });
  };

  const handleArrayInputChange = (field: keyof CreateServiceDTO, index: number, value: string) => {
    setFormData(prev => {
      const arr = prev[field];
      if (Array.isArray(arr)) {
        return {
          ...prev,
          [field]: arr.map((item: any, i: number) => 
            i === index ? value : item
          ),
        };
      }
      return prev;
    });
  };

  const addArrayItem = (field: keyof CreateServiceDTO) => {
    setFormData(prev => {
      const arr = prev[field];
      if (Array.isArray(arr)) {
        return {
          ...prev,
          [field]: [...arr, ''],
        };
      }
      return prev;
    });
  };

  const removeArrayItem = (field: keyof CreateServiceDTO, index: number) => {
    setFormData(prev => {
      const arr = prev[field];
      if (Array.isArray(arr)) {
        return {
          ...prev,
          [field]: arr.filter((_: any, i: number) => i !== index),
        };
      }
      return prev;
    });
  };

  const handleFileUpload = async (files: FileList): Promise<MediaFile[]> => {
    // In a real implementation, this would upload to a file storage service
    const uploadPromises = Array.from(files).map(async (file, index) => {
      return new Promise<MediaFile>((resolve) => {
        setTimeout(() => {
          resolve({
            id: `media-${Date.now()}-${index}`,
            url: `https://example.com/uploads/${file.name}`,
            type: file.type.startsWith('image/') ? 'IMAGE' : 
                  file.type.startsWith('video/') ? 'VIDEO' : 'DOCUMENT',
            caption: '',
            order: formData.media.length + index,
          });
        }, 1000);
      });
    });

    return Promise.all(uploadPromises);
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    try {
      const newMediaFiles = await handleFileUpload(files);
      setFormData(prev => ({
        ...prev,
        media: [...prev.media, ...newMediaFiles],
      }));
    } catch (err) {
      setError('Failed to upload media files');
    }
  };

  const removeMediaItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      media: prev.media.filter(item => item.id !== id),
    }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    try {
      setLoading(true);
      setError(null);

      const url = editingService 
        ? `/api/vendors/${vendorId}/services/${editingService.id}`
        : `/api/vendors/${vendorId}/services`;
      
      const method = editingService ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save service');
      }

      await fetchServices();
      setShowCreateForm(false);
      setEditingService(null);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (service: ServiceListing) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      description: service.description,
      category: service.category,
      pricing: service.pricing,
      availability: service.availability,
      serviceArea: service.serviceArea,
      requirements: service.requirements || '',
      inclusions: service.inclusions,
      exclusions: service.exclusions || [],
      media: service.media,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      const response = await fetch(`/api/vendors/${vendorId}/services/${serviceId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to delete service');
      }

      await fetchServices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleServiceStatus = async (serviceId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    
    try {
      const response = await fetch(`/api/vendors/${vendorId}/services/${serviceId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update service status');
      }

      await fetchServices();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      category: ServiceCategory.OTHER,
      pricing: {
        type: 'FIXED',
        basePrice: 0,
        currency: 'USD',
        minimumOrder: 1,
        packageDeals: [],
      },
      availability: {
        timezone: 'UTC',
        recurringAvailability: {},
        blockedDates: [],
        customAvailability: [],
      },
      serviceArea: [],
      requirements: '',
      inclusions: [],
      exclusions: [],
      media: [],
    });
  };

  const renderServiceForm = () => (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">
          {editingService ? 'Edit Service' : 'Create New Service'}
        </h2>
        <button
          onClick={() => {
            setShowCreateForm(false);
            setEditingService(null);
            resetForm();
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700">
              Service Title *
            </label>
            <input
              type="text"
              id="title"
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700">
              Category *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value as ServiceCategory)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              required
            >
              {serviceCategories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description *
          </label>
          <textarea
            id="description"
            rows={4}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Describe your service in detail"
            required
          />
        </div>

        {/* Pricing */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pricing</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="pricingType" className="block text-sm font-medium text-gray-700">
                Pricing Type *
              </label>
              <select
                id="pricingType"
                value={formData.pricing.type}
                onChange={(e) => handleNestedInputChange('pricing', 'type', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              >
                {pricingTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            {formData.pricing.type !== 'CUSTOM_QUOTE' && (
              <div>
                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
                  Base Price *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-gray-500 sm:text-sm">$</span>
                  </div>
                  <input
                    type="number"
                    id="basePrice"
                    value={formData.pricing.basePrice || ''}
                    onChange={(e) => handleNestedInputChange('pricing', 'basePrice', parseFloat(e.target.value))}
                    className="pl-7 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>
            )}
          </div>

          {formData.pricing.type !== 'CUSTOM_QUOTE' && (
            <div className="mt-4">
              <label htmlFor="minimumOrder" className="block text-sm font-medium text-gray-700">
                Minimum Order
              </label>
              <input
                type="number"
                id="minimumOrder"
                value={formData.pricing.minimumOrder || ''}
                onChange={(e) => handleNestedInputChange('pricing', 'minimumOrder', parseInt(e.target.value))}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          )}
        </div>

        {/* Service Areas */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Service Areas</h3>
          
          <div className="space-y-2">
            {formData.serviceArea.map((area, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={area}
                  onChange={(e) => handleArrayInputChange('serviceArea', index, e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter city or region"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('serviceArea', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('serviceArea')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Service Area
            </button>
          </div>
        </div>

        {/* Inclusions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">What's Included</h3>
          
          <div className="space-y-2">
            {formData.inclusions.map((inclusion, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={inclusion}
                  onChange={(e) => handleArrayInputChange('inclusions', index, e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What's included in this service"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('inclusions', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('inclusions')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Inclusion
            </button>
          </div>
        </div>

        {/* Exclusions */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Exclusions (Optional)</h3>
          
          <div className="space-y-2">
            {formData.exclusions?.map((exclusion, index) => (
              <div key={index} className="flex items-center space-x-2">
                <input
                  type="text"
                  value={exclusion}
                  onChange={(e) => handleArrayInputChange('exclusions', index, e.target.value)}
                  className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                  placeholder="What's not included"
                />
                <button
                  type="button"
                  onClick={() => removeArrayItem('exclusions', index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={() => addArrayItem('exclusions')}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              + Add Exclusion
            </button>
          </div>
        </div>

        {/* Requirements */}
        <div className="border-t pt-6">
          <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
            Special Requirements (Optional)
          </label>
          <textarea
            id="requirements"
            rows={3}
            value={formData.requirements}
            onChange={(e) => handleInputChange('requirements', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any special requirements or conditions"
          />
        </div>

        {/* Media Upload */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Media</h3>
          
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
            <div className="space-y-1 text-center">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="media"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
                >
                  <span>Upload media files</span>
                  <input
                    id="media"
                    name="media"
                    type="file"
                    multiple
                    className="sr-only"
                    accept="image/*,video/*"
                    onChange={handleMediaUpload}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">Images and videos up to 10MB each</p>
            </div>
          </div>

          {formData.media.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Media</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {formData.media.map((item) => (
                  <div key={item.id} className="relative group">
                    <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                      {item.type === 'IMAGE' ? (
                        <img
                          src={item.url}
                          alt={item.caption || 'Service media'}
                          className="h-full w-full object-cover object-center group-hover:opacity-75"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full">
                          <div className="text-center">
                            <svg
                              className="mx-auto h-12 w-12 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-xs text-gray-500 mt-1">VIDEO</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => removeMediaItem(item.id)}
                      className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setShowCreateForm(false);
              setEditingService(null);
              resetForm();
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
          </button>
        </div>
      </form>
    </div>
  );

  if (loading && !showCreateForm) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error && !showCreateForm) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading services</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
            <div className="mt-4">
              <button
                onClick={fetchServices}
                className="bg-red-100 px-3 py-2 rounded-md text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (showCreateForm) {
    return renderServiceForm();
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Service Listings</h1>
          <p className="mt-1 text-gray-600">
            Manage your marketplace service offerings
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add Service
        </button>
      </div>

      {/* Services List */}
      {services.length === 0 ? (
        <div className="text-center py-12">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
            />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating your first service listing.
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="-ml-1 mr-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Service
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {services.map((service) => (
            <div key={service.id} className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h3 className="text-lg font-medium text-gray-900">{service.title}</h3>
                      <span className={`ml-3 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        service.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                        service.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {service.status}
                      </span>
                      {service.featured && (
                        <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Featured
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{service.description}</p>
                    <div className="mt-2 flex items-center text-sm text-gray-500">
                      <span className="capitalize">{service.category.toLowerCase().replace('_', ' ')}</span>
                      <span className="mx-2">•</span>
                      <span>
                        {service.pricing.type === 'CUSTOM_QUOTE' 
                          ? 'Custom Quote' 
                          : `$${service.pricing.basePrice} ${service.pricing.type.toLowerCase()}`
                        }
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => toggleServiceStatus(service.id, service.status)}
                      className={`px-3 py-1 text-xs font-medium rounded-md ${
                        service.status === 'ACTIVE'
                          ? 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {service.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleEdit(service)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(service.id)}
                      className="text-red-600 hover:text-red-800 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Service Stats */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{service.viewCount}</div>
                    <div className="text-xs text-gray-500">Views</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{service.inquiryCount}</div>
                    <div className="text-xs text-gray-500">Inquiries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-900">{service.bookingCount}</div>
                    <div className="text-xs text-gray-500">Bookings</div>
                  </div>
                </div>

                {/* Service Areas */}
                {service.serviceArea.length > 0 && (
                  <div className="mt-4">
                    <div className="text-sm text-gray-500">Service Areas:</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {service.serviceArea.slice(0, 3).map((area, index) => (
                        <span key={index} className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          {area}
                        </span>
                      ))}
                      {service.serviceArea.length > 3 && (
                        <span className="inline-flex px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded">
                          +{service.serviceArea.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ServiceListingManagement;