import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAudioCoverImage1767300000300 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = "audio_file";

    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) return;

    const addIfMissing = async (column: TableColumn) => {
      const exists = await queryRunner.hasColumn(tableName, column.name);
      if (!exists) {
        await queryRunner.addColumn(tableName, column);
      }
    };

    await addIfMissing(
      new TableColumn({
        name: "cover_original_name",
        type: "varchar",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "cover_filename",
        type: "varchar",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "cover_mime_type",
        type: "varchar",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "cover_size",
        type: "int",
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

    await dropIfExists("cover_size");
    await dropIfExists("cover_mime_type");
    await dropIfExists("cover_filename");
    await dropIfExists("cover_original_name");
  }
}
