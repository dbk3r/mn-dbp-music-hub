import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "license_model" })
export class LicenseModel {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: "varchar" })
  name: string;

  @Column({ type: "varchar", nullable: true })
  icon: string | null;

  @Column({ type: "text", nullable: true })
  description: string | null;

  @Column({ name: "price_cents", type: "int", default: 0 })
  priceCents: number;

  @Column({ name: "legal_description", type: "text", nullable: true })
  legalDescription: string | null;
}
