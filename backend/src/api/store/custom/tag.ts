import { Request, Response } from "express";
import { AppDataSource } from "../../../datasource/data-source";
import { Tag } from "../../../models/tag";

export const getCategories = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Tag);
  const tags = await repo.find();
  res.json(tags);
};

export const createCategory = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Tag);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name ist erforderlich" });
  }
  const tags = repo.create({ name });
  await repo.save(tags);
  res.status(201).json(tags);
};