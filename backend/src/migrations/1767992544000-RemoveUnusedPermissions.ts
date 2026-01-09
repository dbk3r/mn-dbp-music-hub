import { MigrationInterface, QueryRunner } from "typeorm"

export class RemoveUnusedPermissions1767992544000 implements MigrationInterface {
  name = "RemoveUnusedPermissions1767992544000"

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Entferne role_permissions für products, downloads und licenses
    await queryRunner.query(`
      DELETE FROM role_permissions 
      WHERE permission_id IN (
        SELECT id FROM permission 
        WHERE resource IN ('products', 'downloads', 'licenses')
      )
    `)

    // Entferne products, downloads und licenses Permissions
    // Diese sind entweder nicht implementiert (products) oder redundant 
    // (downloads/licenses werden automatisch mit eigenen Bestellungen geladen)
    await queryRunner.query(`
      DELETE FROM permission 
      WHERE resource IN ('products', 'downloads', 'licenses')
    `)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Stelle Permissions wieder her
    await queryRunner.query(`
      INSERT INTO permission (resource, action, description) VALUES
      ('products', 'view', 'Produkte anzeigen'),
      ('products', 'create', 'Produkte erstellen'),
      ('products', 'edit', 'Produkte bearbeiten'),
      ('products', 'delete', 'Produkte löschen'),
      ('downloads', 'access', 'Heruntergeladene Inhalte zugreifen'),
      ('licenses', 'view_own', 'Eigene Lizenzen anzeigen')
      ON CONFLICT (resource, action) DO NOTHING
    `)

    // Stelle role_permissions für customer wieder her
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id 
      FROM role r, permission p 
      WHERE r.name = 'customer' 
        AND (
          (p.resource = 'downloads' AND p.action = 'access')
          OR (p.resource = 'licenses' AND p.action = 'view_own')
        )
      ON CONFLICT DO NOTHING
    `)

    // Stelle role_permissions für vendor wieder her
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id 
      FROM role r, permission p 
      WHERE r.name = 'vendor' 
        AND p.resource = 'products' 
        AND p.action IN ('view', 'create', 'edit')
      ON CONFLICT DO NOTHING
    `)

    // Stelle role_permissions für user wieder her
    await queryRunner.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id 
      FROM role r, permission p 
      WHERE r.name = 'user' 
        AND p.resource = 'products' 
        AND p.action = 'view'
      ON CONFLICT DO NOTHING
    `)
  }
}
