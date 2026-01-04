import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateSystemSettingsTable1767190704209 implements MigrationInterface {
    name = 'CreateSystemSettingsTable1767190704209'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "system_settings" (
                "id" SERIAL NOT NULL,
                "key" character varying NOT NULL,
                "value" text NOT NULL,
                "description" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_system_settings_key" UNIQUE ("key"),
                CONSTRAINT "PK_system_settings" PRIMARY KEY ("id")
            )
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "system_settings"`)
    }
}