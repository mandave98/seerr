import {
  getAiredEpisodeCount,
  getTvdbAiringEpisodes,
} from '@server/utils/airedEpisodes';
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

describe('getTvdbAiringEpisodes', () => {
  // VisionQuest's real schedule: a two-episode premiere, then weekly pairs
  const episode = (seasonNumber: number, number: number, aired: string) => ({
    id: seasonNumber * 100 + number,
    aired,
    number,
    seasonNumber,
    name: `S${seasonNumber}E${number}`,
    overview: '',
  });
  const episodes = [
    episode(1, 3, '2026-10-20'),
    episode(1, 1, '2026-10-13'),
    episode(1, 2, '2026-10-13'),
    episode(1, 4, '2026-10-20'),
    episode(0, 1, '2026-10-30'),
    episode(2, 1, ''),
  ];

  it('picks the latest aired and the next dated episode', () => {
    const { last_episode_to_air, next_episode_to_air } = getTvdbAiringEpisodes(
      episodes,
      213375,
      new Date('2026-10-14T01:45:00Z')
    );

    assert.deepStrictEqual(
      [last_episode_to_air?.season_number, last_episode_to_air?.episode_number],
      [1, 2]
    );
    assert.deepStrictEqual(
      [
        next_episode_to_air?.season_number,
        next_episode_to_air?.episode_number,
        next_episode_to_air?.air_date,
      ],
      [1, 3, '2026-10-20']
    );
    assert.strictEqual(last_episode_to_air?.show_id, 213375);
  });

  it('counts an episode as aired on its air date', () => {
    const { last_episode_to_air } = getTvdbAiringEpisodes(
      episodes,
      1,
      new Date('2026-10-20T00:00:00Z')
    );

    assert.strictEqual(last_episode_to_air?.episode_number, 4);
  });

  it('returns nothing before the premiere or without dates', () => {
    assert.deepStrictEqual(
      getTvdbAiringEpisodes(episodes, 1, new Date('2026-10-01T00:00:00Z'))
        .last_episode_to_air,
      undefined
    );
    assert.deepStrictEqual(getTvdbAiringEpisodes([episode(2, 1, '')], 1), {
      last_episode_to_air: undefined,
      next_episode_to_air: undefined,
    });
  });
});
