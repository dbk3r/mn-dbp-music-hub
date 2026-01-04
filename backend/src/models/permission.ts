import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm"
import { Role } from "./role"

@Entity({ name: "permission" })
export class Permission {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: "varchar" })
  resource: string

  @Column({ type: "varchar" })
  action: string

  @Column({ type: "varchar", nullable: true })
  description: string | null

  @ManyToMany(() => Role, role => role.permissions)
  roles: Role[]
}
