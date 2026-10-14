import type { TmdbTvEpisodeResult } from '@server/api/themoviedb/interfaces';
import type { TvdbEpisode } from '@server/api/tvdb/interfaces';

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

/**
 * TheTVDB numbers seasons its own way, so a show whose seasons come from it
 * needs last and next aired episodes in that numbering too. Built from
 * TheTVDB's air dates; specials and undated episodes are skipped.
 */
export const getTvdbAiringEpisodes = (
  episodes: Pick<
    TvdbEpisode,
    'id' | 'aired' | 'number' | 'seasonNumber' | 'name' | 'overview'
  >[],
  showId: number,
  today = new Date()
): {
  last_episode_to_air?: TmdbTvEpisodeResult;
  next_episode_to_air?: TmdbTvEpisodeResult;
} => {
  // TheTVDB air dates are plain dates, so compare them as YYYY-MM-DD strings
  const todayDate = today.toISOString().slice(0, 10);
  const dated = episodes
    .filter((episode) => episode.seasonNumber > 0 && episode.aired)
    .sort((a, b) => a.seasonNumber - b.seasonNumber || a.number - b.number);

  const toTmdb = (
    episode: (typeof dated)[number] | undefined
  ): TmdbTvEpisodeResult | undefined =>
    episode && {
      id: episode.id,
      air_date: episode.aired,
      episode_number: episode.number,
      name: episode.name ?? '',
      overview: episode.overview ?? '',
      production_code: '',
      season_number: episode.seasonNumber,
      show_id: showId,
      still_path: '',
      vote_average: 0,
      vote_count: 0,
    };

  return {
    last_episode_to_air: toTmdb(
      dated.filter((episode) => episode.aired <= todayDate).pop()
    ),
    next_episode_to_air: toTmdb(
      dated.find((episode) => episode.aired > todayDate)
    ),
  };
};
