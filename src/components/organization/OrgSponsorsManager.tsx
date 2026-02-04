import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { useCurrentOrganization } from './OrganizationContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useMyOrganizationMemberships } from '@/hooks/useOrganization';

type SponsorRow = Tables<'organization_sponsors'>;

export const OrgSponsorsManager: React.FC = () => {
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

  const [items, setItems] = useState<SponsorRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingOrder, setSavingOrder] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    logo_url: '',
    website_url: '',
    tier: '',
  });
  const [dragId, setDragId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('organization_sponsors')
      .select('*')
      .eq('organization_id', organization.id)
      .order('position', { ascending: true, nullsFirst: true })
      .order('created_at', { ascending: true });

    if (error) {
      toast({
        title: 'Error loading sponsors',
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
    setForm({ name: '', logo_url: '', website_url: '', tier: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      toast({
        title: 'Read-only access',
        description: 'Only organization owners and admins can edit sponsors.',
        variant: 'destructive',
      });
      return;
    }

    if (!form.name.trim()) {
      toast({
        title: 'Missing name',
        description: 'Sponsor name is required.',
        variant: 'destructive',
      });
      return;
    }

    const payload = {
      organization_id: organization.id,
      name: form.name.trim(),
      logo_url: form.logo_url.trim() || null,
      website_url: form.website_url.trim() || null,
      tier: form.tier.trim() || null,
    } as const;

    if (editingId) {
      const { error } = await supabase
        .from('organization_sponsors')
        .update(payload)
        .eq('id', editingId);

      if (error) {
        toast({
          title: 'Error updating sponsor',
          description: 'Please try again.',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Sponsor updated' });
    } else {
      const maxPosition = items.reduce(
        (max, s) => ((s.position ?? 0) > max ? (s.position ?? 0) : max),
        0,
      );
      const { error } = await supabase
        .from('organization_sponsors')
        .insert({ ...payload, position: maxPosition + 1 });

      if (error) {
        toast({
          title: 'Error creating sponsor',
          description: 'Please try again.',
          variant: 'destructive',
        });
        return;
      }
      toast({ title: 'Sponsor added' });
    }

    resetForm();
    void loadItems();
  };

  const handleEdit = (item: SponsorRow) => {
    setEditingId(item.id);
    setForm({
      name: item.name,
      logo_url: item.logo_url ?? '',
      website_url: item.website_url ?? '',
      tier: item.tier ?? '',
    });
  };

  const handleDelete = async (id: string) => {
    if (!canEdit) {
      toast({
        title: 'Read-only access',
        description: 'Only organization owners and admins can delete sponsors.',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('organization_sponsors')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error deleting sponsor',
        description: 'Please try again.',
        variant: 'destructive',
      });
      return;
    }

    toast({ title: 'Sponsor deleted' });
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
        description: 'Only organization owners and admins can reorder sponsors.',
        variant: 'destructive',
      });
      return;
    }

    setSavingOrder(true);
    const updates = items.map((item, index) =>
      supabase
        .from('organization_sponsors')
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
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Sponsor name</label>
          <Input
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Acme Corp"
            disabled={!canEdit}
          />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Logo URL (optional)</label>
            <Input
              value={form.logo_url}
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              placeholder="https://.../logo.png"
              disabled={!canEdit}
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground">Website URL (optional)</label>
            <Input
              value={form.website_url}
              onChange={(e) => setForm((f) => ({ ...f, website_url: e.target.value }))}
              placeholder="https://acme.example"
              disabled={!canEdit}
            />
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">Tier (optional)</label>
          <Input
            value={form.tier}
            onChange={(e) => setForm((f) => ({ ...f, tier: e.target.value }))}
            placeholder="Gold / Silver / Community partner"
            disabled={!canEdit}
          />
        </div>
        <div className="flex items-center justify-end gap-2">
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
            {editingId ? 'Save changes' : 'Add sponsor'}
          </Button>
        </div>
      </form>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            {canEdit
              ? 'Drag sponsors to reorder how they appear. Changes are saved when you click'
              : 'Sponsors are managed by organization owners and admins.'}{' '}
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
          {loading && <p className="text-xs text-muted-foreground">Loading sponsors…</p>}
          {!loading && items.length === 0 && (
            <p className="text-xs text-muted-foreground/80">
              No sponsors yet. Add your first sponsor above.
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
                  className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-2 cursor-move hover:border-primary/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[10px] font-medium text-muted-foreground">
                      {item.logo_url ? (
                        <span className="truncate max-w-[2rem]">Logo</span>
                      ) : (
                        <span>#</span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-foreground truncate">{item.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {item.tier || 'Standard partner'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
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
