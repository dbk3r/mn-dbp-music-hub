import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class ExtendAudioFileMetadata1767300000200
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = "audio_file";

    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) {
      // created by earlier migration; keep idempotent
      return;
    }

    const addIfMissing = async (column: TableColumn) => {
      const exists = await queryRunner.hasColumn(tableName, column.name);
      if (!exists) {
        await queryRunner.addColumn(tableName, column);
      }
    };

    await addIfMissing(
      new TableColumn({
        name: "title",
        type: "varchar",
        isNullable: false,
        default: "''",
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "artist",
        type: "varchar",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "description",
        type: "text",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "release_year",
        type: "int",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "duration_ms",
        type: "int",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "waveform_peaks",
        type: "jsonb",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = "audio_file";
    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) return;

    const dropIfExists = async (columnName: string) => {
      const exists = await queryRunner.hasColumn(tableName, columnName);
      if (exists) {
        await queryRunner.dropColumn(tableName, columnName);
      }
    };

    await dropIfExists("waveform_peaks");
    await dropIfExists("duration_ms");
    await dropIfExists("release_year");
    await dropIfExists("description");
    await dropIfExists("artist");
    await dropIfExists("title");
  }
}
