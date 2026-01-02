import { DataSource } from "typeorm"
import * as dotenv from "dotenv"
import path from "path"
import { Customer } from "../models/customer"
import { Category } from "../models/category"
import { Tag } from "../models/tag"
import { LicenseModel } from "../models/license-model"
import { AudioFile } from "../models/audio-file"
import { Product } from "../models/product"
import { ProductVariant } from "../models/product-variant"
import { VariantFile } from "../models/variant-file"
import { User } from "../models/user"

dotenv.config({ path: process.cwd() + "/.env" })

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Customer, Category, Tag, LicenseModel, AudioFile, Product, ProductVariant, VariantFile, User],
  migrations: [path.join(__dirname, "..", "migrations", "*.{ts,js}")],
  synchronize: false,
})
