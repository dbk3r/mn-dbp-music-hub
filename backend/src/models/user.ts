import { Entity, PrimaryColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToMany, JoinTable, Generated } from "typeorm"
import { Role } from "./role"

@Entity({ name: "user" })
export class User {
  @PrimaryColumn({ type: "text" })
  @Generated("uuid")
  id: string

  @Column({ type: "varchar", unique: true })
  email: string

  @Column({ name: "password_hash", type: "varchar" })
  passwordHash: string

  @Column({ name: "display_name", type: "varchar", nullable: true })
  displayName: string | null

  @Column({ name: "avatar_url", type: "varchar", nullable: true })
  avatarUrl: string | null

  @Column({ name: "first_name", type: "varchar", nullable: true })
  firstName: string | null

  @Column({ name: "last_name", type: "varchar", nullable: true })
  lastName: string | null

  @Column({ type: "varchar", nullable: true })
  phone: string | null

  @Column({ name: "address_1", type: "varchar", nullable: true })
  address1: string | null

  @Column({ name: "address_2", type: "varchar", nullable: true })
  address2: string | null

  @Column({ type: "varchar", nullable: true })
  city: string | null

  @Column({ name: "postal_code", type: "varchar", nullable: true })
  postalCode: string | null

  @Column({ name: "country_code", type: "varchar", length: 2, nullable: true })
  countryCode: string | null

  // Payment information (for vendors)
  @Column({ type: "varchar", nullable: true })
  iban: string | null

  @Column({ type: "varchar", nullable: true })
  bic: string | null

  @Column({ name: "bank_account_holder", type: "varchar", nullable: true })
  bankAccountHolder: string | null

  @Column({ name: "paypal_email", type: "varchar", nullable: true })
  paypalEmail: string | null

  @Column({ name: "tax_number", type: "varchar", nullable: true })
  taxNumber: string | null

  @Column({ name: "vat_id", type: "varchar", nullable: true })
  vatId: string | null

  @Column({ type: "jsonb", nullable: true })
  metadata: any

  @Column({ name: "is_active", type: "boolean", default: false })
  isActive: boolean

  @Column({ name: "mfa_enabled", type: "boolean", default: false })
  mfaEnabled: boolean

  @Column({ name: "mfa_secret", type: "varchar", nullable: true })
  mfaSecret: string | null

  @Column({ name: "mfa_pin_hash", type: "varchar", nullable: true })
  mfaPinHash: string | null

  @Column({ name: "mfa_pin_expires_at", type: "timestamp", nullable: true })
  mfaPinExpiresAt: Date | null

  // Compatibility fields used by existing store routes (twofa_pin / twofa_expires)
  @Column({ name: "twofa_pin", type: "varchar", nullable: true })
  twofa_pin: string | null

  @Column({ name: "twofa_expires", type: "bigint", nullable: true })
  twofa_expires: number | null

  @Column({ type: "varchar", default: "active" })
  status: string

  @ManyToMany(() => Role, role => role.users, { eager: true })
  @JoinTable({
    name: "user_roles",
    joinColumn: { name: "user_id" },
    inverseJoinColumn: { name: "role_id" }
  })
  roles: Role[]

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date

  @Column({ name: "deleted_at", type: "timestamp", nullable: true })
  deletedAt: Date | null
}
