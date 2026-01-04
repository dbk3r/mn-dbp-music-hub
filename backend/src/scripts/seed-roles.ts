import { AppDataSource } from "../datasource/data-source"
import { Role } from "../models/role"
import { Permission } from "../models/permission"

async function seedRolesAndPermissions() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const roleRepo = AppDataSource.getRepository(Role)
  const permissionRepo = AppDataSource.getRepository(Permission)

  console.log("🌱 Seeding roles and permissions...")

  // Define permissions
  const permissions = [
    // Product management
    { resource: "products", action: "view", description: "Produkte anzeigen" },
    { resource: "products", action: "create", description: "Produkte erstellen" },
    { resource: "products", action: "edit", description: "Produkte bearbeiten" },
    { resource: "products", action: "delete", description: "Produkte löschen" },

    // Audio file management
    { resource: "audio", action: "view", description: "Audio-Dateien anzeigen" },
    { resource: "audio", action: "create", description: "Audio-Dateien erstellen" },
    { resource: "audio", action: "edit", description: "Audio-Dateien bearbeiten" },
    { resource: "audio", action: "delete", description: "Audio-Dateien löschen" },

    // License model management
    { resource: "license-models", action: "view", description: "Lizenzmodelle anzeigen" },
    { resource: "license-models", action: "create", description: "Lizenzmodelle erstellen" },
    { resource: "license-models", action: "edit", description: "Lizenzmodelle bearbeiten" },
    { resource: "license-models", action: "delete", description: "Lizenzmodelle löschen" },

    // Category management
    { resource: "categories", action: "view", description: "Kategorien anzeigen" },
    { resource: "categories", action: "create", description: "Kategorien erstellen" },
    { resource: "categories", action: "edit", description: "Kategorien bearbeiten" },
    { resource: "categories", action: "delete", description: "Kategorien löschen" },

    // Tag management
    { resource: "tags", action: "view", description: "Tags anzeigen" },
    { resource: "tags", action: "create", description: "Tags erstellen" },
    { resource: "tags", action: "edit", description: "Tags bearbeiten" },
    { resource: "tags", action: "delete", description: "Tags löschen" },

    // User management
    { resource: "users", action: "view", description: "Benutzer anzeigen" },
    { resource: "users", action: "create", description: "Benutzer erstellen" },
    { resource: "users", action: "edit", description: "Benutzer bearbeiten" },
    { resource: "users", action: "delete", description: "Benutzer löschen" },

    // Role management
    { resource: "roles", action: "view", description: "Rollen anzeigen" },
    { resource: "roles", action: "create", description: "Rollen erstellen" },
    { resource: "roles", action: "edit", description: "Rollen bearbeiten" },
    { resource: "roles", action: "delete", description: "Rollen löschen" },

    // Settings management
    { resource: "settings", action: "view", description: "Einstellungen anzeigen" },
    { resource: "settings", action: "edit", description: "Einstellungen bearbeiten" },

    // Admin management
    { resource: "admin", action: "manage", description: "Administrative Aufgaben" },
  ]

  // Create permissions
  for (const perm of permissions) {
    let permission = await permissionRepo.findOne({
      where: { resource: perm.resource, action: perm.action }
    } as any)

    if (!permission) {
      permission = permissionRepo.create(perm)
      await permissionRepo.save(permission)
      console.log(`✓ Created permission: ${perm.resource}:${perm.action}`)
    } else {
      console.log(`✓ Permission already exists: ${perm.resource}:${perm.action}`)
    }
  }

  // Define roles
  const roles = [
    {
      name: "admin",
      description: "Administrator mit vollem Zugriff",
      permissions: [
        "products:view", "products:create", "products:edit", "products:delete",
        "audio:view", "audio:create", "audio:edit", "audio:delete",
        "license-models:view", "license-models:create", "license-models:edit", "license-models:delete",
        "categories:view", "categories:create", "categories:edit", "categories:delete",
        "tags:view", "tags:create", "tags:edit", "tags:delete",
        "users:view", "users:create", "users:edit", "users:delete",
        "roles:view", "roles:create", "roles:edit", "roles:delete",
        "settings:view", "settings:edit",
        "admin:manage"
      ]
    },
    {
      name: "editor",
      description: "Editor mit Bearbeitungsrechten",
      permissions: [
        "products:view", "products:create", "products:edit",
        "audio:view", "audio:create", "audio:edit",
        "license-models:view", "license-models:create", "license-models:edit",
        "categories:view", "categories:create", "categories:edit",
        "tags:view", "tags:create", "tags:edit",
        "users:view", "users:create", "users:edit",
        "settings:view", "settings:edit"
      ]
    },
    {
      name: "viewer",
      description: "Betrachter mit Lesezugriff",
      permissions: [
        "products:view", "audio:view", "license-models:view",
        "categories:view", "tags:view", "users:view",
        "roles:view", "settings:view"
      ]
    }
  ]

  // Create roles with permissions
  for (const roleData of roles) {
    let role = await roleRepo.findOne({ where: { name: roleData.name } } as any)

    if (!role) {
      // Get permission entities
      const permissionEntities: Permission[] = []
      for (const permString of roleData.permissions) {
        const [resource, action] = permString.split(':')
        const permission = await permissionRepo.findOne({
          where: { resource, action }
        } as any)
        if (permission) {
          permissionEntities.push(permission)
        }
      }

      role = roleRepo.create({
        name: roleData.name,
        description: roleData.description,
        permissions: permissionEntities
      })

      await roleRepo.save(role)
      console.log(`✓ Created role: ${roleData.name}`)
    } else {
      console.log(`✓ Role already exists: ${roleData.name}`)
    }
  }

  console.log("✅ Roles and permissions seeded successfully!")
  await AppDataSource.destroy()
}

seedRolesAndPermissions().catch(error => {
  console.error("❌ Error seeding roles and permissions:", error)
  process.exit(1)
})