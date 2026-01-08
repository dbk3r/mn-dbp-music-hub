import { DataSource } from "typeorm"
import * as dotenv from "dotenv"
import path from "path"
import { Customer } from "../models/customer"
import { Category } from "../models/category"
import { Tag } from "../models/tag"
import { LicenseModel } from "../models/license-model"
import { AudioFile } from "../models/audio-file"
import { AudioVariant } from "../models/audio-variant"
import { AudioVariantFile } from "../models/audio-variant-file"
import { User } from "../models/user"
import { Role } from "../models/role"
import { Permission } from "../models/permission"
import { Order } from "../models/order"
import { SystemSetting } from "../models/system-setting"

dotenv.config({ path: process.cwd() + "/.env" })

export const AppDataSource = new DataSource({
  type: "postgres",
  url: process.env.DATABASE_URL,
  entities: [Customer, Category, Tag, LicenseModel, AudioFile, AudioVariant, AudioVariantFile, User, Role, Permission, Order, SystemSetting],
  migrations: [path.join(__dirname, "..", "migrations", "*.{ts,js}")],
  synchronize: false,
})
