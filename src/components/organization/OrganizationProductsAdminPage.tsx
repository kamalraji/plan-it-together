import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useCurrentOrganization } from './OrganizationContext';

const productSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name must be at most 120 characters'),
  description: z
    .string()
    .trim()
    .max(800, 'Description must be at most 800 characters')
    .optional(),
  category: z
    .string()
    .trim()
    .max(80, 'Category must be at most 80 characters')
    .optional(),
  price: z
    .string()
    .trim()
    .max(60, 'Price label must be at most 60 characters')
    .optional(),
  link_url: z
    .string()
    .trim()
    .url('Please provide a valid URL starting with http or https')
    .max(512, 'URL must be at most 512 characters')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  tags: z
    .string()
    .trim()
    .max(256, 'Tags input is too long')
    .optional(),
  status: z.enum(['ACTIVE', 'HIDDEN', 'ARCHIVED']).default('ACTIVE'),
  position: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? Number(val) || null : null)),
  is_featured: z.boolean().default(false),
  featured_position: z
    .string()
    .trim()
    .optional()
    .transform((val) => (val ? Number(val) || null : null)),
});

export type OrganizationProductRow = Tables<'organization_products'>;

type ProductFormValues = z.infer<typeof productSchema>;

export const OrganizationProductsAdminPage: React.FC = () => {
  const organization = useCurrentOrganization();
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery<OrganizationProductRow[]>({
    queryKey: ['organization-products-admin', organization.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_products')
        .select('*')
        .eq('organization_id', organization.id)
        .order('is_featured', { ascending: false })
        .order('featured_position', { ascending: true, nullsFirst: false })
        .order('position', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data ?? [];
    },
  });

  const upsertMutation = useMutation({
    mutationFn: async (input: { id?: string; values: ProductFormValues }) => {
      const base = {
        organization_id: organization.id,
        name: input.values.name,
        description: input.values.description || null,
        category: input.values.category || null,
        price: input.values.price || null,
        link_url: input.values.link_url || null,
        tags:
          input.values.tags && input.values.tags.trim().length > 0
            ? input.values.tags
                .split(',')
                .map((t) => t.trim())
                .filter(Boolean)
            : [],
        status: input.values.status,
        position: input.values.position ?? null,
        is_featured: input.values.is_featured,
        featured_position: input.values.featured_position ?? null,
      };

      if (input.id) {
        const { error } = await supabase
          .from('organization_products')
          .update(base)
          .eq('id', input.id);
        if (error) throw error;
        return;
      }

      const { error } = await supabase
        .from('organization_products')
        .insert(base);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-products-admin', organization.id],
      });
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('organization_products')
        .update({ status: 'ARCHIVED' })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-products-admin', organization.id],
      });
    },
  });

  const makeFeaturedMutation = useMutation({
    mutationFn: async (args: { id: string; is_featured: boolean }) => {
      const { error } = await supabase
        .from('organization_products')
        .update({ is_featured: args.is_featured })
        .eq('id', args.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['organization-products-admin', organization.id],
      });
    },
  });

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      description: '',
      category: '',
      price: '',
      link_url: '',
      tags: '',
      status: 'ACTIVE',
      position: undefined,
      is_featured: false,
      featured_position: undefined,
    },
  });

  const [editingId, setEditingId] = React.useState<string | null>(null);

  const resetForm = () => {
    setEditingId(null);
    form.reset({
      name: '',
      description: '',
      category: '',
      price: '',
      link_url: '',
      tags: '',
      status: 'ACTIVE',
      position: null,
      is_featured: false,
      featured_position: null,
    });
  };

  const onSubmit = (values: ProductFormValues) => {
    upsertMutation.mutate({ id: editingId ?? undefined, values });
  };

  const startEdit = (product: OrganizationProductRow) => {
    setEditingId(product.id);
    form.reset({
      name: product.name,
      description: product.description ?? '',
      category: product.category ?? '',
      price: product.price ?? '',
      link_url: product.link_url ?? '',
      tags: (product.tags ?? []).join(', '),
      status: (product.status as any) ?? 'ACTIVE',
      position:
        typeof product.position === 'number' ? product.position : null,
      is_featured: product.is_featured ?? false,
      featured_position:
        typeof product.featured_position === 'number'
          ? product.featured_position
          : null,
    });
  };

  return (
    <main className="min-h-screen bg-transparent">
      <section className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        <header className="space-y-1">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Products & resources
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Manage organization products
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Create, update, and feature offerings that participants see on your
            public organization page. Metrics are aggregated automatically from
            participant views and clicks.
          </p>
        </header>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <Card className="bg-card/80 backdrop-blur-sm border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                {editingId ? 'Edit product' : 'Add new product'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-3 sm:space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-foreground">
                    Name
                  </label>
                  <Input
                    {...form.register('name')}
                    maxLength={120}
                    placeholder="e.g. Hackathon workspace template, mentorship cohort"
                  />
                  {form.formState.errors.name && (
                    <p className="text-xs text-destructive mt-0.5">
                      {form.formState.errors.name.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-foreground">
                    Description
                  </label>
                  <Textarea
                    {...form.register('description')}
                    maxLength={800}
                    rows={3}
                    placeholder="Short description of what this product or resource offers participants."
                  />
                  {form.formState.errors.description && (
                    <p className="text-xs text-destructive mt-0.5">
                      {form.formState.errors.description.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-foreground">
                      Category
                    </label>
                    <Input
                      {...form.register('category')}
                      maxLength={80}
                      placeholder="e.g. Program, Tool, Workshop"
                    />
                    {form.formState.errors.category && (
                      <p className="text-xs text-destructive mt-0.5">
                        {form.formState.errors.category.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-foreground">
                      Price label
                    </label>
                    <Input
                      {...form.register('price')}
                      maxLength={60}
                      placeholder="e.g. Free, $10/mo, Scholarship-based"
                    />
                    {form.formState.errors.price && (
                      <p className="text-xs text-destructive mt-0.5">
                        {form.formState.errors.price.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-foreground">
                      Status
                    </label>
                    <Select
                      value={form.watch('status')}
                      onValueChange={(value) =>
                        form.setValue('status', value as ProductFormValues['status'])
                      }
                    >
                      <SelectTrigger className="h-9 text-xs sm:text-sm">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ACTIVE">Active (visible)</SelectItem>
                        <SelectItem value="HIDDEN">Hidden</SelectItem>
                        <SelectItem value="ARCHIVED">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-foreground">
                    Link URL
                  </label>
                  <Input
                    {...form.register('link_url')}
                    inputMode="url"
                    maxLength={512}
                    placeholder="https://example.com/resource"
                  />
                  {form.formState.errors.link_url && (
                    <p className="text-xs text-destructive mt-0.5">
                      {form.formState.errors.link_url.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs sm:text-sm font-medium text-foreground">
                    Tags
                  </label>
                  <Input
                    {...form.register('tags')}
                    maxLength={256}
                    placeholder="Comma-separated tags, e.g. API, student-only, mentorship"
                  />
                  {form.formState.errors.tags && (
                    <p className="text-xs text-destructive mt-0.5">
                      {form.formState.errors.tags.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-foreground">
                      List position
                    </label>
                    <Input
                      {...form.register('position')}
                      inputMode="numeric"
                      placeholder="Optional ordering index"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4 sm:pt-6">
                    <Switch
                      checked={form.watch('is_featured')}
                      onCheckedChange={(checked) =>
                        form.setValue('is_featured', checked, {
                          shouldDirty: true,
                        })
                      }
                    />
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-foreground">
                        Feature this product
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        Featured products are highlighted on the public page.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs sm:text-sm font-medium text-foreground">
                      Featured position
                    </label>
                    <Input
                      {...form.register('featured_position')}
                      inputMode="numeric"
                      placeholder="Priority among featured items"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button
                    type="submit"
                    size="sm"
                    disabled={upsertMutation.isPending}
                  >
                    {editingId ? 'Save changes' : 'Add product'}
                  </Button>
                  {editingId && (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={resetForm}
                    >
                      Cancel editing
                    </Button>
                  )}
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm border-border/70">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg">
                Existing products & metrics
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading ? (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Loading products…
                </p>
              ) : products.length === 0 ? (
                <p className="text-xs sm:text-sm text-muted-foreground">
                  No products yet. Create your first product using the form on the
                  left.
                </p>
              ) : (
                <ul className="space-y-2 max-h-[480px] overflow-y-auto pr-1">
                  {products.map((product) => {
                    const impressions = Number(product.impression_count ?? 0);
                    const clicks = Number(product.click_count ?? 0);
                    const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;

                    return (
                      <li
                        key={product.id}
                        className="rounded-2xl border border-border/70 bg-background/80 px-3 py-2 text-xs sm:text-sm flex flex-col gap-1"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-semibold text-foreground line-clamp-2">
                              {product.name}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              {product.category || 'Uncategorized'} •{' '}
                              {product.status === 'ACTIVE'
                                ? 'Active'
                                : product.status === 'HIDDEN'
                                  ? 'Hidden'
                                  : 'Archived'}
                            </p>
                            {product.is_featured && (
                              <p className="text-[11px] text-primary mt-0.5">
                                ★ Featured
                              </p>
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1 shrink-0">
                            <p className="text-[11px] text-muted-foreground">
                              Impr: {impressions} • Clicks: {clicks}
                            </p>
                            <p className="text-[11px] text-muted-foreground">
                              CTR: {ctr.toFixed(1)}%
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1 pt-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() => startEdit(product)}
                          >
                            Edit
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px] text-destructive"
                            onClick={() => archiveMutation.mutate(product.id)}
                          >
                            Archive
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-6 px-2 text-[11px]"
                            onClick={() =>
                              makeFeaturedMutation.mutate({
                                id: product.id,
                                is_featured: !product.is_featured,
                              })
                            }
                          >
                            {product.is_featured ? 'Unfeature' : 'Make featured'}
                          </Button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  );
};
