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

  @Column({ name: "original_name" })
  originalName: string;

  @Column()
  filename: string;

  @Column({ name: "mime_type" })
  mimeType: string;

  @Column({ type: "int" })
  size: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
