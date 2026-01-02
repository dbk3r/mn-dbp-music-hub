import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity({ name: "user" })
export class User {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: "varchar", unique: true })
  email: string

  @Column({ name: "password_hash", type: "varchar" })
  passwordHash: string

  @Column({ name: "display_name", type: "varchar", nullable: true })
  displayName: string | null

  @Column({ name: "avatar_url", type: "varchar", nullable: true })
  avatarUrl: string | null

  @Column({ name: "mfa_enabled", type: "boolean", default: false })
  mfaEnabled: boolean

  @Column({ name: "mfa_secret", type: "varchar", nullable: true })
  mfaSecret: string | null

  @Column({ type: "varchar", default: "active" })
  status: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
