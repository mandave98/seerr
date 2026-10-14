import { MediaStatus } from '@server/constants/media';
import type Season from '@server/entity/Season';
import type { TvDetails } from '@server/models/Tv';
import { getAiredEpisodeCount } from '@server/utils/airedEpisodes';

type TvSeason = Pick<
  TvDetails['seasons'][number],
  'seasonNumber' | 'episodeCount'
>;
type MediaSeason = Pick<
  Season,
  | 'seasonNumber'
  | 'status'
  | 'status4k'
  | 'libraryEpisodeCount'
  | 'libraryEpisodeCount4k'
>;

export const getSeasonAiredEpisodes = (
  season: TvSeason,
  lastEpisodeToAir: TvDetails['lastEpisodeToAir'],
  libraryEpisodeCount?: number | null
): number =>
  getAiredEpisodeCount({
    seasonNumber: season.seasonNumber,
    totalEpisodes: season.episodeCount,
    lastEpisodeToAir: lastEpisodeToAir && {
      season_number: lastEpisodeToAir.seasonNumber,
      episode_number: lastEpisodeToAir.episodeNumber,
    },
    episodesOnServer: libraryEpisodeCount ?? 0,
  });

/**
 * How a season should read. With a stored episode count the season is judged
 * against today's aired episodes, so it doesn't wait for the next scan, and a
 * season that stayed Available while new episodes went missing reads as
 * partial. `airing` marks an available season with episodes still to come.
 */
export const getSeasonDisplay = (
  season: TvSeason,
  mediaSeason: MediaSeason | undefined,
  lastEpisodeToAir: TvDetails['lastEpisodeToAir'],
  is4k = false
): { status?: MediaStatus; airing: boolean } => {
  const status = mediaSeason?.[is4k ? 'status4k' : 'status'];
  const count =
    mediaSeason?.[is4k ? 'libraryEpisodeCount4k' : 'libraryEpisodeCount'];

  if (
    status !== MediaStatus.AVAILABLE &&
    status !== MediaStatus.PARTIALLY_AVAILABLE
  ) {
    return { status, airing: false };
  }

  const aired = getSeasonAiredEpisodes(season, lastEpisodeToAir, count);
  const displayStatus =
    count == null
      ? status
      : count > 0 && count >= aired
        ? MediaStatus.AVAILABLE
        : MediaStatus.PARTIALLY_AVAILABLE;

  return {
    status: displayStatus,
    airing:
      displayStatus === MediaStatus.AVAILABLE && aired < season.episodeCount,
  };
};

/**
 * Sums up the aired regular seasons for a series badge: `partial` when a
 * season is missing aired episodes or an aired requested season isn't in,
 * otherwise whether all or some of them are available, and whether any
 * available one is still airing.
 */
export const getSeasonsSummary = ({
  seasons,
  mediaSeasons,
  lastEpisodeToAir,
  is4k = false,
  requestedSeasons,
}: {
  seasons: TvSeason[];
  mediaSeasons: MediaSeason[];
  lastEpisodeToAir: TvDetails['lastEpisodeToAir'];
  is4k?: boolean;
  requestedSeasons?: number[];
}): {
  state: 'partial' | 'all' | 'some' | 'none';
  available: number[];
  airing: boolean;
} => {
  const aired = seasons
    .filter((season) => season.seasonNumber !== 0)
    .map((season) => {
      const mediaSeason = mediaSeasons.find(
        (ms) => ms.seasonNumber === season.seasonNumber
      );

      return {
        seasonNumber: season.seasonNumber,
        aired: getSeasonAiredEpisodes(
          season,
          lastEpisodeToAir,
          mediaSeason?.[is4k ? 'libraryEpisodeCount4k' : 'libraryEpisodeCount']
        ),
        ...getSeasonDisplay(season, mediaSeason, lastEpisodeToAir, is4k),
      };
    })
    .filter((season) => season.aired > 0);

  const availableSeasons = aired.filter(
    (season) => season.status === MediaStatus.AVAILABLE
  );
  const available = availableSeasons
    .map((season) => season.seasonNumber)
    .sort((a, b) => a - b);
  const airing = availableSeasons.some((season) => season.airing);

  const partial = aired.some(
    (season) =>
      season.status === MediaStatus.PARTIALLY_AVAILABLE ||
      (requestedSeasons?.includes(season.seasonNumber) &&
        season.status !== MediaStatus.AVAILABLE)
  );

  return {
    state: partial
      ? 'partial'
      : available.length === 0
        ? 'none'
        : available.length === aired.length
          ? 'all'
          : 'some',
    available,
    airing,
  };
};

/** Collapses sorted season numbers into runs, e.g. [1, 2, 3, 5] → [[1, 3], [5, 5]]. */
export const groupSeasonRanges = (
  seasonNumbers: number[]
): [number, number][] =>
  seasonNumbers.reduce<[number, number][]>((ranges, seasonNumber) => {
    const last = ranges[ranges.length - 1];

    if (last && seasonNumber === last[1] + 1) {
      last[1] = seasonNumber;
    } else {
      ranges.push([seasonNumber, seasonNumber]);
    }

    return ranges;
  }, []);
