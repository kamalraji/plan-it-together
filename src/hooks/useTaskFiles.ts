/**
 * Task Files Hook - Manages file attachments for workspace tasks
 * Integrates with Supabase Storage for file uploads/downloads
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export interface TaskFile {
  id: string;
  taskId: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
  uploadedBy: string;
  uploadedByName: string;
  uploadedAt: string;
}

const BUCKET_NAME = 'task-attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function useTaskFiles(taskId: string | undefined) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const queryKey = ['task-files', taskId];

  // Fetch files for a task
  const { data: files = [], isLoading, error } = useQuery({
    queryKey,
    queryFn: async (): Promise<TaskFile[]> => {
      if (!taskId) return [];

      const { data, error } = await supabase
        .from('task_attachments')
        .select(`
          id,
          task_id,
          file_name,
          file_url,
          file_size,
          mime_type,
          uploaded_by,
          created_at
        `)
        .eq('task_id', taskId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return (data || []).map((file) => ({
        id: file.id,
        taskId: file.task_id,
        name: file.file_name,
        url: file.file_url,
        size: file.file_size || 0,
        mimeType: file.mime_type || 'application/octet-stream',
        uploadedBy: file.uploaded_by || 'unknown',
        uploadedByName: 'User', // Will be enhanced with profile lookup
        uploadedAt: file.created_at,
      }));
    },
    enabled: !!taskId,
  });

  // Upload files mutation
  const uploadMutation = useMutation({
    mutationFn: async ({ files }: { files: FileList }): Promise<TaskFile[]> => {
      if (!taskId || !user?.id) throw new Error('Task ID and user required');

      const uploadedFiles: TaskFile[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // Validate file size
        if (file.size > MAX_FILE_SIZE) {
          throw new Error(`File "${file.name}" exceeds 10MB limit`);
        }

        // Generate unique path
        const fileExt = file.name.split('.').pop();
        const fileName = `${taskId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from(BUCKET_NAME)
          .getPublicUrl(fileName);

        // Save to database
        const { data: attachmentData, error: dbError } = await supabase
          .from('task_attachments')
          .insert({
            task_id: taskId,
            file_name: file.name,
            file_url: urlData.publicUrl,
            file_size: file.size,
            mime_type: file.type || 'application/octet-stream',
            storage_path: fileName,
            uploaded_by: user.id,
          })
          .select('id, created_at')
          .single();

        if (dbError) throw dbError;

        uploadedFiles.push({
          id: attachmentData.id,
          taskId,
          name: file.name,
          url: urlData.publicUrl,
          size: file.size,
          mimeType: file.type || 'application/octet-stream',
          uploadedBy: user.id,
          uploadedByName: user.email || 'You',
          uploadedAt: attachmentData.created_at,
        });
      }

      return uploadedFiles;
    },
    onSuccess: (newFiles) => {
      queryClient.setQueryData(queryKey, (old: TaskFile[] = []) => [...newFiles, ...old]);
      toast.success(`${newFiles.length} file(s) uploaded`);
    },
    onError: (err: Error) => {
      toast.error(err.message || 'Failed to upload files');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      // Get file info first
      const { data: fileData, error: fetchError } = await supabase
        .from('task_attachments')
        .select('storage_path')
        .eq('id', fileId)
        .single();

      if (fetchError) throw fetchError;

      // Delete from storage if path exists
      if (fileData?.storage_path) {
        const { error: storageError } = await supabase.storage
          .from(BUCKET_NAME)
          .remove([fileData.storage_path]);

        if (storageError) {
          console.error('Storage delete failed:', storageError);
        }
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('task_attachments')
        .delete()
        .eq('id', fileId);

      if (dbError) throw dbError;

      return fileId;
    },
    onMutate: async (fileId) => {
      await queryClient.cancelQueries({ queryKey });
      const previousFiles = queryClient.getQueryData<TaskFile[]>(queryKey);

      queryClient.setQueryData(queryKey, (old: TaskFile[] = []) =>
        old.filter((f) => f.id !== fileId)
      );

      return { previousFiles };
    },
    onError: (_err, _, context) => {
      if (context?.previousFiles) {
        queryClient.setQueryData(queryKey, context.previousFiles);
      }
      toast.error('Failed to delete file');
    },
    onSuccess: () => {
      toast.success('File deleted');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    files,
    isLoading,
    error,
    uploadFiles: (files: FileList) => uploadMutation.mutate({ files }),
    deleteFile: (fileId: string) => deleteMutation.mutate(fileId),
    isUploading: uploadMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
