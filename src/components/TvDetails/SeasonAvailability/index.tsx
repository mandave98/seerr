import defineMessages from '@app/utils/defineMessages';
import {
  getAvailableSeasonNumbers,
  getSeasonAiredEpisodes,
  groupSeasonRanges,
} from '@app/utils/seasonAvailability';
import { MediaStatus } from '@server/constants/media';
import type Season from '@server/entity/Season';
import type { TvDetails } from '@server/models/Tv';
import { useIntl } from 'react-intl';

const messages = defineMessages('components.TvDetails.SeasonAvailability', {
  inlibrary: '{count} of {total} in library',
  airedinlibrary: '{count} of {aired} aired in library',
  inlibrary4k: '{count} of {total} in 4K',
  airedinlibrary4k: '{count} of {aired} aired in 4K',
  nextepisode: 'Next episode {date}',
  premieres: 'Premieres {date}',
  upcomingepisodes:
    '{count, plural, one {# episode} other {# episodes}} upcoming',
  upcoming: 'Upcoming',
  seasonsavailable:
    '{seasonCount, plural, one {Season} other {Seasons}} {seasons} Available',
  selectseasonsavailable: 'Select Seasons Available',
});

const shownStatuses = [MediaStatus.AVAILABLE, MediaStatus.PARTIALLY_AVAILABLE];

const formatAirDate = (
  intl: ReturnType<typeof useIntl>,
  date: string
): string =>
  intl.formatDate(date, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });

interface SeasonAvailabilityProps {
  season: TvDetails['seasons'][number];
  mediaSeason?: Season;
  lastEpisodeToAir: TvDetails['lastEpisodeToAir'];
  nextEpisodeToAir: TvDetails['nextEpisodeToAir'];
  show4k: boolean;
}

/** One line of episode and airing detail for a season row. */
const SeasonAvailability = ({
  season,
  mediaSeason,
  lastEpisodeToAir,
  nextEpisodeToAir,
  show4k,
}: SeasonAvailabilityProps) => {
  const intl = useIntl();
  const parts: string[] = [];

  const libraryPart = (
    count: number | null | undefined,
    status: MediaStatus | undefined,
    is4k: boolean
  ) => {
    if (count == null || status === undefined) {
      return;
    }

    if (!shownStatuses.includes(status)) {
      return;
    }

    const aired = getSeasonAiredEpisodes(season, lastEpisodeToAir, count);

    parts.push(
      aired < season.episodeCount
        ? intl.formatMessage(
            is4k ? messages.airedinlibrary4k : messages.airedinlibrary,
            { count, aired }
          )
        : intl.formatMessage(is4k ? messages.inlibrary4k : messages.inlibrary, {
            count,
            total: season.episodeCount,
          })
    );
  };

  if (season.seasonNumber !== 0) {
    libraryPart(mediaSeason?.libraryEpisodeCount, mediaSeason?.status, false);

    if (show4k) {
      libraryPart(
        mediaSeason?.libraryEpisodeCount4k,
        mediaSeason?.status4k,
        true
      );
    }

    const aired = getSeasonAiredEpisodes(
      season,
      lastEpisodeToAir,
      mediaSeason?.libraryEpisodeCount
    );

    if (
      nextEpisodeToAir?.seasonNumber === season.seasonNumber &&
      nextEpisodeToAir.airDate
    ) {
      const date = formatAirDate(intl, nextEpisodeToAir.airDate);

      parts.push(
        nextEpisodeToAir.episodeNumber === 1
          ? intl.formatMessage(messages.premieres, { date })
          : intl.formatMessage(messages.nextepisode, { date })
      );
    } else if (aired > 0 && aired < season.episodeCount) {
      parts.push(
        intl.formatMessage(messages.upcomingepisodes, {
          count: season.episodeCount - aired,
        })
      );
    } else if (aired === 0) {
      parts.push(
        season.airDate && new Date(season.airDate) > new Date()
          ? intl.formatMessage(messages.premieres, {
              date: formatAirDate(intl, season.airDate),
            })
          : intl.formatMessage(messages.upcoming)
      );
    }
  }

  if (parts.length === 0) {
    return null;
  }

  // Full width so it wraps below the season name; !ml-0 undoes the row's space-x
  return (
    <span className="!ml-0 w-full text-left text-sm text-gray-400">
      {parts.join(' · ')}
    </span>
  );
};

/**
 * Names the available seasons for a partially available show's badge, e.g.
 * "Season 3 Available", when it's partial because whole seasons are missing.
 * With requested seasons, every aired one of them must be available too.
 */
export const useAvailableSeasonsLabel = (
  data: TvDetails | undefined,
  is4k = false,
  requestedSeasons?: number[]
): string | undefined => {
  const intl = useIntl();

  if (
    !data?.mediaInfo ||
    data.mediaInfo[is4k ? 'status4k' : 'status'] !==
      MediaStatus.PARTIALLY_AVAILABLE
  ) {
    return undefined;
  }

  const available = getAvailableSeasonNumbers({
    seasons: data.seasons,
    mediaSeasons: data.mediaInfo.seasons,
    lastEpisodeToAir: data.lastEpisodeToAir,
    is4k,
    requestedSeasons,
  });

  if (!available) {
    return undefined;
  }

  const ranges = groupSeasonRanges(available);

  // Past two runs the list stops fitting in a badge
  if (ranges.length > 2) {
    return intl.formatMessage(messages.selectseasonsavailable);
  }

  return intl.formatMessage(messages.seasonsavailable, {
    seasonCount: available.length,
    seasons: ranges
      .map(([start, end]) => (start === end ? `${start}` : `${start}–${end}`))
      .join(', '),
  });
};

export default SeasonAvailability;
