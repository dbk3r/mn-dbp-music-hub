import { MigrationInterface, QueryRunner } from "typeorm"

export class AddCustomerVendorRoles1767988832000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Customer und Vendor Rollen hinzufügen
    await queryRunner.query(`
      INSERT INTO "role" ("name", "description") VALUES
      ('customer', 'Kunde mit Zugriff auf gekaufte Inhalte'),
      ('vendor', 'Verkäufer mit Zugriff auf Produktverwaltung')
      ON CONFLICT (name) DO NOTHING
    `)

    // Berechtigungen für Customer-Rolle (kann eigene Bestellungen sehen)
    await queryRunner.query(`
      INSERT INTO "permission" ("resource", "action", "description") VALUES
      ('orders', 'view_own', 'Eigene Bestellungen anzeigen'),
      ('downloads', 'access', 'Heruntergeladene Inhalte zugreifen'),
      ('licenses', 'view_own', 'Eigene Lizenzen anzeigen')
      ON CONFLICT (resource, action) DO NOTHING
    `)

    // Customer-Rolle bekommt Basis-Berechtigungen
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "role" r, "permission" p
      WHERE r.name = 'customer' 
        AND (
          (p.resource = 'products' AND p.action = 'view')
          OR (p.resource = 'orders' AND p.action = 'view_own')
          OR (p.resource = 'downloads' AND p.action = 'access')
          OR (p.resource = 'licenses' AND p.action = 'view_own')
        )
      ON CONFLICT DO NOTHING
    `)

    // Berechtigungen für Vendor-Rolle
    await queryRunner.query(`
      INSERT INTO "permission" ("resource", "action", "description") VALUES
      ('audio', 'create', 'Audio-Dateien erstellen'),
      ('audio', 'edit', 'Audio-Dateien bearbeiten'),
      ('audio', 'view_own', 'Eigene Audio-Dateien anzeigen'),
      ('audio', 'view_all', 'Alle Audio-Dateien anzeigen')
      ON CONFLICT (resource, action) DO NOTHING
    `)

    // Vendor-Rolle bekommt erweiterte Berechtigungen
    await queryRunner.query(`
      INSERT INTO "role_permissions" ("role_id", "permission_id")
      SELECT r.id, p.id
      FROM "role" r, "permission" p
      WHERE r.name = 'vendor' 
        AND (
          (p.resource = 'products' AND p.action IN ('view', 'create', 'edit'))
          OR (p.resource = 'audio' AND p.action IN ('view_own', 'create', 'edit'))
          OR (p.resource = 'orders' AND p.action = 'view_own')
        )
      ON CONFLICT DO NOTHING
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Berechtigungen entfernen
    await queryRunner.query(`
      DELETE FROM "role_permissions" 
      WHERE "role_id" IN (
        SELECT id FROM "role" WHERE name IN ('customer', 'vendor')
      )
    `)

    // Rollen entfernen
    await queryRunner.query(`
      DELETE FROM "role" WHERE name IN ('customer', 'vendor')
    `)

    // Berechtigungen entfernen (optional, falls sie nur für diese Rollen verwendet wurden)
    await queryRunner.query(`
      DELETE FROM "permission" 
      WHERE (resource = 'orders' AND action = 'view_own')
         OR (resource = 'downloads' AND action = 'access')
         OR (resource = 'licenses' AND action = 'view_own')
         OR (resource = 'audio' AND action IN ('create', 'edit', 'view_all'))
    `)
  }
}
