import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm"
import { Customer } from "./customer"

export enum OrderStatus {
  PENDING = "pending",
  PAID = "paid",
  CANCELLED = "cancelled",
  DELIVERED = "delivered"
}

@Entity("orders")
export class Order {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ name: 'order_id', type: 'varchar', nullable: true })
  orderId: string | null

  @Column({ type: "varchar" })
  customerId: string

  @ManyToOne(() => Customer)
  @JoinColumn({ name: "customerId" })
  customer: Customer

  @Column({ type: "varchar", length: 50, default: OrderStatus.PENDING })
  status: OrderStatus

  @Column({ type: "int" })
  totalPriceCents: number

  @Column({ type: "varchar", length: 3, default: "EUR" })
  currencyCode: string

  @Column({ type: "jsonb" })
  items: Array<{
    audio_id: number
    title: string
    license_model_id: number
    license_model_name: string
    price_cents: number
  }>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}