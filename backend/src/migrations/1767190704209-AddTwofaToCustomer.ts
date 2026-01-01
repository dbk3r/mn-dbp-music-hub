import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwofaToCustomer1767190704209 implements MigrationInterface {
    name = 'AddTwofaToCustomer1767190704209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Safe migration for Medusa's existing customer table: add columns if missing.
        await queryRunner.query(`ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "twofa_pin" character varying`);
        await queryRunner.query(`ALTER TABLE "customer" ADD COLUMN IF NOT EXISTS "twofa_expires" bigint`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN IF EXISTS "twofa_expires"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN IF EXISTS "twofa_pin"`);
    }

}
