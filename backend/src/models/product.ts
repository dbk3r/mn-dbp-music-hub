import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity({ name: "audio_product" })
export class Product {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: "audio_file_id", type: "int", unique: true })
  audioFileId: number

  @Column({ type: "varchar" })
  title: string

  @Column({ type: "text", nullable: true })
  description: string | null

  @Column({ type: "varchar", default: "draft" })
  status: string

  @Column({ name: "category_id", type: "int", nullable: true })
  categoryId: number | null

  @Column({ name: "tag_ids", type: "jsonb", nullable: true })
  tagIds: number[] | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date
}
