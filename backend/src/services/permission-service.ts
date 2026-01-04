import { AppDataSource } from "../datasource/data-source"
import { Permission } from "../models/permission"

export class PermissionService {
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