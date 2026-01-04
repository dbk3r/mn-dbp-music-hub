import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("system_settings")
export class SystemSetting {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ type: "varchar", unique: true })
  key: string

  @Column({ type: "text" })
  value: string

  @Column({ type: "varchar", nullable: true })
  description: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}