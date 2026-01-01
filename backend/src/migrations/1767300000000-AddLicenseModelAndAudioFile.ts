import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class AddLicenseModelAndAudioFile1767300000000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const hasLicenseModel = await queryRunner.hasTable("license_model");
    if (!hasLicenseModel) {
      await queryRunner.createTable(
        new Table({
          name: "license_model",
          columns: [
            {
              name: "id",
              type: "int",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            { name: "name", type: "varchar", isNullable: false },
          ],
        })
      );
    }

    const hasAudioFile = await queryRunner.hasTable("audio_file");
    if (!hasAudioFile) {
      await queryRunner.createTable(
        new Table({
          name: "audio_file",
          columns: [
            {
              name: "id",
              type: "int",
              isPrimary: true,
              isGenerated: true,
              generationStrategy: "increment",
            },
            { name: "original_name", type: "varchar", isNullable: false },
            { name: "filename", type: "varchar", isNullable: false },
            { name: "mime_type", type: "varchar", isNullable: false },
            { name: "size", type: "int", isNullable: false },
            {
              name: "created_at",
              type: "timestamptz",
              default: "now()",
            },
          ],
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const hasAudioFile = await queryRunner.hasTable("audio_file");
    if (hasAudioFile) {
      await queryRunner.dropTable("audio_file");
    }

    const hasLicenseModel = await queryRunner.hasTable("license_model");
    if (hasLicenseModel) {
      await queryRunner.dropTable("license_model");
    }
  }
}
