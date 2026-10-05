import { getAiredEpisodeCount } from '@server/utils/airedEpisodes';
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

const lastEpisodeToAir = { season_number: 3, episode_number: 4 };

describe('getAiredEpisodeCount', () => {
  it('keeps the full count for seasons before the airing one', () => {
    assert.strictEqual(
      getAiredEpisodeCount({
        seasonNumber: 2,
        totalEpisodes: 10,
        lastEpisodeToAir,
        episodesOnServer: 0,
      }),
      10
    );
  });

  it('caps the airing season at the last aired episode', () => {
    assert.strictEqual(
      getAiredEpisodeCount({
        seasonNumber: 3,
        totalEpisodes: 10,
        lastEpisodeToAir,
        episodesOnServer: 4,
      }),
      4
    );
  });

  it('counts nothing as aired for later seasons', () => {
    assert.strictEqual(
      getAiredEpisodeCount({
        seasonNumber: 4,
        totalEpisodes: 8,
        lastEpisodeToAir,
        episodesOnServer: 0,
      }),
      0
    );
  });

  it('counts episodes already on the server when TMDB lags behind', () => {
    assert.strictEqual(
      getAiredEpisodeCount({
        seasonNumber: 3,
        totalEpisodes: 10,
        lastEpisodeToAir,
        episodesOnServer: 5,
      }),
      5
    );
    assert.strictEqual(
      getAiredEpisodeCount({
        seasonNumber: 4,
        totalEpisodes: 8,
        lastEpisodeToAir,
        episodesOnServer: 1,
      }),
      1
    );
  });

  it('never goes above the season total', () => {
    assert.strictEqual(
      getAiredEpisodeCount({
        seasonNumber: 3,
        totalEpisodes: 10,
        lastEpisodeToAir: { season_number: 3, episode_number: 12 },
        episodesOnServer: 11,
      }),
      10
    );
  });

  it('leaves the total alone without a regular last aired episode', () => {
    for (const last of [
      undefined,
      null,
      { season_number: 0, episode_number: 2 },
    ]) {
      assert.strictEqual(
        getAiredEpisodeCount({
          seasonNumber: 3,
          totalEpisodes: 10,
          lastEpisodeToAir: last,
          episodesOnServer: 0,
        }),
        10
      );
    }
  });

  it('leaves specials alone', () => {
    assert.strictEqual(
      getAiredEpisodeCount({
        seasonNumber: 0,
        totalEpisodes: 6,
        lastEpisodeToAir,
        episodesOnServer: 0,
      }),
      6
    );
  });
});
