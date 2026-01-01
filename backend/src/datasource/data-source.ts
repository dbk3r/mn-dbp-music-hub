import { DataSource } from "typeorm"
import * as dotenv from "dotenv"
import { Customer } from "../models/customer"
import { Category } from "../models/category"
import { Tag } from "../models/tag"

dotenv.config({ path: process.cwd() + "/.env" })

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Customer, Category, Tag],
  migrations: [process.cwd() + "/backend/src/migrations/*.{ts,js}"],
  synchronize: false,
})
