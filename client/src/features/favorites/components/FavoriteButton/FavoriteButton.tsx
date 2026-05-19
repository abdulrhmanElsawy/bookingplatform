import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import {
  addFavorite,
  fetchFavoriteStatus,
  removeFavorite,
} from '../../api/favoritesApi';
import { useAuthStore } from '../../../../store/authStore';
import styles from './FavoriteButton.module.css';

export type FavoriteButtonProps = {
  listingSlug: string;
  className?: string;
};

export function FavoriteButton({ listingSlug, className }: FavoriteButtonProps) {
  const { t } = useTranslation('profile');
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  const statusQuery = useQuery({
    queryKey: ['favorite-status', listingSlug],
    queryFn: () => fetchFavoriteStatus(listingSlug),
    enabled: isAuthenticated && Boolean(listingSlug),
  });

  const toggleMutation = useMutation({
    mutationFn: async () => {
      const favorited = statusQuery.data?.favorited;
      if (favorited) {
        await removeFavorite(listingSlug);
      } else {
        await addFavorite(listingSlug);
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['favorite-status', listingSlug] });
      await queryClient.invalidateQueries({ queryKey: ['favorites'] });
    },
  });

  if (!isAuthenticated) {
    return null;
  }

  const favorited = Boolean(statusQuery.data?.favorited);
  const title = favorited ? t('removedFromFavorites') : t('addedToFavorites');
  const busy = statusQuery.isLoading || toggleMutation.isPending;

  return (
    <button
      type="button"
      className={`${favorited ? styles.btnActive : styles.btn} ${className ?? ''}`.trim()}
      title={title}
      aria-label={title}
      aria-pressed={favorited}
      data-testid="favorite-button"
      disabled={busy || statusQuery.isError}
      onClick={() => toggleMutation.mutate()}
    >
      {favorited ? '♥' : '♡'}
    </button>
  );
}
