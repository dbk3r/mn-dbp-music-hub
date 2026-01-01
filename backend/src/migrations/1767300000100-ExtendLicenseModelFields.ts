import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class ExtendLicenseModelFields1767300000100
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const tableName = "license_model";

    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) {
      // table is created by the initial migration; keep this migration idempotent
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
        name: "icon",
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
        name: "price_cents",
        type: "int",
        isNullable: false,
        default: 0,
      })
    );

    await addIfMissing(
      new TableColumn({
        name: "legal_description",
        type: "text",
        isNullable: true,
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const tableName = "license_model";
    const hasTable = await queryRunner.hasTable(tableName);
    if (!hasTable) return;

    const dropIfExists = async (columnName: string) => {
      const exists = await queryRunner.hasColumn(tableName, columnName);
      if (exists) {
        await queryRunner.dropColumn(tableName, columnName);
      }
    };

    await dropIfExists("legal_description");
    await dropIfExists("price_cents");
    await dropIfExists("description");
    await dropIfExists("icon");
  }
}
