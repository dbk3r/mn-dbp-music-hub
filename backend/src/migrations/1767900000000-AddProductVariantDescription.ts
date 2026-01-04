import { MigrationInterface, QueryRunner } from "typeorm"

export class AddProductVariantDescription1767900000000 implements MigrationInterface {
  name = "AddProductVariantDescription1767900000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audio_product_variant" ADD COLUMN IF NOT EXISTS "description" TEXT`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audio_product_variant" DROP COLUMN IF EXISTS "description"`)
  }
}
