import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from "typeorm"

@Entity({ name: "product_variant" })
export class ProductVariant {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: "product_id", type: "int" })
  productId: number

  @Column({ name: "license_model_id", type: "int" })
  licenseModelId: number

  @Column({ type: "varchar" })
  name: string

  @Column({ name: "price_cents", type: "int", default: 0 })
  priceCents: number

  @Column({ type: "varchar", default: "active" })
  status: string

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date
}
