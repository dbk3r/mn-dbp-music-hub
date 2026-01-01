import { Request, Response } from "express";
import { AppDataSource } from "../../datasource/data-source";
import { Tag } from "../../models/tag";

export const getTags = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Tag);
  const tags = await repo.find();
  res.json(tags);
};

export const createTag = async (req: Request, res: Response) => {
  const repo = AppDataSource.getRepository(Tag);
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: "Name ist erforderlich" });
  }
  const tag = repo.create({ name });
  await repo.save(tag);
  res.status(201).json(tag);
};

// Backwards-compat (falls noch irgendwo die alten Namen importiert werden)
export const getCategories = getTags;
export const createCategory = createTag;