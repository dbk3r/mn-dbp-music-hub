import { AppDataSource } from "../datasource/data-source"
import { User } from "../models/user"
import { Role } from "../models/role"
import bcrypt from "bcrypt"
import { randomUUID } from "crypto"

async function createAdminUser() {
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize()
  }

  const email = "bk.pc@gmx.de"
  const password = "nulleins"
  const displayName = "Admin User"

  const userRepo = AppDataSource.getRepository(User)
  const roleRepo = AppDataSource.getRepository(Role)

  // Hash password
  const passwordHash = await bcrypt.hash(password, 10)

  // Get admin role
  const adminRole = await roleRepo.findOne({ where: { name: "admin" } } as any)
  if (!adminRole) {
    console.error("✗ Admin role not found. Please run migrations first.")
    process.exit(1)
  }

  // Check if user already exists
  const existingUser = await userRepo.findOne({ where: { email } } as any)
  if (existingUser) {
    console.log(`✓ User ${email} already exists, updating password...`)
    // Update password
    existingUser.passwordHash = passwordHash
    existingUser.isActive = true
    existingUser.status = "active"
    existingUser.roles = [adminRole]
    await userRepo.save(existingUser)
    console.log("✓ Admin user updated successfully!")
    process.exit(0)
  }

  // Create user with explicit ID
  const user = userRepo.create({
    id: `user_${randomUUID().replace(/-/g, "")}`,
    email,
    passwordHash,
    displayName,
    isActive: true,
    mfaEnabled: false,
    status: "active",
    roles: [adminRole]
  })

  await userRepo.save(user)

  console.log("✓ Admin user created successfully!")
  console.log(`  Email: ${email}`)
  console.log(`  Password: ${password}`)
  console.log(`  Status: Active`)
  console.log(`  Roles: Admin`)

  await AppDataSource.destroy()
  process.exit(0)
}

createAdminUser().catch(error => {
  console.error("✗ Error creating admin user:", error)
  process.exit(1)
})
