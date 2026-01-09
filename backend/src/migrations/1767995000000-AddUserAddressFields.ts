import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserAddressFields1767995000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR,
      ADD COLUMN IF NOT EXISTS last_name VARCHAR,
      ADD COLUMN IF NOT EXISTS phone VARCHAR,
      ADD COLUMN IF NOT EXISTS address_1 VARCHAR,
      ADD COLUMN IF NOT EXISTS address_2 VARCHAR,
      ADD COLUMN IF NOT EXISTS city VARCHAR,
      ADD COLUMN IF NOT EXISTS postal_code VARCHAR,
      ADD COLUMN IF NOT EXISTS country_code VARCHAR(2)
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP COLUMN IF EXISTS first_name,
      DROP COLUMN IF EXISTS last_name,
      DROP COLUMN IF EXISTS phone,
      DROP COLUMN IF EXISTS address_1,
      DROP COLUMN IF EXISTS address_2,
      DROP COLUMN IF EXISTS city,
      DROP COLUMN IF EXISTS postal_code,
      DROP COLUMN IF EXISTS country_code
    `)
  }
}
