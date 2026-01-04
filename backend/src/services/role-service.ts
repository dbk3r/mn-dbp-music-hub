import { AppDataSource } from "../datasource/data-source"
import { Role } from "../models/role"
import { Permission } from "../models/permission"

export class RoleService {
  async getAllRoles() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const roleRepo = AppDataSource.getRepository(Role)
    return await roleRepo.find({
      relations: ["permissions"],
      order: { name: "ASC" }
    })
  }

  async getRoleById(id: number) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const roleRepo = AppDataSource.getRepository(Role)
    return await roleRepo.findOne({
      where: { id },
      relations: ["permissions"]
    } as any)
  }

  async createRole(name: string, description: string, permissionIds: string[]) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const roleRepo = AppDataSource.getRepository(Role)
    const permissionRepo = AppDataSource.getRepository(Permission)

    // Check if role already exists
    const existingRole = await roleRepo.findOne({ where: { name } } as any)
    if (existingRole) {
      throw new Error("Rolle existiert bereits")
    }

    // Get permissions
    const permissions: Permission[] = []
    if (permissionIds && permissionIds.length > 0) {
      for (const permId of permissionIds) {
        const permission = await permissionRepo.findOne({ where: { id: parseInt(permId) } } as any)
        if (permission) {
          permissions.push(permission)
        }
      }
    }

    // Create role
    const role = roleRepo.create({
      name,
      description: description || "",
      permissions
    })

    return await roleRepo.save(role)
  }

  async updateRole(id: number, name?: string, description?: string, permissionIds?: string[]) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const roleRepo = AppDataSource.getRepository(Role)
    const permissionRepo = AppDataSource.getRepository(Permission)

    // Find role
    const role = await roleRepo.findOne({
      where: { id },
      relations: ["permissions"]
    } as any)

    if (!role) {
      throw new Error("Rolle nicht gefunden")
    }

    // Update basic fields
    if (name !== undefined) role.name = name
    if (description !== undefined) role.description = description

    // Update permissions if provided
    if (permissionIds !== undefined) {
      const permissions: Permission[] = []
      for (const permId of permissionIds) {
        const permission = await permissionRepo.findOne({ where: { id: parseInt(permId) } } as any)
        if (permission) {
          permissions.push(permission)
        }
      }
      role.permissions = permissions
    }

    return await roleRepo.save(role)
  }

  async deleteRole(id: number) {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const roleRepo = AppDataSource.getRepository(Role)

    // Find role
    const role = await roleRepo.findOne({ where: { id } } as any)
    if (!role) {
      throw new Error("Rolle nicht gefunden")
    }

    // Don't allow deletion of admin role
    if (role.name === "admin") {
      throw new Error("Admin-Rolle kann nicht gelöscht werden")
    }

    await roleRepo.remove(role)
  }

  async getAllPermissions() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }

    const permissionRepo = AppDataSource.getRepository(Permission)
    return await permissionRepo.find({
      order: { resource: "ASC", action: "ASC" }
    })
  }
}