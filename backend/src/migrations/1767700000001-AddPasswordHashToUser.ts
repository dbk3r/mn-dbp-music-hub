import { MigrationInterface, QueryRunner } from "typeorm"

export class AddPasswordHashToUser1767700000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add columns directly with raw SQL to ensure they are added to the correct table
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS password_hash VARCHAR NOT NULL DEFAULT '',
      ADD COLUMN IF NOT EXISTS display_name VARCHAR NULL,
      ADD COLUMN IF NOT EXISTS mfa_enabled BOOLEAN NOT NULL DEFAULT false,
      ADD COLUMN IF NOT EXISTS mfa_secret VARCHAR NULL,
      ADD COLUMN IF NOT EXISTS status VARCHAR NOT NULL DEFAULT 'active';
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP COLUMN IF EXISTS password_hash,
      DROP COLUMN IF EXISTS display_name,
      DROP COLUMN IF EXISTS mfa_enabled,
      DROP COLUMN IF EXISTS mfa_secret,
      DROP COLUMN IF EXISTS status;
    `)
  }
}
