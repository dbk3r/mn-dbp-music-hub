import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUploadedByToAudioFile1767991000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // uploaded_by Spalte zur audio_file Tabelle hinzufügen
    await queryRunner.query(`
      ALTER TABLE audio_file
      ADD COLUMN IF NOT EXISTS uploaded_by VARCHAR NULL
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE audio_file
      DROP COLUMN IF EXISTS uploaded_by
    `)
  }
}
