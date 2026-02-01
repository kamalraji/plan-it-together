import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormMessage, 
  FormDescription 
} from '@/components/ui/form';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  Plus, 
  Search, 
  Loader2, 
  Check, 
  Clock, 
  ArrowRight,
  Globe,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useDebounce } from '@/hooks/common/useDebounce';
import { 
  useSearchOrganizations, 
  useMyOrganizationMemberships 
} from '@/hooks/useOrganization';
import {
  createOrganizationSetupSchema,
  type OrganizationSetupData,
} from '../hooks/useOnboardingState';

// Slug generation utility
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 50);
}

// Re-export for convenience
export type { OrganizationSetupData };

// Local type for create form
type CreateOrganizationSetupData = z.infer<typeof createOrganizationSetupSchema>;

interface OrganizationSetupStepProps {
  data: OrganizationSetupData | null;
  onSubmit: (data: OrganizationSetupData) => void;
  onSkip: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

const CATEGORY_LABELS: Record<string, string> = {
  COLLEGE: 'College / University',
  COMPANY: 'Company / Startup',
  INDUSTRY: 'Industry Association',
  NON_PROFIT: 'Non-profit / NGO',
};

export function OrganizationSetupStep({ 
  data, 
  onSubmit, 
  onSkip, 
  onBack, 
  isSubmitting 
}: OrganizationSetupStepProps) {
  const [activeTab, setActiveTab] = useState<'create' | 'join'>(
    data?.action === 'join' ? 'join' : 'create'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<{ id: string; name: string } | null>(
    data?.action === 'join' ? { id: data.organizationId, name: data.organizationName } : null
  );
  const [slugTouched, setSlugTouched] = useState(false);
  const [announcement, setAnnouncement] = useState('');

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch user's existing memberships
  const { data: memberships = [], isLoading: membershipsLoading } = useMyOrganizationMemberships();

  // Search organizations
  const { data: searchResults, isLoading: searchLoading } = useSearchOrganizations({
    query: debouncedSearch,
    limit: 10,
  });

  // Create membership status lookup
  const membershipMap = useMemo(() => {
    const map = new Map<string, 'PENDING' | 'ACTIVE' | 'REJECTED'>();
    memberships.forEach((m: any) => {
      if (m.status === 'ACTIVE' || m.status === 'PENDING') {
        map.set(m.organization_id, m.status);
      }
    });
    return map;
  }, [memberships]);

  // Create form
  const createForm = useForm<CreateOrganizationSetupData>({
    resolver: zodResolver(createOrganizationSetupSchema),
    defaultValues: {
      action: 'create',
      name: data?.action === 'create' ? data.name : '',
      slug: data?.action === 'create' ? data.slug : '',
      category: data?.action === 'create' ? data.category : undefined,
      description: data?.action === 'create' ? data.description || '' : '',
      website: data?.action === 'create' ? data.website || '' : '',
      email: data?.action === 'create' ? data.email || '' : '',
    },
  });

  const watchedName = createForm.watch('name');

  // Auto-generate slug from name
  useEffect(() => {
    if (!slugTouched && watchedName) {
      const generatedSlug = generateSlug(watchedName);
      createForm.setValue('slug', generatedSlug, { shouldValidate: true });
    }
  }, [watchedName, slugTouched, createForm]);

  const handleCreateSubmit = useCallback((values: CreateOrganizationSetupData) => {
    setAnnouncement('Creating organization...');
    onSubmit(values);
  }, [onSubmit]);

  const handleJoinSubmit = useCallback(() => {
    if (!selectedOrg) return;
    setAnnouncement('Sending join request...');
    onSubmit({
      action: 'join',
      organizationId: selectedOrg.id,
      organizationName: selectedOrg.name,
    });
  }, [selectedOrg, onSubmit]);

  const handleSkip = useCallback(() => {
    setAnnouncement('Skipping organization setup...');
    onSkip();
  }, [onSkip]);

  const handleOrgSelect = useCallback((org: { id: string; name: string }) => {
    const status = membershipMap.get(org.id);
    if (status === 'ACTIVE' || status === 'PENDING') {
      return; // Can't select already joined orgs
    }
    setSelectedOrg(org);
    setAnnouncement(`Selected ${org.name}`);
  }, [membershipMap]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-2xl mx-auto px-4"
      role="region"
      aria-label="Organization setup"
    >
      {/* Screen reader announcements */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      {/* Header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 mb-4"
        >
          <Building2 className="w-8 h-8 text-primary" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl sm:text-3xl font-bold text-foreground mb-3"
        >
          Set Up Your Organization
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-muted-foreground max-w-md mx-auto"
        >
          Create a new organization or join an existing one to start hosting events
        </motion.p>
      </div>

      {/* Tabs */}
      <Tabs 
        value={activeTab} 
        onValueChange={(v) => setActiveTab(v as 'create' | 'join')}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-2 h-12">
          <TabsTrigger 
            value="create" 
            className="flex items-center gap-2 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4" />
            Create New
          </TabsTrigger>
          <TabsTrigger 
            value="join" 
            className="flex items-center gap-2 text-sm sm:text-base"
          >
            <Search className="w-4 h-4" />
            Join Existing
          </TabsTrigger>
        </TabsList>

        {/* Create Organization Tab */}
        <TabsContent value="create" className="space-y-6">
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreateSubmit)} className="space-y-5">
              {/* Name */}
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Name *</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="e.g., Tech University, Startup Inc." 
                        {...field} 
                        aria-required="true"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Slug */}
              <FormField
                control={createForm.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL Handle *</FormLabel>
                    <FormControl>
                      <div className="flex items-center">
                        <span className="text-sm text-muted-foreground bg-muted px-3 py-2 rounded-l-md border border-r-0">
                          thittam1hub.com/
                        </span>
                        <Input
                          {...field}
                          placeholder="your-org"
                          className="rounded-l-none"
                          onChange={(e) => {
                            setSlugTouched(true);
                            field.onChange(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                          }}
                          aria-required="true"
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      This will be your organization's unique URL
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Category */}
              <FormField
                control={createForm.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Organization Type *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger aria-required="true">
                          <SelectValue placeholder="Select organization type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="COLLEGE">
                          <span className="flex items-center gap-2">
                            🎓 College / University
                          </span>
                        </SelectItem>
                        <SelectItem value="COMPANY">
                          <span className="flex items-center gap-2">
                            🏢 Company / Startup
                          </span>
                        </SelectItem>
                        <SelectItem value="INDUSTRY">
                          <span className="flex items-center gap-2">
                            🏭 Industry Association
                          </span>
                        </SelectItem>
                        <SelectItem value="NON_PROFIT">
                          <span className="flex items-center gap-2">
                            💚 Non-profit / NGO
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={createForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell us about your organization..."
                        className="resize-none h-20"
                        maxLength={1000}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-right">
                      {field.value?.length || 0} / 1000
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optional: Website & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={createForm.control}
                  name="website"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5" />
                        Website
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="https://..." 
                          type="url"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={createForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Contact Email
                      </FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="contact@org.com" 
                          type="email"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={onBack}
                  className="flex-1 order-2 sm:order-1"
                  disabled={isSubmitting}
                >
                  Back
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1 order-1 sm:order-2"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Organization
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </TabsContent>

        {/* Join Organization Tab */}
        <TabsContent value="join" className="space-y-5">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search organizations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search for organizations to join"
            />
          </div>

          {/* Results */}
          <div className="space-y-2 min-h-[200px]">
            {searchLoading || membershipsLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : searchResults && searchResults.length > 0 ? (
              <AnimatePresence mode="popLayout">
                {searchResults.map((org: any) => {
                  const status = membershipMap.get(org.id);
                  const isSelected = selectedOrg?.id === org.id;
                  
                  return (
                    <motion.button
                      key={org.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      type="button"
                      onClick={() => handleOrgSelect({ id: org.id, name: org.name })}
                      disabled={status === 'ACTIVE' || status === 'PENDING'}
                      className={`
                        w-full text-left p-4 rounded-lg border transition-all
                        ${isSelected 
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                        }
                        ${(status === 'ACTIVE' || status === 'PENDING') 
                          ? 'opacity-60 cursor-not-allowed' 
                          : 'cursor-pointer'
                        }
                      `}
                      aria-pressed={isSelected}
                      aria-label={`${org.name}${status ? ` - ${status}` : ''}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h4 className="font-medium text-foreground truncate">
                              {org.name}
                            </h4>
                            {isSelected && !status && (
                              <Check className="w-4 h-4 text-primary flex-shrink-0" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {org.slug && `@${org.slug}`}
                            {org.category && ` • ${CATEGORY_LABELS[org.category] || org.category}`}
                          </p>
                        </div>
                        {status === 'ACTIVE' && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            <Check className="w-3 h-3 mr-1" />
                            Joined
                          </Badge>
                        )}
                        {status === 'PENDING' && (
                          <Badge variant="outline" className="flex-shrink-0">
                            <Clock className="w-3 h-3 mr-1" />
                            Pending
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            ) : debouncedSearch.length > 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No organizations found for "{debouncedSearch}"</p>
                <p className="text-sm mt-1">Try a different search or create a new organization</p>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Search for an organization to join</p>
                <p className="text-sm mt-1">Or switch to "Create New" to start your own</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="flex-1 order-2 sm:order-1"
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button 
              type="button"
              onClick={handleJoinSubmit}
              disabled={!selectedOrg || isSubmitting}
              className="flex-1 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Requesting...
                </>
              ) : (
                <>
                  Request to Join
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Skip Option */}
      <div className="mt-8 text-center">
        <Button 
          variant="ghost" 
          onClick={handleSkip}
          disabled={isSubmitting}
          className="text-muted-foreground hover:text-foreground"
        >
          I'll set this up later
        </Button>
      </div>
    </motion.div>
  );
}
