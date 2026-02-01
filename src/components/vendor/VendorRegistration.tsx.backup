import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface ContactInfo {
  email: string;
  phone: string;
  website?: string;
  socialMedia?: Record<string, string>;
}

interface Address {
  street: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
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

interface CreateVendorDTO {
  businessName: string;
  description: string;
  contactInfo: ContactInfo;
  serviceCategories: ServiceCategory[];
  businessAddress: Address;
  businessLicense?: string;
  insuranceCertificate?: string;
  portfolio: MediaFile[];
}

interface VendorRegistrationProps {
  userId: string;
  onRegistrationComplete?: (vendorId: string) => void;
}

const VendorRegistration: React.FC<VendorRegistrationProps> = ({ 
  onRegistrationComplete 
}) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateVendorDTO>({
    businessName: '',
    description: '',
    contactInfo: {
      email: '',
      phone: '',
      website: '',
      socialMedia: {},
    },
    serviceCategories: [],
    businessAddress: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
    },
    businessLicense: '',
    insuranceCertificate: '',
    portfolio: [],
  });

  const steps = [
    { id: 1, name: 'Business Info', description: 'Basic business information' },
    { id: 2, name: 'Contact & Address', description: 'Contact details and location' },
    { id: 3, name: 'Services', description: 'Service categories you offer' },
    { id: 4, name: 'Documents', description: 'Verification documents' },
    { id: 5, name: 'Portfolio', description: 'Showcase your work' },
  ];

  const serviceCategories = [
    { value: ServiceCategory.VENUE, label: 'Venue & Location', description: 'Event venues and spaces' },
    { value: ServiceCategory.CATERING, label: 'Catering', description: 'Food and beverage services' },
    { value: ServiceCategory.PHOTOGRAPHY, label: 'Photography', description: 'Event photography services' },
    { value: ServiceCategory.VIDEOGRAPHY, label: 'Videography', description: 'Video recording and production' },
    { value: ServiceCategory.ENTERTAINMENT, label: 'Entertainment', description: 'Performers and entertainment' },
    { value: ServiceCategory.DECORATION, label: 'Decoration', description: 'Event decoration and styling' },
    { value: ServiceCategory.AUDIO_VISUAL, label: 'Audio/Visual', description: 'Sound and lighting equipment' },
    { value: ServiceCategory.TRANSPORTATION, label: 'Transportation', description: 'Transport and logistics' },
    { value: ServiceCategory.SECURITY, label: 'Security', description: 'Event security services' },
    { value: ServiceCategory.CLEANING, label: 'Cleaning', description: 'Cleaning and maintenance' },
    { value: ServiceCategory.EQUIPMENT_RENTAL, label: 'Equipment Rental', description: 'Event equipment and supplies' },
    { value: ServiceCategory.PRINTING, label: 'Printing', description: 'Printing and signage services' },
    { value: ServiceCategory.MARKETING, label: 'Marketing', description: 'Event marketing and promotion' },
    { value: ServiceCategory.OTHER, label: 'Other', description: 'Other event-related services' },
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNestedInputChange = (parent: keyof CreateVendorDTO, field: string, value: any) => {
    setFormData(prev => {
      const parentValue = prev[parent];
      if (typeof parentValue === 'object' && parentValue !== null && !Array.isArray(parentValue)) {
        return {
          ...prev,
          [parent]: {
            ...(parentValue as object),
            [field]: value,
          },
        };
      }
      return prev;
    });
  };

  const handleServiceCategoryToggle = (category: ServiceCategory) => {
    setFormData(prev => ({
      ...prev,
      serviceCategories: prev.serviceCategories.includes(category)
        ? prev.serviceCategories.filter(c => c !== category)
        : [...prev.serviceCategories, category],
    }));
  };

  const handleFileUpload = async (file: File, _type: 'document' | 'portfolio'): Promise<string> => {
    // In a real implementation, this would upload to a file storage service
    // For now, we'll simulate the upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`https://example.com/uploads/${file.name}`);
      }, 1000);
    });
  };

  const handleDocumentUpload = async (event: React.ChangeEvent<HTMLInputElement>, field: string) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const url = await handleFileUpload(file, 'document');
      handleInputChange(field, url);
    } catch (err) {
      setError('Failed to upload document');
    }
  };

  const handlePortfolioUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadPromises = files.map(async (file, index) => {
        const url = await handleFileUpload(file, 'portfolio');
        return {
          id: `portfolio-${Date.now()}-${index}`,
          url,
          type: file.type.startsWith('image/') ? 'IMAGE' as const : 
                file.type.startsWith('video/') ? 'VIDEO' as const : 'DOCUMENT' as const,
          caption: '',
          order: formData.portfolio.length + index,
        };
      });

      const newPortfolioItems = await Promise.all(uploadPromises);
      setFormData(prev => ({
        ...prev,
        portfolio: [...prev.portfolio, ...newPortfolioItems],
      }));
    } catch (err) {
      setError('Failed to upload portfolio files');
    }
  };

  const removePortfolioItem = (id: string) => {
    setFormData(prev => ({
      ...prev,
      portfolio: prev.portfolio.filter(item => item.id !== id),
    }));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(formData.businessName && formData.description);
      case 2:
        return !!(
          formData.contactInfo.email &&
          formData.contactInfo.phone &&
          formData.businessAddress.street &&
          formData.businessAddress.city &&
          formData.businessAddress.state &&
          formData.businessAddress.country &&
          formData.businessAddress.postalCode
        );
      case 3:
        return formData.serviceCategories.length > 0;
      case 4:
        return !!formData.businessLicense;
      case 5:
        return true; // Portfolio is optional
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
      setError(null);
    } else {
      setError('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      setError('Please complete all required fields');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/vendors/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to register vendor profile');
      }

      const data = await response.json();
      
      if (onRegistrationComplete) {
        onRegistrationComplete(data.data.id);
      } else {
        navigate('/vendor/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
          Business Name *
        </label>
        <input
          type="text"
          id="businessName"
          value={formData.businessName}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Enter your business name"
        />
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Business Description *
        </label>
        <textarea
          id="description"
          rows={4}
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="Describe your business and the services you offer"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email Address *
          </label>
          <input
            type="email"
            id="email"
            value={formData.contactInfo.email}
            onChange={(e) => handleNestedInputChange('contactInfo', 'email', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Phone Number *
          </label>
          <input
            type="tel"
            id="phone"
            value={formData.contactInfo.phone}
            onChange={(e) => handleNestedInputChange('contactInfo', 'phone', e.target.value)}
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      <div>
        <label htmlFor="website" className="block text-sm font-medium text-gray-700">
          Website
        </label>
        <input
          type="url"
          id="website"
          value={formData.contactInfo.website}
          onChange={(e) => handleNestedInputChange('contactInfo', 'website', e.target.value)}
          className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
          placeholder="https://your-website.com"
        />
      </div>

      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Address</h3>
        
        <div className="space-y-4">
          <div>
            <label htmlFor="street" className="block text-sm font-medium text-gray-700">
              Street Address *
            </label>
            <input
              type="text"
              id="street"
              value={formData.businessAddress.street}
              onChange={(e) => handleNestedInputChange('businessAddress', 'street', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City *
              </label>
              <input
                type="text"
                id="city"
                value={formData.businessAddress.city}
                onChange={(e) => handleNestedInputChange('businessAddress', 'city', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                State *
              </label>
              <input
                type="text"
                id="state"
                value={formData.businessAddress.state}
                onChange={(e) => handleNestedInputChange('businessAddress', 'state', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                Postal Code *
              </label>
              <input
                type="text"
                id="postalCode"
                value={formData.businessAddress.postalCode}
                onChange={(e) => handleNestedInputChange('businessAddress', 'postalCode', e.target.value)}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="country" className="block text-sm font-medium text-gray-700">
              Country *
            </label>
            <input
              type="text"
              id="country"
              value={formData.businessAddress.country}
              onChange={(e) => handleNestedInputChange('businessAddress', 'country', e.target.value)}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Service Categories *
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Select all categories that apply to your business. You can add more later.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {serviceCategories.map((category) => (
            <div
              key={category.value}
              className={`relative rounded-lg border p-4 cursor-pointer hover:bg-gray-50 ${
                formData.serviceCategories.includes(category.value)
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300'
              }`}
              onClick={() => handleServiceCategoryToggle(category.value)}
            >
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    type="checkbox"
                    checked={formData.serviceCategories.includes(category.value)}
                    onChange={() => handleServiceCategoryToggle(category.value)}
                    className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3">
                  <label className="font-medium text-gray-900">
                    {category.label}
                  </label>
                  <p className="text-sm text-gray-500">
                    {category.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Verification Documents
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload the required documents to verify your business. This helps build trust with event organizers.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business License *
        </label>
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
                htmlFor="businessLicense"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload business license</span>
                <input
                  id="businessLicense"
                  name="businessLicense"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentUpload(e, 'businessLicense')}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
            {formData.businessLicense && (
              <p className="text-sm text-green-600">✓ Document uploaded</p>
            )}
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Insurance Certificate
          <span className="text-sm text-gray-500 ml-1">(Required for certain categories)</span>
        </label>
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
                htmlFor="insuranceCertificate"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload insurance certificate</span>
                <input
                  id="insuranceCertificate"
                  name="insuranceCertificate"
                  type="file"
                  className="sr-only"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleDocumentUpload(e, 'insuranceCertificate')}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">PDF, PNG, JPG up to 10MB</p>
            {formData.insuranceCertificate && (
              <p className="text-sm text-green-600">✓ Document uploaded</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Portfolio
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Showcase your best work to attract more clients. You can add photos, videos, or documents.
        </p>
      </div>

      <div>
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
                htmlFor="portfolio"
                className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500"
              >
                <span>Upload portfolio files</span>
                <input
                  id="portfolio"
                  name="portfolio"
                  type="file"
                  multiple
                  className="sr-only"
                  accept="image/*,video/*,.pdf"
                  onChange={handlePortfolioUpload}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-gray-500">Images, videos, or PDFs up to 10MB each</p>
          </div>
        </div>
      </div>

      {formData.portfolio.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Uploaded Files</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {formData.portfolio.map((item) => (
              <div key={item.id} className="relative group">
                <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-lg bg-gray-200">
                  {item.type === 'IMAGE' ? (
                    <img
                      src={item.url}
                      alt={item.caption || 'Portfolio item'}
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
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                        <p className="text-xs text-gray-500 mt-1">
                          {item.type}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => removePortfolioItem(item.id)}
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
  );

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Become a Vendor</h1>
        <p className="mt-2 text-gray-600">
          Join our marketplace and connect with event organizers looking for your services.
        </p>
      </div>

      {/* Progress Steps */}
      <div className="mb-8">
        <nav aria-label="Progress">
          <ol className="flex items-center">
            {steps.map((step, stepIdx) => (
              <li key={step.id} className={`${stepIdx !== steps.length - 1 ? 'pr-8 sm:pr-20' : ''} relative`}>
                <div className="flex items-center">
                  <div
                    className={`relative flex h-8 w-8 items-center justify-center rounded-full ${
                      step.id < currentStep
                        ? 'bg-blue-600'
                        : step.id === currentStep
                        ? 'border-2 border-blue-600 bg-white'
                        : 'border-2 border-gray-300 bg-white'
                    }`}
                  >
                    {step.id < currentStep ? (
                      <svg className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span
                        className={`text-sm font-medium ${
                          step.id === currentStep ? 'text-blue-600' : 'text-gray-500'
                        }`}
                      >
                        {step.id}
                      </span>
                    )}
                  </div>
                  <span className="ml-4 text-sm font-medium text-gray-900">{step.name}</span>
                </div>
                {stepIdx !== steps.length - 1 && (
                  <div
                    className={`absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 ${
                      step.id < currentStep ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                  />
                )}
              </li>
            ))}
          </ol>
        </nav>
      </div>

      {/* Form Content */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {steps[currentStep - 1].name}
          </h2>
          <p className="text-sm text-gray-600">
            {steps[currentStep - 1].description}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
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

        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            type="button"
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`px-4 py-2 text-sm font-medium rounded-md ${
              currentStep === 1
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-700 bg-white border border-gray-300 hover:bg-gray-50'
            }`}
          >
            Previous
          </button>

          {currentStep < steps.length ? (
            <button
              type="button"
              onClick={nextStep}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Creating Profile...' : 'Complete Registration'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorRegistration;