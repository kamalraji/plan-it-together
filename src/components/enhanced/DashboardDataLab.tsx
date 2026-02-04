import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import { supabase } from '@/integrations/supabase/looseClient';
import { useAuth } from '@/hooks/useAuth';

const workspaceSchema = z.object({
  eventId: z.string().uuid('Select a valid event'),
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name must be at most 120 characters'),
});

const serviceSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(160, 'Name must be at most 160 characters'),
  category: z
    .string()
    .trim()
    .min(1, 'Category is required')
    .max(80, 'Category must be at most 80 characters'),
  basePrice: z
    .number({ invalid_type_error: 'Base price must be a number' })
    .nonnegative('Base price cannot be negative'),
});

const bookingSchema = z.object({
  serviceId: z.string().uuid('Select a valid service'),
  amount: z
    .number({ invalid_type_error: 'Amount must be a number' })
    .nonnegative('Amount cannot be negative'),
  status: z.enum(['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']),
});

export const DashboardDataLab: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  type OwnedOrganization = { id: string };

  const [workspaceForm, setWorkspaceForm] = useState({ eventId: '', name: '' });
  const [serviceForm, setServiceForm] = useState({ name: '', category: '', basePrice: '' });
  const [bookingForm, setBookingForm] = useState({ serviceId: '', amount: '', status: 'CONFIRMED' });
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const { data: events } = useQuery({
    queryKey: ['organizer-events'],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];

      // Fetch organizations owned by this user, then their events
      const { data: organizations, error: orgError } = await supabase
        .from('organizations')
        .select('id')
        .eq('owner_id', user.id);

      if (orgError) throw orgError;
      const orgIds = (organizations as OwnedOrganization[] | null ?? []).map((o) => o.id);
      if (orgIds.length === 0) return [];

      const { data, error } = await supabase
        .from('events')
        .select('id, name, status, organization_id')
        .in('organization_id', orgIds);

      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: workspaces } = useQuery({
    queryKey: ['workspaces'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, status, created_at, event_id')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: services } = useQuery({
    queryKey: ['services'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('services')
        .select('id, name, category, base_price, is_active, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: bookings } = useQuery({
    queryKey: ['bookings'],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('bookings')
        .select('id, service_id, amount, status, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const resetFeedback = () => {
    setFormError(null);
    setFormSuccess(null);
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    if (!user) {
      setFormError('You must be logged in to create workspaces.');
      return;
    }

    const parseResult = workspaceSchema.safeParse({
      eventId: workspaceForm.eventId,
      name: workspaceForm.name,
    });

    if (!parseResult.success) {
      setFormError(parseResult.error.issues[0]?.message ?? 'Invalid workspace data');
      return;
    }

    try {
      const { error } = await supabase.from('workspaces').insert({
        event_id: parseResult.data.eventId,
        name: parseResult.data.name,
        organizer_id: user.id,
      });
      if (error) throw error;
      setFormSuccess('Workspace created');
      setWorkspaceForm({ eventId: '', name: '' });
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to create workspace');
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    resetFeedback();
    try {
      const { error } = await supabase.from('workspaces').delete().eq('id', id);
      if (error) throw error;
      setFormSuccess('Workspace deleted');
      await queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to delete workspace');
    }
  };

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    if (!user) {
      setFormError('You must be logged in to create services.');
      return;
    }

    const basePrice = Number(serviceForm.basePrice);
    const parseResult = serviceSchema.safeParse({
      name: serviceForm.name,
      category: serviceForm.category,
      basePrice: Number.isNaN(basePrice) ? NaN : basePrice,
    });

    if (!parseResult.success) {
      setFormError(parseResult.error.issues[0]?.message ?? 'Invalid service data');
      return;
    }

    try {
      const { error } = await supabase.from('services').insert({
        organizer_id: user.id,
        name: parseResult.data.name,
        category: parseResult.data.category,
        base_price: parseResult.data.basePrice,
      });
      if (error) throw error;
      setFormSuccess('Service created');
      setServiceForm({ name: '', category: '', basePrice: '' });
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to create service');
    }
  };

  const handleDeleteService = async (id: string) => {
    resetFeedback();
    try {
      const { error } = await supabase.from('services').delete().eq('id', id);
      if (error) throw error;
      setFormSuccess('Service deleted');
      await queryClient.invalidateQueries({ queryKey: ['services'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to delete service');
    }
  };

  const handleCreateBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    resetFeedback();
    if (!user) {
      setFormError('You must be logged in to create bookings.');
      return;
    }

    const amount = Number(bookingForm.amount);
    const parseResult = bookingSchema.safeParse({
      serviceId: bookingForm.serviceId,
      amount: Number.isNaN(amount) ? NaN : amount,
      status: bookingForm.status as any,
    });

    if (!parseResult.success) {
      setFormError(parseResult.error.issues[0]?.message ?? 'Invalid booking data');
      return;
    }

    try {
      const { error } = await supabase.from('bookings').insert({
        service_id: parseResult.data.serviceId,
        organizer_id: user.id,
        amount: parseResult.data.amount,
        status: parseResult.data.status,
      });
      if (error) throw error;
      setFormSuccess('Booking created');
      setBookingForm({ serviceId: '', amount: '', status: 'CONFIRMED' });
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to create booking');
    }
  };

  const handleDeleteBooking = async (id: string) => {
    resetFeedback();
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      setFormSuccess('Booking deleted');
      await queryClient.invalidateQueries({ queryKey: ['bookings'] });
      await queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    } catch (err: any) {
      setFormError(err.message ?? 'Failed to delete booking');
    }
  };

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Data Lab: Workspaces & Marketplace</h1>
          <p className="text-gray-600 text-sm max-w-2xl">
            Create a few workspaces, services, and bookings for your account so the main dashboard metrics
            show real activity instead of zeros.
          </p>
        </header>

        {formError && (
          <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {formError}
          </div>
        )}
        {formSuccess && (
          <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-800">
            {formSuccess}
          </div>
        )}

        {/* Workspaces */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Workspaces</h2>
            <p className="text-sm text-gray-500">Active workspaces power the workspace card on /dashboard.</p>
          </div>

          <form onSubmit={handleCreateWorkspace} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Event</label>
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
                value={workspaceForm.eventId}
                onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, eventId: e.target.value }))}
              >
                <option value="">Select an event</option>
                {events?.map((event: any) => (
                  <option key={event.id} value={event.id}>
                    {event.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Workspace name</label>
              <input
                type="text"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-coral focus:border-coral"
                placeholder="Backstage crew, Registration ops..."
                value={workspaceForm.name}
                onChange={(e) => setWorkspaceForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-coral px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-coral-light focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2"
            >
              Add workspace
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your workspaces</h3>
            {workspaces && workspaces.length > 0 ? (
              <ul className="divide-y divide-gray-100 text-sm">
                {workspaces.map((ws: any) => (
                  <li key={ws.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-gray-900">{ws.name}</div>
                      <div className="text-gray-500 text-xs">Status: {ws.status}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteWorkspace(ws.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No workspaces yet. Create one above to get started.</p>
            )}
          </div>
        </section>

        {/* Services */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Marketplace services</h2>
            <p className="text-sm text-gray-500">Active services power the marketplace card.</p>
          </div>

          <form onSubmit={handleCreateService} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service name</label>
              <input
                type="text"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                placeholder="Photography, Catering..."
                value={serviceForm.name}
                onChange={(e) => setServiceForm((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                placeholder="CATERING, VENUE, AV..."
                value={serviceForm.category}
                onChange={(e) => setServiceForm((prev) => ({ ...prev, category: e.target.value }))}
              />
            </div>
            <div className="flex items-end space-x-2">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Base price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-teal focus:border-teal"
                  placeholder="2500"
                  value={serviceForm.basePrice}
                  onChange={(e) => setServiceForm((prev) => ({ ...prev, basePrice: e.target.value }))}
                />
              </div>
              <button
                type="submit"
                className="inline-flex items-center justify-center rounded-md bg-teal px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-teal-light focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2"
              >
                Add service
              </button>
            </div>
          </form>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your services</h3>
            {services && services.length > 0 ? (
              <ul className="divide-y divide-gray-100 text-sm">
                {services.map((s: any) => (
                  <li key={s.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-gray-900">{s.name}</div>
                      <div className="text-gray-500 text-xs">
                        {s.category} • ${Number(s.base_price ?? 0).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteService(s.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No services yet. Create one above to seed the marketplace.</p>
            )}
          </div>
        </section>

        {/* Bookings */}
        <section className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Bookings & revenue</h2>
            <p className="text-sm text-gray-500">Bookings and completed amounts drive active bookings and revenue metrics.</p>
          </div>

          <form onSubmit={handleCreateBooking} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service</label>
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sunny focus:border-sunny"
                value={bookingForm.serviceId}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, serviceId: e.target.value }))}
              >
                <option value="">Select a service</option>
                {services?.map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sunny focus:border-sunny"
                placeholder="2500"
                value={bookingForm.amount}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, amount: e.target.value }))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sunny focus:border-sunny"
                value={bookingForm.status}
                onChange={(e) => setBookingForm((prev) => ({ ...prev, status: e.target.value }))}
              >
                <option value="PENDING">Pending</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md bg-sunny px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-sunny/80 focus:outline-none focus:ring-2 focus:ring-sunny focus:ring-offset-2"
            >
              Add booking
            </button>
          </form>

          <div className="border-t border-gray-100 pt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Your bookings</h3>
            {bookings && bookings.length > 0 ? (
              <ul className="divide-y divide-gray-100 text-sm">
                {bookings.map((b: any) => (
                  <li key={b.id} className="flex items-center justify-between py-2">
                    <div>
                      <div className="font-medium text-gray-900">${Number(b.amount ?? 0).toLocaleString()}</div>
                      <div className="text-gray-500 text-xs">Status: {b.status}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteBooking(b.id)}
                      className="text-xs font-medium text-red-600 hover:text-red-500"
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500">No bookings yet. Create at least one completed booking to see revenue.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default DashboardDataLab;
