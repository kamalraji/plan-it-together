import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { queryPresets } from '@/lib/query-config';

export interface MessageReaction {
  id: string;
  message_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

export interface AggregatedReaction {
  emoji: string;
  count: number;
  users: { id: string; name: string }[];
  userReacted: boolean;
}

export function useMessageReactions(messageId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: reactions = [], isLoading } = useQuery({
    queryKey: ['message-reactions', messageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_reactions')
        .select(`
          id,
          message_id,
          user_id,
          emoji,
          created_at
        `)
        .eq('message_id', messageId);

      if (error) throw error;
      return data as MessageReaction[];
    },
    enabled: !!messageId,
    ...queryPresets.realtime,
  });

  // Aggregate reactions by emoji
  const aggregatedReactions: AggregatedReaction[] = [];
  const emojiMap = new Map<string, { users: { id: string; name: string }[] }>();

  reactions.forEach((reaction) => {
    const existing = emojiMap.get(reaction.emoji);
    if (existing) {
      existing.users.push({ id: reaction.user_id, name: 'User' });
    } else {
      emojiMap.set(reaction.emoji, { users: [{ id: reaction.user_id, name: 'User' }] });
    }
  });

  emojiMap.forEach((value, emoji) => {
    aggregatedReactions.push({
      emoji,
      count: value.users.length,
      users: value.users,
      userReacted: user ? value.users.some((u) => u.id === user.id) : false,
    });
  });

  const addReaction = useMutation({
    mutationFn: async (emoji: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: messageId,
          user_id: user.id,
          emoji,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    },
  });

  const removeReaction = useMutation({
    mutationFn: async (emoji: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('message_reactions')
        .delete()
        .eq('message_id', messageId)
        .eq('user_id', user.id)
        .eq('emoji', emoji);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['message-reactions', messageId] });
    },
  });

  const toggleReaction = async (emoji: string) => {
    if (!user) return;

    const hasReacted = reactions.some(
      (r) => r.user_id === user.id && r.emoji === emoji
    );

    if (hasReacted) {
      await removeReaction.mutateAsync(emoji);
    } else {
      await addReaction.mutateAsync(emoji);
    }
  };

  return {
    reactions,
    aggregatedReactions,
    isLoading,
    toggleReaction,
    isToggling: addReaction.isPending || removeReaction.isPending,
  };
}
