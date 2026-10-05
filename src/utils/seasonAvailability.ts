import { MediaStatus } from '@server/constants/media';
import type Season from '@server/entity/Season';
import type { TvDetails } from '@server/models/Tv';
import { getAiredEpisodeCount } from '@server/utils/airedEpisodes';

type TvSeason = TvDetails['seasons'][number];

export const getSeasonAiredEpisodes = (
  season: Pick<TvSeason, 'seasonNumber' | 'episodeCount'>,
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
 * The aired seasons that are available, when the show is only partially
 * available because whole seasons are missing. Undefined when some season is
 * missing episodes or none is available, so the generic label still fits.
 */
export const getAvailableSeasonNumbers = ({
  seasons,
  mediaSeasons,
  lastEpisodeToAir,
  is4k = false,
}: {
  seasons: Pick<TvSeason, 'seasonNumber' | 'episodeCount'>[];
  mediaSeasons: Pick<
    Season,
    | 'seasonNumber'
    | 'status'
    | 'status4k'
    | 'libraryEpisodeCount'
    | 'libraryEpisodeCount4k'
  >[];
  lastEpisodeToAir: TvDetails['lastEpisodeToAir'];
  is4k?: boolean;
}): { available: number[]; airedSeasonCount: number } | undefined => {
  const airedStatuses = seasons
    .filter((season) => season.seasonNumber !== 0)
    .map((season) => {
      const mediaSeason = mediaSeasons.find(
        (ms) => ms.seasonNumber === season.seasonNumber
      );

      return {
        seasonNumber: season.seasonNumber,
        status: mediaSeason?.[is4k ? 'status4k' : 'status'],
        aired: getSeasonAiredEpisodes(
          season,
          lastEpisodeToAir,
          mediaSeason?.[is4k ? 'libraryEpisodeCount4k' : 'libraryEpisodeCount']
        ),
      };
    })
    .filter((season) => season.aired > 0);

  if (
    airedStatuses.some(
      (season) => season.status === MediaStatus.PARTIALLY_AVAILABLE
    )
  ) {
    return undefined;
  }

  const available = airedStatuses
    .filter((season) => season.status === MediaStatus.AVAILABLE)
    .map((season) => season.seasonNumber)
    .sort((a, b) => a - b);

  return available.length > 0
    ? { available, airedSeasonCount: airedStatuses.length }
    : undefined;
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
