import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVendorPaidStatus1736510000000 implements MigrationInterface {
    name = 'AddVendorPaidStatus1736510000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD COLUMN "vendor_paid" boolean NOT NULL DEFAULT false,
            ADD COLUMN "vendor_paid_at" TIMESTAMP NULL,
            ADD COLUMN "vendor_paid_by" character varying NULL
        `);

        await queryRunner.query(`
            COMMENT ON COLUMN "orders"."vendor_paid" IS 'Indicates if vendor has been paid for this order';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "orders"."vendor_paid_at" IS 'Timestamp when vendor was marked as paid';
        `);
        await queryRunner.query(`
            COMMENT ON COLUMN "orders"."vendor_paid_by" IS 'Admin user ID who marked the vendor as paid';
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "orders"
            DROP COLUMN "vendor_paid",
            DROP COLUMN "vendor_paid_at",
            DROP COLUMN "vendor_paid_by"
        `);
    }
}
