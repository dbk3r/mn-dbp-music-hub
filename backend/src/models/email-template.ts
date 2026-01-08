import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity({ name: "email_template" })
export class EmailTemplate {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: "template_name", type: "varchar", length: 100 })
  templateName: string

  @Column({ type: "varchar", length: 255 })
  subject: string

  @Column({ name: "body_html", type: "text" })
  bodyHtml: string

  @Column({ name: "is_active", type: "boolean", default: true })
  isActive: boolean

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date
}
