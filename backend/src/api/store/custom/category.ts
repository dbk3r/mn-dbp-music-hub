import { Request, Response } from "express";
import { AppDataSource } from "../../../datasource/data-source";
import { Category } from "../../../models/category";

export const getCategories = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Category);
  const categories = await repo.find();
  res.json(categories);
};

export const createCategory = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Category);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name ist erforderlich" });
  }
  const category = repo.create({ name });
  await repo.save(category);
  res.status(201).json(category);
};
