import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

@Entity({ name: "audio_file" })
export class AudioFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  title: string;

  @Column({ type: "varchar", nullable: true })
  artist: string | null;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "release_year", type: "int", nullable: true })
  releaseYear: number | null;

  @Column({ name: "original_name" })
  originalName: string;

  @Column()
  filename: string;

  @Column({ name: "mime_type", type: "varchar" })
  mimeType: string;

  @Column({ type: "int" })
  size: number;

  @Column({ name: "duration_ms", type: "int", nullable: true })
  durationMs: number | null;

  @Column({ name: "waveform_peaks", type: "jsonb", nullable: true })
  waveformPeaks: number[] | null;

  @Column({ name: "category_id", type: "int", nullable: true })
  categoryId: number | null;

  @Column({ name: "tag_ids", type: "jsonb", nullable: true })
  tagIds: number[] | null;

  @Column({ name: "license_model_ids", type: "jsonb", nullable: true })
  licenseModelIds: number[] | null;

  @Column({ name: "cover_original_name", type: "varchar", nullable: true })
  coverOriginalName: string | null;

  @Column({ name: "cover_filename", type: "varchar", nullable: true })
  coverFilename: string | null;

  @Column({ name: "cover_mime_type", type: "varchar", nullable: true })
  coverMimeType: string | null;

  @Column({ name: "cover_size", type: "int", nullable: true })
  coverSize: number | null;

  @Column({ name: "uploaded_by", type: "varchar", nullable: true })
  uploadedBy: string | null;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
