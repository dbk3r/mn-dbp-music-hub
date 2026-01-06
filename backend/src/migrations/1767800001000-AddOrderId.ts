import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderId1767800001000 implements MigrationInterface {
  name = 'AddOrderId1767800001000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE SEQUENCE IF NOT EXISTS orders_seq`);
    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS order_id varchar`);
    await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_id ON "orders"(order_id)`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS idx_orders_order_id`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS order_id`);
    await queryRunner.query(`DROP SEQUENCE IF EXISTS orders_seq`);
  }
}
