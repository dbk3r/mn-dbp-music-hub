import { MigrationInterface, QueryRunner } from "typeorm"

export class AddAudioProductTables1767600000001 implements MigrationInterface {
  name = "AddAudioProductTables1767600000001"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audio_product" (
        "id" SERIAL PRIMARY KEY,
        "audio_file_id" INT NOT NULL UNIQUE,
        "title" VARCHAR NOT NULL,
        "description" TEXT,
        "status" VARCHAR NOT NULL DEFAULT 'draft',
        "category_id" INT,
        "tag_ids" JSONB,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audio_product_variant" (
        "id" SERIAL PRIMARY KEY,
        "product_id" INT NOT NULL,
        "license_model_id" INT NOT NULL,
        "name" VARCHAR NOT NULL,
        "price_cents" INT NOT NULL DEFAULT 0,
        "status" VARCHAR NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "audio_variant_file" (
        "id" SERIAL PRIMARY KEY,
        "variant_id" INT NOT NULL,
        "original_name" VARCHAR NOT NULL,
        "filename" VARCHAR NOT NULL,
        "mime_type" VARCHAR NOT NULL,
        "size" INT NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_audio_product_audio_file" ON "audio_product" ("audio_file_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_audio_product_variant_product" ON "audio_product_variant" ("product_id")
    `)

    await queryRunner.query(`
	DO $$
  BEGIN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'audio_variant_file' AND column_name = 'variant_id'
    ) THEN
      CREATE INDEX IF NOT EXISTS "idx_audio_variant_file_variant"
      ON "audio_variant_file" ("variant_id");
    END IF;
  END
  $$;
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audio_variant_file_variant"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audio_product_variant_product"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_audio_product_audio_file"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "audio_variant_file"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "audio_product_variant"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "audio_product"`)
  }
}