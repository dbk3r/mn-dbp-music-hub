import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTwofaToCustomer1767190704209 implements MigrationInterface {
    name = 'AddTwofaToCustomer1767190704209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_email_has_account_unique"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_customer_deleted_at"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "company_name"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "first_name"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "last_name"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "has_account"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "updated_at"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "deleted_at"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "created_by"`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "twofa_pin" character varying`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "twofa_expires" bigint`);
        await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "customer_pkey"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "id" SERIAL NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customer" ADD CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "id"`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "id" text NOT NULL`);
        await queryRunner.query(`ALTER TABLE "customer" ADD CONSTRAINT "customer_pkey" PRIMARY KEY ("id")`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "twofa_expires"`);
        await queryRunner.query(`ALTER TABLE "customer" DROP COLUMN "twofa_pin"`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "created_by" text`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "deleted_at" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "has_account" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "phone" text`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "email" text`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "last_name" text`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "first_name" text`);
        await queryRunner.query(`ALTER TABLE "customer" ADD "company_name" text`);
        await queryRunner.query(`CREATE INDEX "IDX_customer_deleted_at" ON "customer" ("deleted_at") WHERE (deleted_at IS NULL)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_customer_email_has_account_unique" ON "customer" ("email", "has_account") WHERE (deleted_at IS NULL)`);
    }

}
