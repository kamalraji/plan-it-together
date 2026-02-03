/**
 * Field-Level Audit Trail Hook
 * Tracks detailed changes to specific fields for compliance and debugging
 */
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface FieldChange {
  field: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLogEntry {
  action: string;
  targetType: string;
  targetId: string;
  changes?: FieldChange[];
  metadata?: Record<string, unknown>;
}

export function useFieldAuditLog() {
  const { user } = useAuth();

  const logFieldChanges = useCallback(async ({
    action,
    targetType,
    targetId,
    changes,
    metadata,
  }: AuditLogEntry) => {
    if (!user?.id) return;

    try {
      await supabase.from('admin_audit_logs').insert({
        admin_id: user.id,
        admin_email: user.email || null,
        action,
        target_type: targetType,
        target_id: targetId,
        details: JSON.stringify({
          field_changes: changes,
          ...metadata,
        }),
      });
    } catch (error) {
      console.error('Failed to log audit entry:', error);
    }
  }, [user?.id, user?.email]);

  const trackChanges = useCallback(<T extends Record<string, unknown>>(
    oldObj: T,
    newObj: T,
    fieldsToTrack?: (keyof T)[]
  ): FieldChange[] => {
    const changes: FieldChange[] = [];
    const fields = fieldsToTrack || (Object.keys(newObj) as (keyof T)[]);

    for (const field of fields) {
      const oldValue = oldObj[field];
      const newValue = newObj[field];

      // Deep comparison for objects/arrays
      const oldStr = JSON.stringify(oldValue);
      const newStr = JSON.stringify(newValue);

      if (oldStr !== newStr) {
        changes.push({
          field: String(field),
          oldValue,
          newValue,
        });
      }
    }

    return changes;
  }, []);

  const logEntityUpdate = useCallback(async <T extends Record<string, unknown>>(
    entityType: string,
    entityId: string,
    oldEntity: T,
    newEntity: T,
    fieldsToTrack?: (keyof T)[]
  ) => {
    const changes = trackChanges(oldEntity, newEntity, fieldsToTrack);
    
    if (changes.length > 0) {
      await logFieldChanges({
        action: 'update',
        targetType: entityType,
        targetId: entityId,
        changes,
      });
    }

    return changes;
  }, [logFieldChanges, trackChanges]);

  const logEntityCreate = useCallback(async (
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>
  ) => {
    await logFieldChanges({
      action: 'create',
      targetType: entityType,
      targetId: entityId,
      metadata,
    });
  }, [logFieldChanges]);

  const logEntityDelete = useCallback(async (
    entityType: string,
    entityId: string,
    metadata?: Record<string, unknown>
  ) => {
    await logFieldChanges({
      action: 'delete',
      targetType: entityType,
      targetId: entityId,
      metadata,
    });
  }, [logFieldChanges]);

  return {
    logFieldChanges,
    trackChanges,
    logEntityUpdate,
    logEntityCreate,
    logEntityDelete,
  };
}
