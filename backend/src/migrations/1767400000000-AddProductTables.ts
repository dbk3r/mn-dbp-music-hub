import { MigrationInterface, QueryRunner } from "typeorm"

export class AddProductTables1767400000000 implements MigrationInterface {
  name = "AddProductTables1767400000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product" (
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
      ALTER TABLE "product"
        ADD COLUMN IF NOT EXISTS "audio_file_id" INT,
        ADD COLUMN IF NOT EXISTS "title" VARCHAR,
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "status" VARCHAR,
        ADD COLUMN IF NOT EXISTS "category_id" INT,
        ADD COLUMN IF NOT EXISTS "tag_ids" JSONB,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP DEFAULT NOW()
    `)

    await queryRunner.query(`
      ALTER TABLE "product"
        ALTER COLUMN "status" SET DEFAULT 'draft'
    `)

    await queryRunner.query(`
      ALTER TABLE "product"
        ALTER COLUMN "created_at" SET DEFAULT NOW()
    `)

    await queryRunner.query(`
      ALTER TABLE "product"
        ALTER COLUMN "updated_at" SET DEFAULT NOW()
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "product_variant" (
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
      ALTER TABLE "product_variant"
        ADD COLUMN IF NOT EXISTS "product_id" INT,
        ADD COLUMN IF NOT EXISTS "license_model_id" INT,
        ADD COLUMN IF NOT EXISTS "name" VARCHAR,
        ADD COLUMN IF NOT EXISTS "price_cents" INT,
        ADD COLUMN IF NOT EXISTS "status" VARCHAR,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()
    `)

    await queryRunner.query(`
      ALTER TABLE "product_variant"
        ALTER COLUMN "status" SET DEFAULT 'active'
    `)

    await queryRunner.query(`
      ALTER TABLE "product_variant"
        ALTER COLUMN "price_cents" SET DEFAULT 0
    `)

    await queryRunner.query(`
      ALTER TABLE "product_variant"
        ALTER COLUMN "created_at" SET DEFAULT NOW()
    `)

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "variant_file" (
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
      ALTER TABLE "variant_file"
        ADD COLUMN IF NOT EXISTS "variant_id" INT,
        ADD COLUMN IF NOT EXISTS "original_name" VARCHAR,
        ADD COLUMN IF NOT EXISTS "filename" VARCHAR,
        ADD COLUMN IF NOT EXISTS "mime_type" VARCHAR,
        ADD COLUMN IF NOT EXISTS "size" INT,
        ADD COLUMN IF NOT EXISTS "description" TEXT,
        ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP DEFAULT NOW()
    `)

    await queryRunner.query(`
      ALTER TABLE "variant_file"
        ALTER COLUMN "created_at" SET DEFAULT NOW()
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_audio_file" ON "product" ("audio_file_id")
    `)

    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "uq_product_audio_file" ON "product" ("audio_file_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_product_variant_product" ON "product_variant" ("product_id")
    `)

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_variant_file_variant" ON "variant_file" ("variant_id")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_variant_file_variant"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_variant_product"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_product_audio_file"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_product_audio_file"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "variant_file"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "product_variant"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "product"`)
  }
}
