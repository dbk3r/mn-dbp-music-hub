import { AppDataSource } from "../datasource/data-source"
import { User } from "../models/user"
import { Role } from "../models/role"
import bcrypt from "bcrypt"
import { randomUUID } from "crypto"

export default class CustomerService {
  private async ensureInitialized() {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize()
    }
  }

  async retrieveByEmail(email: string) {
    await this.ensureInitialized()
    const userRepo = AppDataSource.getRepository(User)
    return await userRepo.findOne({ where: { email } } as any)
  }

  async validatePassword(userId: any, password: string) {
    await this.ensureInitialized()
    const userRepo = AppDataSource.getRepository(User)
    const user = await userRepo.findOne({ where: { id: userId } } as any)
    if (!user) return false
    if (!user.passwordHash) return false
    return await bcrypt.compare(password, user.passwordHash)
  }

  async create(input: { email: string, password: string, first_name?: string | null, last_name?: string | null, isActive?: boolean }) {
    await this.ensureInitialized()
    const userRepo = AppDataSource.getRepository(User)
    const roleRepo = AppDataSource.getRepository(Role)

    const existing = await userRepo.findOne({ where: { email: input.email } } as any)
    if (existing) throw new Error("User with that email already exists")

    const hash = await bcrypt.hash(input.password, 10)
    const displayName = [input.first_name || null, input.last_name || null].filter(Boolean).join(" ") || null

    // find default customer role
    const customerRole = await roleRepo.findOne({ where: { name: "customer" } } as any)
    const roles = customerRole ? [customerRole] : []

    const id = `user_${randomUUID().replace(/-/g, "")}`
    const user = userRepo.create({
      id,
      email: input.email,
      passwordHash: hash,
      displayName,
      isActive: typeof input.isActive === 'boolean' ? input.isActive : true,
      roles
    } as any)

    return await userRepo.save(user)
  }

  async update(id: any, updates: any) {
    await this.ensureInitialized()
    const userRepo = AppDataSource.getRepository(User)
    const user = await userRepo.findOne({ where: { id } } as any)
    if (!user) throw new Error("User not found")

    // map possible fields used by existing routes
    if (updates.twofa_pin !== undefined) user.twofa_pin = updates.twofa_pin
    if (updates.twofa_expires !== undefined) user.twofa_expires = updates.twofa_expires
    if (updates.mfaPinHash !== undefined) user.mfaPinHash = updates.mfaPinHash
    if (updates.mfaPinExpiresAt !== undefined) user.mfaPinExpiresAt = updates.mfaPinExpiresAt
    if (updates.password !== undefined) user.passwordHash = await bcrypt.hash(updates.password, 10)
    if (updates.displayName !== undefined) user.displayName = updates.displayName
    if (updates.isActive !== undefined) user.isActive = updates.isActive

    return await userRepo.save(user)
  }
}
