import { DataSource } from "typeorm"
import * as dotenv from "dotenv"
import { Customer } from "../models/customer"

dotenv.config({ path: process.cwd() + "/.env" })

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Customer],
  migrations: [process.cwd() + "/backend/src/migrations/*.{ts,js}"],
  synchronize: false,
})
