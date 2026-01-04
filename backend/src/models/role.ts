import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToMany, JoinTable } from "typeorm"
import { User } from "./user"
import { Permission } from "./permission"

@Entity({ name: "role" })
export class Role {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: "varchar", unique: true })
  name: string

  @Column({ type: "varchar", nullable: true })
  description: string | null

  @ManyToMany(() => User, user => user.roles)
  users: User[]

  @ManyToMany(() => Permission, permission => permission.roles, { eager: true })
  @JoinTable({
    name: "role_permissions",
    joinColumn: { name: "role_id" },
    inverseJoinColumn: { name: "permission_id" }
  })
  permissions: Permission[]

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
