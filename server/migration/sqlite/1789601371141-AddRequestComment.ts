import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestComment1789601371141 implements MigrationInterface {
  name = 'AddRequestComment1789601371141';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "request_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "userId" integer, "requestId" integer)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5eb3ed44ab6707a1a19397293" ON "request_comment" ("userId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5f72e88a2d565ca0219021cbd" ON "request_comment" ("requestId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_e5eb3ed44ab6707a1a19397293"`);
    await queryRunner.query(`DROP INDEX "IDX_b5f72e88a2d565ca0219021cbd"`);
    await queryRunner.query(
      `CREATE TABLE "temporary_request_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "userId" integer, "requestId" integer, CONSTRAINT "FK_e5eb3ed44ab6707a1a193972936" FOREIGN KEY ("userId") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE NO ACTION, CONSTRAINT "FK_b5f72e88a2d565ca0219021cbdf" FOREIGN KEY ("requestId") REFERENCES "media_request" ("id") ON DELETE CASCADE ON UPDATE NO ACTION)`
    );
    await queryRunner.query(
      `INSERT INTO "temporary_request_comment"("id", "message", "createdAt", "updatedAt", "userId", "requestId") SELECT "id", "message", "createdAt", "updatedAt", "userId", "requestId" FROM "request_comment"`
    );
    await queryRunner.query(`DROP TABLE "request_comment"`);
    await queryRunner.query(
      `ALTER TABLE "temporary_request_comment" RENAME TO "request_comment"`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5eb3ed44ab6707a1a19397293" ON "request_comment" ("userId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5f72e88a2d565ca0219021cbd" ON "request_comment" ("requestId") `
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_b5f72e88a2d565ca0219021cbd"`);
    await queryRunner.query(`DROP INDEX "IDX_e5eb3ed44ab6707a1a19397293"`);
    await queryRunner.query(
      `ALTER TABLE "request_comment" RENAME TO "temporary_request_comment"`
    );
    await queryRunner.query(
      `CREATE TABLE "request_comment" ("id" integer PRIMARY KEY AUTOINCREMENT NOT NULL, "message" text NOT NULL, "createdAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "updatedAt" datetime NOT NULL DEFAULT (CURRENT_TIMESTAMP), "userId" integer, "requestId" integer)`
    );
    await queryRunner.query(
      `INSERT INTO "request_comment"("id", "message", "createdAt", "updatedAt", "userId", "requestId") SELECT "id", "message", "createdAt", "updatedAt", "userId", "requestId" FROM "temporary_request_comment"`
    );
    await queryRunner.query(`DROP TABLE "temporary_request_comment"`);
    await queryRunner.query(
      `CREATE INDEX "IDX_b5f72e88a2d565ca0219021cbd" ON "request_comment" ("requestId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5eb3ed44ab6707a1a19397293" ON "request_comment" ("userId") `
    );
    await queryRunner.query(`DROP INDEX "IDX_b5f72e88a2d565ca0219021cbd"`);
    await queryRunner.query(`DROP INDEX "IDX_e5eb3ed44ab6707a1a19397293"`);
    await queryRunner.query(`DROP TABLE "request_comment"`);
  }
}
