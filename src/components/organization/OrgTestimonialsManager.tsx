import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useCurrentOrganization } from './OrganizationContext';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { useMyOrganizationMemberships } from '@/hooks/useOrganization';

type TestimonialRow = Tables<'organization_testimonials'>;

export const OrgTestimonialsManager: React.FC = () => {
  const organization = useCurrentOrganization();
  const { toast } = useToast();
  const { data: memberships } = useMyOrganizationMemberships();

  const activeMembership = useMemo(() => {
    if (!memberships || !organization?.id) return undefined;
    return memberships.find(
      (m: any) => m.organization_id === organization.id && m.status === 'ACTIVE',
    );
  }, [memberships, organization?.id]);

  const canEdit = activeMembership?.role === 'OWNER' || activeMembership?.role === 'ADMIN';

  const [items, setItems] = useState<TestimonialRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    author_name: '',
    author_role: '',
    quote: '',
    highlight: false,
  });
  const [dragId, setDragId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organization_testimonials')
      .select('*')
      .eq('organization_id', organization.id)
      .order('position', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error loading testimonials',
        description: 'Please try again in a moment.',
        variant: 'destructive',
      });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  }, [organization.id, toast]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const resetForm = () => {
    setEditingId(null);
    setForm({ author_name: '', author_role: '', quote: '', highlight: false });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast({
        title: 'Read-only access',
        description: 'Only organization owners and admins can edit testimonials.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.author_name.trim() || !form.quote.trim()) {
      toast({
        title: 'Missing required fields',
        description: 'Author name and quote are required.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      organization_id: organization.id,
      author_name: form.author_name.trim(),
      author_role: form.author_role.trim() || null,
      quote: form.quote.trim(),
      highlight: form.highlight,
    } as const;

    if (editingId) {
      const { error } = await supabase
        .from('organization_testimonials')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast({
          title: 'Error updating testimonial',
          description: 'Please try again.',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Testimonial updated' });
    } else {
      const maxPosition = items.reduce(
        (max, t) => ((t.position ?? 0) > max ? (t.position ?? 0) : max),
        0,
      );
      const { error } = await supabase
        .from('organization_testimonials')
        .insert({ ...payload, position: maxPosition + 1 });

      if (error) {
        toast({
          title: 'Error creating testimonial',
          description: 'Please try again.',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Testimonial added' });
    }

    resetForm();
    void loadItems();
  };

  const handleEdit = (item: TestimonialRow) => {
    setEditingId(item.id);
    setForm({
      author_name: item.author_name,
      author_role: item.author_role ?? '',
      quote: item.quote,
      highlight: item.highlight,
    });
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) {
      toast({
        title: 'Read-only access',
        description: 'Only organization owners and admins can delete testimonials.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('organization_testimonials')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting testimonial',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Testimonial deleted' });
    if (editingId === id) {
      resetForm();
    }
    void loadItems();
  };

  const reorder = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return;
    const current = [...items];
    const fromIndex = current.findIndex((i) => i.id === draggedId);
    const toIndex = current.findIndex((i) => i.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    setItems(current);
  };

  const persistOrder = async () => {
    if (!canEdit) {
      toast({
        title: 'Read-only access',
        description: 'Only organization owners and admins can reorder testimonials.',
        variant: 'destructive',
      });
      return;
    }

    setSavingOrder(true);
    const updates = items.map((item, index) =>
      supabase
        .from('organization_testimonials')
        .update({ position: index + 1 })
        .eq('id', item.id),
    );

    const results = await Promise.all(updates);
    const hasError = results.some((r) => r.error);
    if (hasError) {
      toast({
        title: 'Error saving order',
        description: 'Some items may not be in the correct order.',
        variant: 'destructive',
      });
    } else {
      toast({ title: 'Order updated' });
    }
    setSavingOrder(false);
  };

  return (
    <div className="space-y-4">
      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-xl border border-border/60 bg-background/80 p-3 sm:p-4"
      >
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Author name</label>
            <Input
              value={form.author_name}
              onChange={(e) => setForm((f) => ({ ...f, author_name: e.target.value }))}
              placeholder="Jane Doe"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">
              Author role (optional)
            </label>
            <Input
              value={form.author_role}
              onChange={(e) => setForm((f) => ({ ...f, author_role: e.target.value }))}
              placeholder="Founder, Example Org"
              disabled={!canEdit}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Quote</label>
          <Textarea
            value={form.quote}
            onChange={(e) => setForm((f) => ({ ...f, quote: e.target.value }))}
            rows={3}
            placeholder="This event series completely changed how we connect with our community."
            disabled={!canEdit}
          />
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="highlight"
              checked={form.highlight}
              onCheckedChange={(checked) => setForm((f) => ({ ...f, highlight: checked }))}
              disabled={!canEdit}
            />
            <label htmlFor="highlight" className="text-xs sm:text-sm text-muted-foreground">
              Highlight this testimonial on the public page
            </label>
          </div>
          <div className="flex gap-2">
            {editingId && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={resetForm}
                disabled={!canEdit}
              >
                Cancel
              </Button>
            )}
            <Button type="submit" size="sm" disabled={!canEdit}>
              {editingId ? 'Save changes' : 'Add testimonial'}
            </Button>
          </div>
        </div>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {canEdit
              ? 'Drag testimonials to reorder how they appear. Changes are saved when you click'
              : 'Testimonials are managed by organization owners and admins.'}{' '}
            {canEdit && <span className="font-semibold">Save order</span>}.
          </p>
          {canEdit && (
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={savingOrder || loading || items.length === 0}
              onClick={persistOrder}
            >
              {savingOrder ? 'Saving…' : 'Save order'}
            </Button>
          )}
        </div>

        <div className="space-y-2">
          {loading && <p className="text-xs text-muted-foreground">Loading testimonials…</p>}
          {!loading && items.length === 0 && (
            <p className="text-xs text-muted-foreground/80">
              No testimonials yet. Add your first quote above.
            </p>
          )}
          {!loading && items.length > 0 && (
            <ul className="space-y-2">
              {items.map((item) => (
                <li
                  key={item.id}
                  draggable
                  onDragStart={() => setDragId(item.id)}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragId) reorder(dragId, item.id);
                  }}
                  onDragEnd={() => setDragId(null)}
                  className="group flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2 cursor-move hover:border-primary/60 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground/70 mb-0.5">“{item.quote}”</p>
                    <p className="text-[11px] text-muted-foreground/90">
                      — {item.author_name}
                      {item.author_role ? `, ${item.author_role}` : ''}
                      {item.highlight && <span className="ml-1 inline-flex items-center rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">Highlight</span>}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleEdit(item)}
                    >
                      ✏️
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-destructive hover:text-destructive"
                      onClick={() => handleDelete(item.id)}
                    >
                      🗑️
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};
