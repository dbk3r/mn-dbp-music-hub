import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity({ name: "audio_variant" })
export class AudioVariant {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: "audio_file_id", type: "int" })
  audioFileId: number

  @Column({ name: "license_model_id", type: "int" })
  licenseModelId: number

  @Column({ type: "varchar" })
  name: string

  @Column({ name: "price_cents", type: "int", default: 0 })
  priceCents: number

  @Column({ type: "varchar", default: "active" })
  status: string

  @Column({ type: "text", nullable: true })
  description: string | null

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
