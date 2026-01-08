import { MigrationInterface, QueryRunner } from "typeorm"

export class AddAudioVariantTables1736352000000 implements MigrationInterface {
  name = "AddAudioVariantTables1736352000000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Drop existing tables if they exist (in case of previous failed migration)
    await queryRunner.query(`DROP TABLE IF EXISTS "audio_variant_file" CASCADE`)
    await queryRunner.query(`DROP TABLE IF EXISTS "audio_variant" CASCADE`)

    // Create audio_variant table
    await queryRunner.query(`
      CREATE TABLE "audio_variant" (
        "id" SERIAL PRIMARY KEY,
        "audio_file_id" INTEGER NOT NULL,
        "license_model_id" INTEGER NOT NULL,
        "name" VARCHAR NOT NULL,
        "price_cents" INTEGER NOT NULL DEFAULT 0,
        "status" VARCHAR NOT NULL DEFAULT 'active',
        "description" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Create indexes for audio_variant
    await queryRunner.query(`
      CREATE INDEX "idx_audio_variant_audio_file" ON "audio_variant" ("audio_file_id")
    `)

    await queryRunner.query(`
      CREATE INDEX "idx_audio_variant_license_model" ON "audio_variant" ("license_model_id")
    `)

    // Create audio_variant_file table
    await queryRunner.query(`
      CREATE TABLE "audio_variant_file" (
        "id" SERIAL PRIMARY KEY,
        "audio_variant_id" INTEGER NOT NULL,
        "original_name" VARCHAR NOT NULL,
        "filename" VARCHAR NOT NULL,
        "mime_type" VARCHAR NOT NULL,
        "size" INTEGER NOT NULL,
        "description" TEXT,
        "created_at" TIMESTAMP NOT NULL DEFAULT now()
      )
    `)

    // Create index for audio_variant_file
    await queryRunner.query(`
      CREATE INDEX "idx_audio_variant_file_variant" ON "audio_variant_file" ("audio_variant_id")
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audio_variant_file_variant"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audio_variant_license_model"`)
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_audio_variant_audio_file"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "audio_variant_file"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "audio_variant"`)
  }
}
