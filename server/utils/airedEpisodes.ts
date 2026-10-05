import type { TmdbTvEpisodeResult } from '@server/api/themoviedb/interfaces';

/**
 * Caps a season's episode total at the episodes that have aired, so a season
 * that is still airing but fully caught up counts as available rather than
 * partially available. Episodes already on the server always count, in case
 * a file lands before TMDB moves its last aired episode forward.
 *
 * Without a regular last aired episode, or for specials, the total is left
 * alone: a special as the last aired episode says nothing about seasons 1+.
 */
export const getAiredEpisodeCount = ({
  seasonNumber,
  totalEpisodes,
  lastEpisodeToAir,
  episodesOnServer,
}: {
  seasonNumber: number;
  totalEpisodes: number;
  lastEpisodeToAir?: Pick<
    TmdbTvEpisodeResult,
    'season_number' | 'episode_number'
  > | null;
  episodesOnServer: number;
}): number => {
  if (
    !lastEpisodeToAir ||
    lastEpisodeToAir.season_number === 0 ||
    seasonNumber === 0
  ) {
    return totalEpisodes;
  }

  const airedEpisodes =
    seasonNumber < lastEpisodeToAir.season_number
      ? totalEpisodes
      : seasonNumber === lastEpisodeToAir.season_number
        ? lastEpisodeToAir.episode_number
        : 0;

  return Math.min(totalEpisodes, Math.max(airedEpisodes, episodesOnServer));
};
