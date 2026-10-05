import { MediaStatus } from '@server/constants/media';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  getAvailableSeasonNumbers,
  groupSeasonRanges,
} from './seasonAvailability';

const seasons = [0, 1, 2, 3, 4].map((seasonNumber) => ({
  seasonNumber,
  episodeCount: 10,
}));

// Season 3 is airing (4 of 10 out) and season 4 is announced
const lastEpisodeToAir = {
  id: 1,
  airDate: '2026-10-01',
  episodeNumber: 4,
  name: '',
  overview: '',
  productionCode: '',
  seasonNumber: 3,
  showId: 1,
  voteAverage: 0,
  voteCount: 0,
  stillPath: '',
};

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

describe('getAvailableSeasonNumbers', () => {
  it('names the only available season when earlier ones were never requested', () => {
    assert.deepStrictEqual(
      getAvailableSeasonNumbers({
        seasons,
        mediaSeasons: [mediaSeason(3, MediaStatus.AVAILABLE, 4)],
        lastEpisodeToAir,
      }),
      [3]
    );
  });

  it('ignores specials and seasons that have not aired', () => {
    assert.deepStrictEqual(
      getAvailableSeasonNumbers({
        seasons,
        mediaSeasons: [
          mediaSeason(0, MediaStatus.PARTIALLY_AVAILABLE, 1),
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          mediaSeason(4, MediaStatus.PROCESSING),
        ],
        lastEpisodeToAir,
      }),
      [1]
    );
  });

  it('keeps the generic label when an aired season is missing episodes', () => {
    assert.strictEqual(
      getAvailableSeasonNumbers({
        seasons,
        mediaSeasons: [
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          mediaSeason(2, MediaStatus.PARTIALLY_AVAILABLE, 7),
        ],
        lastEpisodeToAir,
      }),
      undefined
    );
  });

  it('returns nothing when no season is available', () => {
    assert.strictEqual(
      getAvailableSeasonNumbers({
        seasons,
        mediaSeasons: [mediaSeason(2, MediaStatus.PROCESSING)],
        lastEpisodeToAir,
      }),
      undefined
    );
  });

  it('reads the 4K statuses when asked', () => {
    assert.deepStrictEqual(
      getAvailableSeasonNumbers({
        seasons,
        mediaSeasons: [
          {
            ...mediaSeason(1, MediaStatus.AVAILABLE, 10),
            status4k: MediaStatus.UNKNOWN,
          },
          {
            ...mediaSeason(2, MediaStatus.UNKNOWN),
            status4k: MediaStatus.AVAILABLE,
            libraryEpisodeCount4k: 10,
          },
        ],
        lastEpisodeToAir,
        is4k: true,
      }),
      [2]
    );
  });

  it('keeps the generic label when an aired requested season is not in', () => {
    assert.strictEqual(
      getAvailableSeasonNumbers({
        seasons,
        mediaSeasons: [
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          mediaSeason(2, MediaStatus.PROCESSING),
        ],
        lastEpisodeToAir,
        requestedSeasons: [2],
      }),
      undefined
    );
  });

  it('names seasons when every aired requested season is in', () => {
    assert.deepStrictEqual(
      getAvailableSeasonNumbers({
        seasons,
        mediaSeasons: [
          mediaSeason(1, MediaStatus.AVAILABLE, 10),
          mediaSeason(3, MediaStatus.AVAILABLE, 4),
          mediaSeason(4, MediaStatus.PROCESSING),
        ],
        lastEpisodeToAir,
        // Season 4 hasn't aired, so it can't be missing yet
        requestedSeasons: [3, 4],
      }),
      [1, 3]
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
