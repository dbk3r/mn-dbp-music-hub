import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity({ name: "license_template" })
export class LicenseTemplate {
  @PrimaryGeneratedColumn()
  id!: number

  @Column({ name: "template_html", type: "text" })
  templateHtml!: string

  @Column({ name: "logo_filename", type: "varchar", nullable: true })
  logoFilename?: string

  @Column({ name: "logo_position", type: "varchar", default: "top-left" })
  logoPosition!: string

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive!: boolean

  @CreateDateColumn({ name: "created_at" })
  createdAt!: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt!: Date
}
