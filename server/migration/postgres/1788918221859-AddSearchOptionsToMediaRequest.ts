import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSearchOptionsToMediaRequest1788918221859 implements MigrationInterface {
  name = 'AddSearchOptionsToMediaRequest1788918221859';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD "searchForMissingEpisodes" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" ADD "searchForCutoffUnmetEpisodes" boolean NOT NULL DEFAULT true`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "searchForCutoffUnmetEpisodes"`
    );
    await queryRunner.query(
      `ALTER TABLE "media_request" DROP COLUMN "searchForMissingEpisodes"`
    );
  }
}
