import { MigrationInterface, QueryRunner } from "typeorm"

export class DropProductVariantTables1736353000000 implements MigrationInterface {
  name = "DropProductVariantTables1736353000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop old product variant tables
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variant_file" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variant" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "product" CASCADE`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cannot restore dropped tables without data
    console.log("Cannot restore product/variant tables - migration is irreversible")
  }
}
