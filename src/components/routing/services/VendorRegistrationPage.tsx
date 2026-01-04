import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, 
  Camera, 
  DollarSign, 
  Calendar, 
  Upload, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Star,
  Users,
  TrendingUp,
  Shield,
  Plus,
  X,
  ImageIcon
} from 'lucide-react';
import { toast } from 'sonner';

// Service categories
const SERVICE_CATEGORIES = [
  { value: 'VENUE', label: 'Venue & Location', icon: Building2 },
  { value: 'CATERING', label: 'Catering', icon: Building2 },
  { value: 'PHOTOGRAPHY', label: 'Photography', icon: Camera },
  { value: 'VIDEOGRAPHY', label: 'Videography', icon: Camera },
  { value: 'ENTERTAINMENT', label: 'Entertainment', icon: Star },
  { value: 'DECORATION', label: 'Decoration', icon: Star },
  { value: 'AUDIO_VISUAL', label: 'Audio/Visual', icon: Building2 },
  { value: 'TRANSPORTATION', label: 'Transportation', icon: Building2 },
  { value: 'SECURITY', label: 'Security', icon: Shield },
  { value: 'CLEANING', label: 'Cleaning', icon: Building2 },
  { value: 'EQUIPMENT_RENTAL', label: 'Equipment Rental', icon: Building2 },
  { value: 'PRINTING', label: 'Printing', icon: Building2 },
  { value: 'MARKETING', label: 'Marketing', icon: TrendingUp },
  { value: 'OTHER', label: 'Other', icon: Building2 },
];

const PRICING_TYPES = [
  { value: 'FIXED', label: 'Fixed Price', description: 'One-time fixed cost' },
  { value: 'HOURLY', label: 'Hourly Rate', description: 'Price per hour' },
  { value: 'PER_PERSON', label: 'Per Person', description: 'Price per attendee' },
  { value: 'CUSTOM_QUOTE', label: 'Custom Quote', description: 'Contact for pricing' },
];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

interface ServiceListing {
  id: string;
  title: string;
  description: string;
  category: string;
  pricingType: string;
  basePrice: number;
  currency: string;
  inclusions: string[];
  serviceAreas: string[];
  availability: Record<string, boolean>;
  media: { id: string; name: string; preview?: string }[];
}

export const VendorRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'register' | 'dashboard'>('register');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Registration form state
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [documents, setDocuments] = useState({
    businessLicense: null as File | null,
    insurance: null as File | null,
  });
  const [portfolioFiles, setPortfolioFiles] = useState<File[]>([]);

  // Service listing form state
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingService, setEditingService] = useState<ServiceListing | null>(null);
  const [serviceForm, setServiceForm] = useState<Omit<ServiceListing, 'id'>>({
    title: '',
    description: '',
    category: '',
    pricingType: 'FIXED',
    basePrice: 0,
    currency: 'USD',
    inclusions: [''],
    serviceAreas: [''],
    availability: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: true }), {}),
    media: [],
  });

  const totalSteps = 5;
  const progress = (currentStep / totalSteps) * 100;

  const handleBusinessInfoChange = (field: string, value: string) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }));
  };

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleDocumentUpload = (type: 'businessLicense' | 'insurance', file: File | null) => {
    setDocuments(prev => ({ ...prev, [type]: file }));
  };

  const handlePortfolioUpload = (files: FileList | null) => {
    if (files) {
      setPortfolioFiles(prev => [...prev, ...Array.from(files)]);
    }
  };

  const removePortfolioFile = (index: number) => {
    setPortfolioFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        return !!(businessInfo.businessName && businessInfo.description);
      case 2:
        return !!(businessInfo.email && businessInfo.phone && businessInfo.city && businessInfo.country);
      case 3:
        return selectedCategories.length > 0;
      case 4:
        return !!documents.businessLicense;
      case 5:
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    } else {
      toast.error('Please fill in all required fields');
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleRegistrationSubmit = async () => {
    if (!validateStep(currentStep)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Vendor registration submitted successfully!');
      setActiveTab('dashboard');
    } catch (error) {
      toast.error('Failed to submit registration');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Service listing handlers
  const handleServiceFormChange = (field: string, value: any) => {
    setServiceForm(prev => ({ ...prev, [field]: value }));
  };

  const handleInclusionChange = (index: number, value: string) => {
    setServiceForm(prev => ({
      ...prev,
      inclusions: prev.inclusions.map((item, i) => (i === index ? value : item)),
    }));
  };

  const addInclusion = () => {
    setServiceForm(prev => ({ ...prev, inclusions: [...prev.inclusions, ''] }));
  };

  const removeInclusion = (index: number) => {
    setServiceForm(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index),
    }));
  };

  const handleServiceAreaChange = (index: number, value: string) => {
    setServiceForm(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.map((item, i) => (i === index ? value : item)),
    }));
  };

  const addServiceArea = () => {
    setServiceForm(prev => ({ ...prev, serviceAreas: [...prev.serviceAreas, ''] }));
  };

  const removeServiceArea = (index: number) => {
    setServiceForm(prev => ({
      ...prev,
      serviceAreas: prev.serviceAreas.filter((_, i) => i !== index),
    }));
  };

  const toggleDayAvailability = (day: string) => {
    setServiceForm(prev => ({
      ...prev,
      availability: { ...prev.availability, [day]: !prev.availability[day] },
    }));
  };

  const handleServiceMediaUpload = (files: FileList | null) => {
    if (files) {
      const newMedia = Array.from(files).map((file, index) => ({
        id: `media-${Date.now()}-${index}`,
        name: file.name,
        preview: URL.createObjectURL(file),
      }));
      setServiceForm(prev => ({ ...prev, media: [...prev.media, ...newMedia] }));
    }
  };

  const removeServiceMedia = (id: string) => {
    setServiceForm(prev => ({
      ...prev,
      media: prev.media.filter(m => m.id !== id),
    }));
  };

  const saveService = () => {
    if (!serviceForm.title || !serviceForm.category) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingService) {
      setServices(prev =>
        prev.map(s => (s.id === editingService.id ? { ...serviceForm, id: s.id } : s))
      );
      toast.success('Service updated successfully');
    } else {
      const newService: ServiceListing = {
        ...serviceForm,
        id: `service-${Date.now()}`,
      };
      setServices(prev => [...prev, newService]);
      toast.success('Service added successfully');
    }

    resetServiceForm();
  };

  const editService = (service: ServiceListing) => {
    setEditingService(service);
    setServiceForm(service);
    setShowServiceForm(true);
  };

  const deleteService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
    toast.success('Service deleted');
  };

  const resetServiceForm = () => {
    setServiceForm({
      title: '',
      description: '',
      category: '',
      pricingType: 'FIXED',
      basePrice: 0,
      currency: 'USD',
      inclusions: [''],
      serviceAreas: [''],
      availability: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: true }), {}),
      media: [],
    });
    setEditingService(null);
    setShowServiceForm(false);
  };

  const renderStepIndicator = () => (
    <div className="mb-8">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <span className="text-sm font-medium text-primary">{Math.round(progress)}% Complete</span>
      </div>
      <Progress value={progress} className="h-2" />
      <div className="flex justify-between mt-4">
        {['Business Info', 'Contact', 'Categories', 'Documents', 'Portfolio'].map((step, index) => (
          <div
            key={step}
            className={`flex flex-col items-center ${index + 1 <= currentStep ? 'text-primary' : 'text-muted-foreground'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                index + 1 < currentStep
                  ? 'bg-primary text-primary-foreground'
                  : index + 1 === currentStep
                  ? 'bg-primary/20 text-primary border-2 border-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {index + 1 < currentStep ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
            </div>
            <span className="text-xs hidden md:block">{step}</span>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <Label htmlFor="businessName">Business Name *</Label>
        <Input
          id="businessName"
          value={businessInfo.businessName}
          onChange={e => handleBusinessInfoChange('businessName', e.target.value)}
          placeholder="Enter your business name"
          className="mt-1"
        />
      </div>
      <div>
        <Label htmlFor="description">Business Description *</Label>
        <Textarea
          id="description"
          value={businessInfo.description}
          onChange={e => handleBusinessInfoChange('description', e.target.value)}
          placeholder="Describe your business and the services you offer"
          rows={4}
          className="mt-1"
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            value={businessInfo.email}
            onChange={e => handleBusinessInfoChange('email', e.target.value)}
            placeholder="business@example.com"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={businessInfo.phone}
            onChange={e => handleBusinessInfoChange('phone', e.target.value)}
            placeholder="+1 234 567 8900"
            className="mt-1"
          />
        </div>
      </div>
      <div>
        <Label htmlFor="website">Website</Label>
        <Input
          id="website"
          type="url"
          value={businessInfo.website}
          onChange={e => handleBusinessInfoChange('website', e.target.value)}
          placeholder="https://your-website.com"
          className="mt-1"
        />
      </div>
      <div className="border-t pt-6">
        <h3 className="text-lg font-medium text-foreground mb-4">Business Address</h3>
        <div className="space-y-4">
          <div>
            <Label htmlFor="street">Street Address</Label>
            <Input
              id="street"
              value={businessInfo.street}
              onChange={e => handleBusinessInfoChange('street', e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={businessInfo.city}
                onChange={e => handleBusinessInfoChange('city', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                value={businessInfo.state}
                onChange={e => handleBusinessInfoChange('state', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="postalCode">Postal Code</Label>
              <Input
                id="postalCode"
                value={businessInfo.postalCode}
                onChange={e => handleBusinessInfoChange('postalCode', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="country">Country *</Label>
              <Input
                id="country"
                value={businessInfo.country}
                onChange={e => handleBusinessInfoChange('country', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Service Categories *</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Select all categories that apply to your business.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {SERVICE_CATEGORIES.map(category => {
            const isSelected = selectedCategories.includes(category.value);
            return (
              <div
                key={category.value}
                onClick={() => toggleCategory(category.value)}
                className={`relative rounded-lg border p-4 cursor-pointer transition-all hover:shadow-md ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Checkbox checked={isSelected} />
                  <div>
                    <span className="font-medium text-foreground">{category.label}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Verification Documents</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Upload documents to verify your business. This helps build trust with event organizers.
        </p>
      </div>
      <div className="space-y-4">
        <div>
          <Label>Business License *</Label>
          <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="businessLicense"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => handleDocumentUpload('businessLicense', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="businessLicense" className="cursor-pointer">
              {documents.businessLicense ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{documents.businessLicense.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
                </div>
              )}
            </label>
          </div>
        </div>
        <div>
          <Label>Insurance Certificate (Optional)</Label>
          <div className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="insurance"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={e => handleDocumentUpload('insurance', e.target.files?.[0] || null)}
              className="hidden"
            />
            <label htmlFor="insurance" className="cursor-pointer">
              {documents.insurance ? (
                <div className="flex items-center justify-center gap-2 text-primary">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{documents.insurance.name}</span>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="w-10 h-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag and drop
                  </p>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-foreground mb-2">Portfolio</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Showcase your best work. High-quality images help attract more bookings.
        </p>
      </div>
      <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
        <input
          type="file"
          id="portfolio"
          accept="image/*,video/*"
          multiple
          onChange={e => handlePortfolioUpload(e.target.files)}
          className="hidden"
        />
        <label htmlFor="portfolio" className="cursor-pointer">
          <div className="space-y-2">
            <ImageIcon className="w-10 h-10 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Click to upload images or videos
            </p>
            <p className="text-xs text-muted-foreground">
              You can upload multiple files at once
            </p>
          </div>
        </label>
      </div>
      {portfolioFiles.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          {portfolioFiles.map((file, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square bg-muted rounded-lg flex items-center justify-center overflow-hidden">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <Camera className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground truncate mt-1">{file.name}</p>
                  </div>
                )}
              </div>
              <button
                onClick={() => removePortfolioFile(index)}
                className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderServiceListingForm = () => (
    <Card>
      <CardHeader>
        <CardTitle>{editingService ? 'Edit Service' : 'Add New Service'}</CardTitle>
        <CardDescription>
          Fill in the details of your service offering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="serviceTitle">Service Title *</Label>
            <Input
              id="serviceTitle"
              value={serviceForm.title}
              onChange={e => handleServiceFormChange('title', e.target.value)}
              placeholder="e.g., Wedding Photography Package"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="serviceCategory">Category *</Label>
            <Select
              value={serviceForm.category}
              onValueChange={value => handleServiceFormChange('category', value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {SERVICE_CATEGORIES.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="serviceDescription">Description *</Label>
          <Textarea
            id="serviceDescription"
            value={serviceForm.description}
            onChange={e => handleServiceFormChange('description', e.target.value)}
            placeholder="Describe your service in detail"
            rows={4}
            className="mt-1"
          />
        </div>

        {/* Pricing */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4" /> Pricing
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Pricing Type</Label>
              <Select
                value={serviceForm.pricingType}
                onValueChange={value => handleServiceFormChange('pricingType', value)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRICING_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {serviceForm.pricingType !== 'CUSTOM_QUOTE' && (
              <>
                <div>
                  <Label>Base Price</Label>
                  <Input
                    type="number"
                    value={serviceForm.basePrice}
                    onChange={e => handleServiceFormChange('basePrice', parseFloat(e.target.value) || 0)}
                    className="mt-1"
                    min={0}
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select
                    value={serviceForm.currency}
                    onValueChange={value => handleServiceFormChange('currency', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                      <SelectItem value="INR">INR (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Inclusions */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-foreground mb-4">What's Included</h4>
          <div className="space-y-2">
            {serviceForm.inclusions.map((inclusion, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={inclusion}
                  onChange={e => handleInclusionChange(index, e.target.value)}
                  placeholder="e.g., 4 hours of coverage"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeInclusion(index)}
                  disabled={serviceForm.inclusions.length === 1}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addInclusion}>
              <Plus className="w-4 h-4 mr-2" /> Add Inclusion
            </Button>
          </div>
        </div>

        {/* Service Areas */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-foreground mb-4">Service Areas</h4>
          <div className="space-y-2">
            {serviceForm.serviceAreas.map((area, index) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={area}
                  onChange={e => handleServiceAreaChange(index, e.target.value)}
                  placeholder="e.g., New York City, Los Angeles"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeServiceArea(index)}
                  disabled={serviceForm.serviceAreas.length === 1}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addServiceArea}>
              <Plus className="w-4 h-4 mr-2" /> Add Service Area
            </Button>
          </div>
        </div>

        {/* Availability */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Availability
          </h4>
          <div className="flex flex-wrap gap-2">
            {DAYS_OF_WEEK.map(day => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDayAvailability(day)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  serviceForm.availability[day]
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {day.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Portfolio Media */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-foreground mb-4 flex items-center gap-2">
            <Camera className="w-4 h-4" /> Portfolio / Media
          </h4>
          <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
            <input
              type="file"
              id="serviceMedia"
              accept="image/*"
              multiple
              onChange={e => handleServiceMediaUpload(e.target.files)}
              className="hidden"
            />
            <label htmlFor="serviceMedia" className="cursor-pointer">
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">Upload images for this service</p>
            </label>
          </div>
          {serviceForm.media.length > 0 && (
            <div className="grid grid-cols-4 gap-2 mt-4">
              {serviceForm.media.map(media => (
                <div key={media.id} className="relative group">
                  <div className="aspect-square bg-muted rounded overflow-hidden">
                    {media.preview && (
                      <img src={media.preview} alt="" className="w-full h-full object-cover" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => removeServiceMedia(media.id)}
                    className="absolute -top-1 -right-1 p-0.5 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={resetServiceForm}>
            Cancel
          </Button>
          <Button onClick={saveService}>
            {editingService ? 'Update Service' : 'Add Service'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Services</h2>
          <p className="text-muted-foreground">Manage your service listings</p>
        </div>
        {!showServiceForm && (
          <Button onClick={() => setShowServiceForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        )}
      </div>

      {showServiceForm ? (
        renderServiceListingForm()
      ) : services.length === 0 ? (
        <Card className="p-12 text-center">
          <Building2 className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">No services yet</h3>
          <p className="text-muted-foreground mb-4">
            Start adding your services to attract event organizers
          </p>
          <Button onClick={() => setShowServiceForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Your First Service
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map(service => (
            <Card key={service.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="secondary">
                        {SERVICE_CATEGORIES.find(c => c.value === service.category)?.label || service.category}
                      </Badge>
                      <Badge variant="outline">
                        {service.pricingType === 'CUSTOM_QUOTE'
                          ? 'Custom Quote'
                          : `${service.currency} ${service.basePrice}`}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{service.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {service.serviceAreas.filter(Boolean).map((area, i) => (
                        <Badge key={i} variant="outline" className="text-xs">
                          {area}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm" onClick={() => editService(service)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                      onClick={() => deleteService(service.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Grow Your Business with Thittam Marketplace
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of vendors connecting with event organizers. List your services, manage bookings, and grow your business.
            </p>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-8">
            {[
              { icon: Users, title: 'Reach More Clients', desc: 'Connect with thousands of event organizers' },
              { icon: Shield, title: 'Verified Profile', desc: 'Build trust with verification badges' },
              { icon: TrendingUp, title: 'Grow Revenue', desc: 'Increase bookings and revenue' },
              { icon: Star, title: 'Build Reputation', desc: 'Collect reviews and ratings' },
            ].map((benefit, index) => (
              <div key={index} className="bg-card rounded-lg p-4 border text-center">
                <benefit.icon className="w-8 h-8 mx-auto text-primary mb-2" />
                <h3 className="font-semibold text-foreground text-sm">{benefit.title}</h3>
                <p className="text-xs text-muted-foreground mt-1">{benefit.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={val => setActiveTab(val as 'register' | 'dashboard')}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="register" className="gap-2">
              <Building2 className="w-4 h-4" /> Register as Vendor
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <Star className="w-4 h-4" /> Manage Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Registration</CardTitle>
                <CardDescription>
                  Complete your business profile to start listing services
                </CardDescription>
              </CardHeader>
              <CardContent>
                {renderStepIndicator()}

                {currentStep === 1 && renderStep1()}
                {currentStep === 2 && renderStep2()}
                {currentStep === 3 && renderStep3()}
                {currentStep === 4 && renderStep4()}
                {currentStep === 5 && renderStep5()}

                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={prevStep}
                    disabled={currentStep === 1}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Previous
                  </Button>
                  {currentStep < totalSteps ? (
                    <Button onClick={nextStep}>
                      Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  ) : (
                    <Button onClick={handleRegistrationSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">{renderDashboard()}</TabsContent>
        </Tabs>

        {/* Back to Marketplace */}
        <div className="mt-8 text-center">
          <Button variant="ghost" onClick={() => navigate('/marketplace')}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Marketplace
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VendorRegistrationPage;
