import { MigrationInterface, QueryRunner } from "typeorm"

export class AddTwofaColumns20260107000000 implements MigrationInterface {
  name = 'AddTwofaColumns20260107000000'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "twofa_pin" character varying`)
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "twofa_expires" bigint`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "twofa_expires"`)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "twofa_pin"`)
  }
}
