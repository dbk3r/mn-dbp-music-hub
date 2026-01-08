import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity({ name: "audio_variant_file" })
export class AudioVariantFile {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: "audio_variant_id", type: "int" })
  audioVariantId: number

  @Column({ name: "original_name", type: "varchar" })
  originalName: string

  @Column({ type: "varchar" })
  filename: string

  @Column({ name: "mime_type", type: "varchar" })
  mimeType: string

  @Column({ type: "int" })
  size: number

  @Column({ type: "text", nullable: true })
  description: string | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
