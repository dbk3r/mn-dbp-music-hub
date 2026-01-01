
import { Router } from "express";
import { getCategories, createCategory } from "./category";

const router = Router();

router.get("/categories", getCategories);

router.post("/categories", createCategory);

export default router;
