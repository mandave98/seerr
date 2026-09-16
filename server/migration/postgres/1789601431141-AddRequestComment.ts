import type { MigrationInterface, QueryRunner } from 'typeorm';

export class AddRequestComment1789601431141 implements MigrationInterface {
  name = 'AddRequestComment1789601431141';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "request_comment" ("id" SERIAL NOT NULL, "message" text NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "userId" integer, "requestId" integer, CONSTRAINT "PK_e70581a6db974f1a5fe24b9df31" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_e5eb3ed44ab6707a1a19397293" ON "request_comment" ("userId") `
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_b5f72e88a2d565ca0219021cbd" ON "request_comment" ("requestId") `
    );
    await queryRunner.query(
      `ALTER TABLE "request_comment" ADD CONSTRAINT "FK_e5eb3ed44ab6707a1a193972936" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "request_comment" ADD CONSTRAINT "FK_b5f72e88a2d565ca0219021cbdf" FOREIGN KEY ("requestId") REFERENCES "media_request"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "request_comment" DROP CONSTRAINT "FK_b5f72e88a2d565ca0219021cbdf"`
    );
    await queryRunner.query(
      `ALTER TABLE "request_comment" DROP CONSTRAINT "FK_e5eb3ed44ab6707a1a193972936"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_b5f72e88a2d565ca0219021cbd"`
    );
    await queryRunner.query(
      `DROP INDEX "public"."IDX_e5eb3ed44ab6707a1a19397293"`
    );
    await queryRunner.query(`DROP TABLE "request_comment"`);
  }
}
