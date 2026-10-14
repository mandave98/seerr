import { MediaStatus } from '@server/constants/media';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getSeasonDisplay,
  getSeasonsSummary,
  groupSeasonRanges,
} from './seasonAvailability';

const seasons = [0, 1, 2, 3, 4].map((seasonNumber) => ({
  seasonNumber,
  episodeCount: 10,
}));

const lastAired = (seasonNumber: number, episodeNumber: number) => ({
  id: 1,
  airDate: '2026-10-01',
  episodeNumber,
  name: '',
  overview: '',
  productionCode: '',
  seasonNumber,
  showId: 1,
  voteAverage: 0,
  voteCount: 0,
  stillPath: '',
});

// Season 3 is airing (4 of 10 out) and season 4 is announced
const lastEpisodeToAir = lastAired(3, 4);

const mediaSeason = (
  seasonNumber: number,
  status: MediaStatus,
  libraryEpisodeCount: number | null = null
) => ({
  seasonNumber,
  status,
  status4k: MediaStatus.UNKNOWN,
  libraryEpisodeCount,
  libraryEpisodeCount4k: null,
});

describe('getSeasonDisplay', () => {
  it('reads a caught-up airing season as available and airing', () => {
    assert.deepStrictEqual(
      getSeasonDisplay(
        seasons[3],
        mediaSeason(3, MediaStatus.AVAILABLE, 4),
        lastEpisodeToAir
      ),
      { status: MediaStatus.AVAILABLE, airing: true }
    );
  });

  it('corrects a partial season the last scan judged against unaired episodes', () => {
    // VisionQuest: 2 of 8 out, both in Plex, stored partial
    assert.deepStrictEqual(
      getSeasonDisplay(
        { seasonNumber: 1, episodeCount: 8 },
        mediaSeason(1, MediaStatus.PARTIALLY_AVAILABLE, 2),
        lastAired(1, 2)
      ),
      { status: MediaStatus.AVAILABLE, airing: true }
    );
  });

  it('shows a season that stayed available but fell behind as partial', () => {
    assert.deepStrictEqual(
      getSeasonDisplay(
        seasons[3],
        mediaSeason(3, MediaStatus.AVAILABLE, 2),
        lastEpisodeToAir
      ),
      { status: MediaStatus.PARTIALLY_AVAILABLE, airing: false }
    );
  });

  it('keeps the stored status without a count, and finished seasons are not airing', () => {
    assert.deepStrictEqual(
      getSeasonDisplay(
        seasons[1],
        mediaSeason(1, MediaStatus.AVAILABLE),
        lastEpisodeToAir
      ),
      { status: MediaStatus.AVAILABLE, airing: false }
    );
    assert.deepStrictEqual(
      getSeasonDisplay(
        seasons[2],
        mediaSeason(2, MediaStatus.PROCESSING),
        lastEpisodeToAir
      ),
      { status: MediaStatus.PROCESSING, airing: false }
    );
  });
});

describe('getSeasonsSummary', () => {
  it('names the only available season when earlier ones were never requested', () => {
    assert.deepStrictEqual(
      getSeasonsSummary({
        seasons,
        mediaSeasons: [mediaSeason(3, MediaStatus.AVAILABLE, 4)],
        lastEpisodeToAir,
      }),
      { state: 'some', available: [3], airing: true }
    );
  });

  it('reports every aired season in, ignoring specials and unaired seasons', () => {
    assert.deepStrictEqual(
      getSeasonsSummary({
        seasons,
        mediaSeasons: [
          mediaSeason(0, MediaStatus.PARTIALLY_AVAILABLE, 1),
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          mediaSeason(2, MediaStatus.AVAILABLE, 10),
          mediaSeason(3, MediaStatus.AVAILABLE, 4),
          mediaSeason(4, MediaStatus.PROCESSING),
        ],
        lastEpisodeToAir,
      }),
      { state: 'all', available: [1, 2, 3], airing: true }
    );
  });

  it('is partial when an aired season is missing episodes', () => {
    assert.strictEqual(
      getSeasonsSummary({
        seasons,
        mediaSeasons: [
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          mediaSeason(2, MediaStatus.PARTIALLY_AVAILABLE, 7),
        ],
        lastEpisodeToAir,
      }).state,
      'partial'
    );
  });

  it('is partial when an aired requested season is not in', () => {
    assert.strictEqual(
      getSeasonsSummary({
        seasons,
        mediaSeasons: [
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          mediaSeason(2, MediaStatus.PROCESSING),
        ],
        lastEpisodeToAir,
        requestedSeasons: [2],
      }).state,
      'partial'
    );
  });

  it('ignores requested seasons that have not aired', () => {
    assert.deepStrictEqual(
      getSeasonsSummary({
        seasons,
        mediaSeasons: [
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          mediaSeason(3, MediaStatus.AVAILABLE, 4),
          mediaSeason(4, MediaStatus.PROCESSING),
        ],
        lastEpisodeToAir,
        requestedSeasons: [3, 4],
      }),
      { state: 'some', available: [1, 3], airing: true }
    );
  });

  it('reports none when nothing is in', () => {
    assert.strictEqual(
      getSeasonsSummary({
        seasons,
        mediaSeasons: [mediaSeason(2, MediaStatus.PROCESSING)],
        lastEpisodeToAir,
      }).state,
      'none'
    );
  });

  it('reads the 4K statuses when asked', () => {
    assert.deepStrictEqual(
      getSeasonsSummary({
        seasons,
        mediaSeasons: [
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          {
            ...mediaSeason(2, MediaStatus.UNKNOWN),
            status4k: MediaStatus.AVAILABLE,
            libraryEpisodeCount4k: 10,
          },
        ],
        lastEpisodeToAir,
        is4k: true,
      }),
      { state: 'some', available: [2], airing: false }
    );
  });
});

describe('groupSeasonRanges', () => {
  it('collapses consecutive seasons into runs', () => {
    assert.deepStrictEqual(groupSeasonRanges([1, 2, 3, 5, 7, 8]), [
      [1, 3],
      [5, 5],
      [7, 8],
    ]);
    assert.deepStrictEqual(groupSeasonRanges([3]), [[3, 3]]);
    assert.deepStrictEqual(groupSeasonRanges([]), []);
  });
});
