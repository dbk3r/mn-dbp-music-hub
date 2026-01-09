import { MigrationInterface, QueryRunner } from "typeorm"

export class AddLicenseNumber1736338800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE public.orders
        ADD COLUMN IF NOT EXISTS license_number VARCHAR(50) UNIQUE;
      END IF;
      END
      $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE orders
      DROP COLUMN IF EXISTS license_number
    `)
  }
}