import { MigrationInterface, QueryRunner } from "typeorm"

export class AddRolesAndPermissions1767700000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Prüfe ob user.id integer oder text ist
    const userIdType = await queryRunner.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user' AND column_name = 'id'
    `)
    
    const idType = userIdType[0]?.data_type === 'integer' ? 'integer' : 'text'
    
    // User-Aktivierung hinzufügen
    await queryRunner.query(`
      ALTER TABLE "user" 
      ADD COLUMN IF NOT EXISTS "is_active" boolean DEFAULT false
    `)

    // Rollen-Tabelle
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role" (
        "id" SERIAL PRIMARY KEY,
        "name" varchar NOT NULL UNIQUE,
        "description" varchar,
        "created_at" timestamp DEFAULT now()
      )
    `)

    // Berechtigungen-Tabelle
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "permission" (
        "id" SERIAL PRIMARY KEY,
        "resource" varchar NOT NULL,
        "action" varchar NOT NULL,
        "description" varchar,
        UNIQUE("resource", "action")
      )
    `)

    // User-Rollen Verknüpfung mit dynamischem Typ
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "user_roles" (
        "user_id" ${idType} NOT NULL,
        "role_id" integer NOT NULL,
        PRIMARY KEY ("user_id", "role_id"),
        FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE,
        FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE
      )
    `)

    // Rollen-Berechtigungen Verknüpfung
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "role_permissions" (
        "role_id" integer NOT NULL,
        "permission_id" integer NOT NULL,
        PRIMARY KEY ("role_id", "permission_id"),
        FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE CASCADE,
        FOREIGN KEY ("permission_id") REFERENCES "permission"("id") ON DELETE CASCADE
      )
    `)

    // Standard-Rollen erstellen
    await queryRunner.query(`
      INSERT INTO "role" ("name", "description") VALUES
      ('admin', 'Vollzugriff auf alle Funktionen'),
      ('user', 'Standard-Benutzer mit eingeschränkten Rechten'),
      ('guest', 'Nur Lesezugriff')
      ON CONFLICT (name) DO NOTHING
    `)

    // Standard-Berechtigungen erstellen
    await queryRunner.query(`
      INSERT INTO "permission" ("resource", "action", "description") VALUES
      ('products', 'view', 'Produkte anzeigen'),
      ('products', 'create', 'Produkte erstellen'),
      ('products', 'edit', 'Produkte bearbeiten'),
      ('products', 'delete', 'Produkte löschen'),
      ('users', 'view', 'Benutzer anzeigen'),
      ('users', 'create', 'Benutzer erstellen'),
      ('users', 'edit', 'Benutzer bearbeiten'),
      ('users', 'delete', 'Benutzer löschen'),
      ('roles', 'view', 'Rollen anzeigen'),
      ('roles', 'manage', 'Rollen verwalten'),
      ('settings', 'view', 'Einstellungen anzeigen'),
      ('settings', 'edit', 'Einstellungen bearbeiten')
      ON CONFLICT (resource, action) DO NOTHING
    `)

    // Admin-Rolle bekommt alle Berechtigungen
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "role" r, "permission" p
      WHERE r.name = 'admin'
      ON CONFLICT DO NOTHING
    `)

    // User-Rolle bekommt Basis-Berechtigungen
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "role" r, "permission" p
      WHERE r.name = 'user' AND p.resource IN ('products') AND p.action = 'view'
      ON CONFLICT DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "role_permissions"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "user_roles"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "permission"`)
    await queryRunner.query(`DROP TABLE IF EXISTS "role"`)
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "is_active"`)
  }
}
