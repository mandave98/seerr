import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddLibraryEpisodeCountToSeason1791158464547 implements MigrationInterface {
  name = 'AddLibraryEpisodeCountToSeason1791158464547';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "season" ADD "libraryEpisodeCount" integer`
    );
    await queryRunner.query(
      `ALTER TABLE "season" ADD "libraryEpisodeCount4k" integer`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "season" DROP COLUMN "libraryEpisodeCount4k"`
    );
    await queryRunner.query(
      `ALTER TABLE "season" DROP COLUMN "libraryEpisodeCount"`
    );
  }
}
