import globalMessages from '@app/i18n/globalMessages';
import defineMessages from '@app/utils/defineMessages';
import {
  getSeasonAiredEpisodes,
  getSeasonsSummary,
  groupSeasonRanges,
} from '@app/utils/seasonAvailability';
import { MediaStatus } from '@server/constants/media';
import type Season from '@server/entity/Season';
import type { TvDetails } from '@server/models/Tv';
import { useIntl } from 'react-intl';

export const messages = defineMessages(
  'components.TvDetails.SeasonAvailability',
  {
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
    uptodate: 'Up to Date',
    seasonsuptodate:
      '{seasonCount, plural, one {Season} other {Seasons}} {seasons} Up to Date',
    selectseasonsuptodate: 'Select Seasons Up to Date',
  }
);

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
 * The label for an available or partially available series badge: "Up to
 * Date" when every aired season is in but one is still airing, the seasons by
 * name ("Season 3 Available") when only some are in, and "Partially
 * Available" when an aired season, or an aired requested one, is missing.
 */
export const useAvailableSeasonsLabel = (
  data: TvDetails | undefined,
  is4k = false,
  requestedSeasons?: number[]
): string | undefined => {
  const intl = useIntl();
  const mediaStatus = data?.mediaInfo?.[is4k ? 'status4k' : 'status'];

  if (
    !data?.mediaInfo ||
    (mediaStatus !== MediaStatus.AVAILABLE &&
      mediaStatus !== MediaStatus.PARTIALLY_AVAILABLE)
  ) {
    return undefined;
  }

  const { state, available, airing } = getSeasonsSummary({
    seasons: data.seasons,
    mediaSeasons: data.mediaInfo.seasons,
    lastEpisodeToAir: data.lastEpisodeToAir,
    is4k,
    requestedSeasons,
  });

  if (state === 'none') {
    return undefined;
  }

  if (state === 'partial') {
    return intl.formatMessage(globalMessages.partiallyavailable);
  }

  if (state === 'all') {
    return intl.formatMessage(
      airing ? messages.uptodate : globalMessages.available
    );
  }

  const ranges = groupSeasonRanges(available);

  // Past two runs the list stops fitting in a badge
  if (ranges.length > 2) {
    return intl.formatMessage(
      airing ? messages.selectseasonsuptodate : messages.selectseasonsavailable
    );
  }

  return intl.formatMessage(
    airing ? messages.seasonsuptodate : messages.seasonsavailable,
    {
      seasonCount: available.length,
      seasons: ranges
        .map(([start, end]) => (start === end ? `${start}` : `${start}–${end}`))
        .join(', '),
    }
  );
};

export default SeasonAvailability;
