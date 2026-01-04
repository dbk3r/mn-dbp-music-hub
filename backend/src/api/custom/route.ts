
import { Router } from "express";
import { getCategories, createCategory } from "./category";
import { getTags, createTag } from "./tag";

const router = Router();

// OPTIONS-Handler für CORS-Preflight-Requests mit korrekten CORS-Headern
router.options("/categories", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");
  res.status(200).end();
});

router.options("/tags", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");
  res.status(200).end();
});

router.options("/license-models", (req, res) => {
  res.header("Access-Control-Allow-Origin", "http://localhost:3000");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, x-publishable-api-key, Authorization");
  res.status(200).end();
});

router.get("/categories", getCategories);
router.post("/categories", createCategory);

router.get("/tags", getTags);
router.post("/tags", createTag);

export default router;
