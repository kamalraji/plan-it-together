import React, { useState, useEffect } from 'react';
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
  ImageIcon,
  Clock,
  XCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

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
  rejection_reason: string | null;
  created_at: string;
}

interface VendorService {
  id: string;
  vendor_id: string;
  name: string;
  description: string | null;
  category: string;
  subcategory: string | null;
  pricing_type: string;
  base_price: number | null;
  price_unit: string | null;
  availability: Record<string, boolean>;
  media_urls: string[];
  tags: string[];
  inclusions: string[];
  service_areas: string[];
  status: string;
  created_at: string;
}

const getStatusBadge = (status: VendorStatus) => {
  switch (status) {
    case 'PENDING':
      return (
        <Badge variant="secondary" className="gap-1.5 bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
          <Clock className="w-3 h-3" />
          Pending Review
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

export const VendorRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'register' | 'dashboard'>('register');
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Registration form state
  const [businessInfo, setBusinessInfo] = useState({
    businessName: '',
    businessType: 'SERVICE_PROVIDER',
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
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceForm, setServiceForm] = useState({
    name: '',
    description: '',
    category: '',
    pricingType: 'FIXED',
    basePrice: 0,
    priceUnit: 'USD',
    inclusions: [''],
    serviceAreas: [''],
    availability: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: true }), {} as Record<string, boolean>),
    tags: [] as string[],
  });

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Fetch vendor profile
  const { data: vendor, isLoading: vendorLoading } = useQuery({
    queryKey: ['vendor', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return null;
      const { data, error } = await supabase
        .from('vendors')
        .select('*')
        .eq('user_id', currentUserId)
        .maybeSingle();
      if (error) throw error;
      return data as Vendor | null;
    },
    enabled: !!currentUserId,
  });

  // Fetch vendor services
  const { data: services = [], isLoading: servicesLoading } = useQuery({
    queryKey: ['vendor-services', vendor?.id],
    queryFn: async () => {
      if (!vendor?.id) return [];
      const { data, error } = await supabase
        .from('vendor_services')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as VendorService[];
    },
    enabled: !!vendor?.id,
  });

  // Upload file to storage bucket
  const uploadFile = async (file: File, bucket: string, path: string, isPublic: boolean = true): Promise<string | null> => {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: true });
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    // For private buckets, return the storage path instead of public URL
    if (!isPublic) {
      return data.path;
    }
    
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  };

  // Create vendor mutation
  const createVendorMutation = useMutation({
    mutationFn: async () => {
      if (!currentUserId) throw new Error('Must be logged in');
      
      // Upload documents to vendor-documents bucket
      const uploadedDocuments: { type: string; url: string; name: string }[] = [];
      
      if (documents.businessLicense) {
        const docPath = `${currentUserId}/business-license-${Date.now()}.${documents.businessLicense.name.split('.').pop()}`;
        const path = await uploadFile(documents.businessLicense, 'vendor-documents', docPath, false);
        if (path) {
          uploadedDocuments.push({ type: 'business_license', url: path, name: documents.businessLicense.name });
        }
      }
      
      if (documents.insurance) {
        const docPath = `${currentUserId}/insurance-${Date.now()}.${documents.insurance.name.split('.').pop()}`;
        const path = await uploadFile(documents.insurance, 'vendor-documents', docPath, false);
        if (path) {
          uploadedDocuments.push({ type: 'insurance', url: path, name: documents.insurance.name });
        }
      }
      
      // Upload portfolio files to vendor-portfolios bucket
      const uploadedPortfolio: string[] = [];
      
      for (const file of portfolioFiles) {
        const portfolioPath = `${currentUserId}/portfolio-${Date.now()}-${file.name}`;
        const url = await uploadFile(file, 'vendor-portfolios', portfolioPath);
        if (url) {
          uploadedPortfolio.push(url);
        }
      }
      
      const { data, error } = await supabase
        .from('vendors')
        .insert({
          user_id: currentUserId,
          business_name: businessInfo.businessName,
          business_type: businessInfo.businessType,
          description: businessInfo.description,
          contact_email: businessInfo.email,
          contact_phone: businessInfo.phone,
          website: businessInfo.website,
          address: businessInfo.street,
          city: businessInfo.city,
          state: businessInfo.state,
          country: businessInfo.country,
          categories: selectedCategories,
          documents: uploadedDocuments,
          portfolio_urls: uploadedPortfolio,
          verification_status: 'PENDING',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor', currentUserId] });
      toast.success('Vendor registration submitted! Your application is pending review.');
      setActiveTab('dashboard');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to submit registration');
    },
  });

  // Create service mutation
  const createServiceMutation = useMutation({
    mutationFn: async () => {
      if (!vendor?.id) throw new Error('No vendor profile');
      
      const { data, error } = await supabase
        .from('vendor_services')
        .insert({
          vendor_id: vendor.id,
          name: serviceForm.name,
          description: serviceForm.description,
          category: serviceForm.category,
          pricing_type: serviceForm.pricingType,
          base_price: serviceForm.basePrice,
          price_unit: serviceForm.priceUnit,
          availability: serviceForm.availability,
          inclusions: serviceForm.inclusions.filter(Boolean),
          service_areas: serviceForm.serviceAreas.filter(Boolean),
          tags: serviceForm.tags,
          status: 'ACTIVE',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services', vendor?.id] });
      toast.success('Service added successfully!');
      resetServiceForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to add service');
    },
  });

  // Update service mutation
  const updateServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { data, error } = await supabase
        .from('vendor_services')
        .update({
          name: serviceForm.name,
          description: serviceForm.description,
          category: serviceForm.category,
          pricing_type: serviceForm.pricingType,
          base_price: serviceForm.basePrice,
          price_unit: serviceForm.priceUnit,
          availability: serviceForm.availability,
          inclusions: serviceForm.inclusions.filter(Boolean),
          service_areas: serviceForm.serviceAreas.filter(Boolean),
          tags: serviceForm.tags,
        })
        .eq('id', serviceId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services', vendor?.id] });
      toast.success('Service updated successfully!');
      resetServiceForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update service');
    },
  });

  // Delete service mutation
  const deleteServiceMutation = useMutation({
    mutationFn: async (serviceId: string) => {
      const { error } = await supabase
        .from('vendor_services')
        .delete()
        .eq('id', serviceId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-services', vendor?.id] });
      toast.success('Service deleted');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to delete service');
    },
  });

  // Switch to dashboard if vendor exists
  useEffect(() => {
    if (vendor) {
      setActiveTab('dashboard');
    }
  }, [vendor]);

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

  const handleDocumentUpload = (type: 'businessLicense' | 'insurance', e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.target.files?.[0] || null;
    setDocuments(prev => ({ ...prev, [type]: file }));
  };

  const handlePortfolioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const files = e.target.files;
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
    if (!currentUserId) {
      toast.error('Please log in to register as a vendor');
      return;
    }
    
    if (!validateStep(currentStep)) {
      toast.error('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await createVendorMutation.mutateAsync();
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

  const saveService = () => {
    if (!serviceForm.name || !serviceForm.category) {
      toast.error('Please fill in required fields');
      return;
    }

    if (editingServiceId) {
      updateServiceMutation.mutate(editingServiceId);
    } else {
      createServiceMutation.mutate();
    }
  };

  const editService = (service: VendorService) => {
    setEditingServiceId(service.id);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      category: service.category,
      pricingType: service.pricing_type,
      basePrice: service.base_price || 0,
      priceUnit: service.price_unit || 'USD',
      inclusions: service.inclusions?.length ? service.inclusions : [''],
      serviceAreas: service.service_areas?.length ? service.service_areas : [''],
      availability: service.availability || DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: true }), {}),
      tags: service.tags || [],
    });
    setShowServiceForm(true);
  };

  const deleteService = (id: string) => {
    deleteServiceMutation.mutate(id);
  };

  const resetServiceForm = () => {
    setServiceForm({
      name: '',
      description: '',
      category: '',
      pricingType: 'FIXED',
      basePrice: 0,
      priceUnit: 'USD',
      inclusions: [''],
      serviceAreas: [''],
      availability: DAYS_OF_WEEK.reduce((acc, day) => ({ ...acc, [day]: true }), {}),
      tags: [],
    });
    setEditingServiceId(null);
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
              onChange={e => handleDocumentUpload('businessLicense', e)}
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
              onChange={e => handleDocumentUpload('insurance', e)}
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
          onChange={e => handlePortfolioUpload(e)}
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
        <CardTitle>{editingServiceId ? 'Edit Service' : 'Add New Service'}</CardTitle>
        <CardDescription>
          Fill in the details of your service offering
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="serviceName">Service Title *</Label>
            <Input
              id="serviceName"
              value={serviceForm.name}
              onChange={e => handleServiceFormChange('name', e.target.value)}
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
                    value={serviceForm.priceUnit}
                    onValueChange={value => handleServiceFormChange('priceUnit', value)}
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

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={resetServiceForm}>
            Cancel
          </Button>
          <Button 
            onClick={saveService}
            disabled={createServiceMutation.isPending || updateServiceMutation.isPending}
          >
            {(createServiceMutation.isPending || updateServiceMutation.isPending) && (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {editingServiceId ? 'Update Service' : 'Add Service'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderVendorStatusCard = () => {
    if (!vendor) return null;

    return (
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">{vendor.business_name}</h3>
                <p className="text-sm text-muted-foreground">{vendor.contact_email}</p>
              </div>
            </div>
            {getStatusBadge(vendor.verification_status)}
          </div>
          
          {vendor.verification_status === 'PENDING' && (
            <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-lg border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-amber-800 dark:text-amber-200">Application Under Review</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                    Your vendor application is being reviewed by our team. This usually takes 1-2 business days.
                    You can still add services while waiting for approval.
                  </p>
                </div>
              </div>
            </div>
          )}

          {vendor.verification_status === 'REJECTED' && vendor.rejection_reason && (
            <div className="mt-4 p-4 bg-red-50 dark:bg-red-950/30 rounded-lg border border-red-200 dark:border-red-800">
              <div className="flex items-start gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800 dark:text-red-200">Application Rejected</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    Reason: {vendor.rejection_reason}
                  </p>
                </div>
              </div>
            </div>
          )}

          {vendor.verification_status === 'VERIFIED' && (
            <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-lg border border-emerald-200 dark:border-emerald-800">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">Verified Vendor</p>
                  <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                    Your business is verified! Your services are now visible to event organizers.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderDashboard = () => (
    <div className="space-y-6">
      {renderVendorStatusCard()}

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Your Services</h2>
          <p className="text-muted-foreground">Manage your service listings</p>
        </div>
        {!showServiceForm && vendor && (
          <Button onClick={() => setShowServiceForm(true)}>
            <Plus className="w-4 h-4 mr-2" /> Add Service
          </Button>
        )}
      </div>

      {!vendor ? (
        <Card className="p-12 text-center">
          <AlertCircle className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">Complete Registration First</h3>
          <p className="text-muted-foreground mb-4">
            Please complete your vendor registration before adding services.
          </p>
          <Button onClick={() => setActiveTab('register')}>
            Go to Registration
          </Button>
        </Card>
      ) : showServiceForm ? (
        renderServiceListingForm()
      ) : servicesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
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
                        {service.pricing_type === 'CUSTOM_QUOTE'
                          ? 'Custom Quote'
                          : `${service.price_unit || 'USD'} ${service.base_price}`}
                      </Badge>
                      {service.status === 'ACTIVE' ? (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Inactive</Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-foreground">{service.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {service.description}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {service.service_areas?.filter(Boolean).map((area, i) => (
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
                      disabled={deleteServiceMutation.isPending}
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

  if (vendorLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
            <TabsTrigger value="register" className="gap-2" disabled={!!vendor}>
              <Building2 className="w-4 h-4" /> {vendor ? 'Registered' : 'Register as Vendor'}
            </TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-2">
              <Star className="w-4 h-4" /> Manage Services
            </TabsTrigger>
          </TabsList>

          <TabsContent value="register">
            {vendor ? (
              <Card className="p-12 text-center">
                <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-500 mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">Already Registered!</h3>
                <p className="text-muted-foreground mb-4">
                  You have already completed vendor registration. Go to the dashboard to manage your services.
                </p>
                <Button onClick={() => setActiveTab('dashboard')}>
                  Go to Dashboard
                </Button>
              </Card>
            ) : (
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
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {isSubmitting ? 'Submitting...' : 'Complete Registration'}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
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
