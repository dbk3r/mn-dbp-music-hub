import { MigrationInterface, QueryRunner } from "typeorm"

export class AddUserMfaPin1767909999000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "mfa_pin_hash" varchar`)
    await queryRunner.query(`ALTER TABLE "user" ADD COLUMN "mfa_pin_expires_at" timestamp`)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "mfa_pin_expires_at"`)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "mfa_pin_hash"`)
  }
}
