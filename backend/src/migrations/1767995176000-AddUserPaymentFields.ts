import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserPaymentFields1767995400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS iban VARCHAR,
      ADD COLUMN IF NOT EXISTS bic VARCHAR,
      ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR,
      ADD COLUMN IF NOT EXISTS paypal_email VARCHAR,
      ADD COLUMN IF NOT EXISTS tax_number VARCHAR,
      ADD COLUMN IF NOT EXISTS vat_id VARCHAR
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "user" 
      DROP COLUMN IF EXISTS iban,
      DROP COLUMN IF EXISTS bic,
      DROP COLUMN IF EXISTS bank_account_holder,
      DROP COLUMN IF EXISTS paypal_email,
      DROP COLUMN IF EXISTS tax_number,
      DROP COLUMN IF EXISTS vat_id
    `)
  }
}
