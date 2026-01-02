import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserAndMFA1767500000000 implements MigrationInterface {
  name = "AddUserAndMFA1767500000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR NOT NULL UNIQUE,
        "password_hash" VARCHAR NOT NULL,
        "display_name" VARCHAR,
        "avatar_url" VARCHAR,
        "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
        "mfa_secret" VARCHAR,
        "status" VARCHAR NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_user_email" ON "user" ("email")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_user_email"`)
    await queryRunner.query(`DROP TABLE "user"`)
  }
}
