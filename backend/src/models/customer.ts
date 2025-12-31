import { Entity, Column, PrimaryGeneratedColumn } from "typeorm"

@Entity()
export class Customer {
  @PrimaryGeneratedColumn()
  id: number

  @Column({ nullable: true })
  twofa_pin: string

  @Column({ nullable: true, type: "bigint" })
  twofa_expires: number
}