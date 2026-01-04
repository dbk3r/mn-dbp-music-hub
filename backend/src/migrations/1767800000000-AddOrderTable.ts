import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderTable1767800000000 implements MigrationInterface {
    name = 'AddOrderTable1767800000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Ensure customer with ID 1 exists
        await queryRunner.query(`
            INSERT INTO customer (id) VALUES (1) ON CONFLICT (id) DO NOTHING
        `);

        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" SERIAL NOT NULL,
                "customerId" character varying NOT NULL,
                "status" character varying(50) NOT NULL DEFAULT 'pending',
                "totalPriceCents" integer NOT NULL,
                "currencyCode" character varying(3) NOT NULL DEFAULT 'EUR',
                "items" jsonb NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_4c88e956195bba85977da21b8f4" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            ALTER TABLE "orders"
            ADD CONSTRAINT "FK_4c88e956195bba85977da21b8f4"
            FOREIGN KEY ("customerId") REFERENCES "customer"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "orders" DROP CONSTRAINT "FK_4c88e956195bba85977da21b8f4"`);
        await queryRunner.query(`DROP TABLE "orders"`);
    }

}