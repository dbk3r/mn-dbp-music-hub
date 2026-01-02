import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddAudioProductFields1767300000400 implements MigrationInterface {
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
        name: "category_id",
        type: "int",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "tag_ids",
        type: "jsonb",
        isNullable: true,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "license_model_ids",
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

    await dropIfExists("license_model_ids");
    await dropIfExists("tag_ids");
    await dropIfExists("category_id");
  }
}
