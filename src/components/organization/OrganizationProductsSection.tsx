import React, { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tables } from '@/integrations/supabase/types';

// Organization products table row
export type OrganizationProductRow = Tables<'organization_products'>;

interface OrganizationProductsSectionProps {
  products: OrganizationProductRow[];
  initialSearch?: string;
  initialCategory?: string;
  initialOnlyFree?: boolean;
  onFiltersChange?: (filters: {
    search: string;
    category: string;
    onlyFree: boolean;
  }) => void;
}

export const OrganizationProductsSection: React.FC<OrganizationProductsSectionProps> = ({
  products,
  initialSearch,
  initialCategory,
  initialOnlyFree,
  onFiltersChange,
}) => {
  const [search, setSearch] = useState(initialSearch ?? '');
  const [category, setCategory] = useState<string>(initialCategory ?? 'all');
  const [onlyFree, setOnlyFree] = useState(initialOnlyFree ?? false);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const p of products) {
      if (p.category) set.add(p.category);
    }
    return Array.from(set).sort();
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return products
      .filter((p) => (category === 'all' ? true : p.category === category))
      .filter((p) =>
        !onlyFree ? true : (p.price ?? '').toLowerCase().includes('free'),
      )
      .filter((p) => {
        if (!q) return true;
        const haystack = `${p.name} ${p.description ?? ''} ${(p.tags ?? []).join(
          ' ',
        )}`.toLowerCase();
        return haystack.includes(q);
      })
      .sort((a, b) => {
        if (a.position != null && b.position != null) {
          return a.position - b.position;
        }
        if (a.position != null) return -1;
        if (b.position != null) return 1;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
  }, [products, category, onlyFree, search]);

  if (!products.length) {
    return null;
  }

  return (
    <section aria-labelledby="org-products-heading" className="space-y-4">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-1">
            Products & resources
          </p>
          <h2
            id="org-products-heading"
            className="text-xl sm:text-2xl font-semibold tracking-tight"
          >
            What this organization offers
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
            Explore tools, programs, and resources from this organization that you
            can use as a participant.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Input
            type="search"
            placeholder="Search products by name, tag, or description"
            value={search}
            onChange={(e) => {
              const value = e.target.value;
              setSearch(value);
              onFiltersChange?.({
                search: value,
                category,
                onlyFree,
              });
            }}
            className="h-9 sm:h-10 w-full sm:w-64"
          />
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-xs sm:text-sm">
            <select
              value={category}
              onChange={(e) => {
                const value = e.target.value;
                setCategory(value);
                onFiltersChange?.({
                  search,
                  category: value,
                  onlyFree,
                });
              }}
              className="h-9 rounded-full border border-border bg-background px-3 text-xs sm:text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60"
            >
              <option value="all">All categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <label className="inline-flex items-center gap-1 cursor-pointer select-none">
              <input
                type="checkbox"
                className="h-3 w-3 rounded border-border text-primary focus-visible:ring-primary/60"
                checked={onlyFree}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setOnlyFree(checked);
                  onFiltersChange?.({
                    search,
                    category,
                    onlyFree: checked,
                  });
                }}
              />
              <span className="text-xs text-muted-foreground">Free only</span>
            </label>
          </div>
        </div>
      </header>

      <Card className="bg-card/80 backdrop-blur-sm border-border/70">
        <CardContent className="pt-4">
          {filtered.length === 0 ? (
            <p className="text-xs sm:text-sm text-muted-foreground">
              No products match your filters yet. Try clearing your search or
              selecting a different category.
            </p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <article
                  key={product.id}
                  className="group flex flex-col rounded-2xl border border-border/70 bg-background/80 px-4 py-3 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm sm:text-base font-semibold text-foreground line-clamp-2">
                        {product.name}
                      </h3>
                      {product.category && (
                        <p className="mt-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                          {product.category}
                        </p>
                      )}
                    </div>
                    {product.price && (
                      <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {product.price}
                      </span>
                    )}
                  </div>

                  {product.description && (
                    <p className="mb-2 line-clamp-3 text-xs sm:text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  )}

                  {product.tags && product.tags.length > 0 && (
                    <div className="mb-2 flex flex-wrap gap-1">
                      {product.tags.map((tag) => (
                        <Badge
                          key={tag}
                          variant="outline"
                          className="border-border/60 bg-background/80 text-[10px] uppercase tracking-wide text-muted-foreground"
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}

                  {product.link_url && (
                    <a
                      href={product.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center text-xs sm:text-sm font-medium text-primary hover:underline"
                    >
                      Use this resource
                      <span aria-hidden="true" className="ml-1">
                        ↗
                      </span>
                    </a>
                  )}
                </article>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
};
