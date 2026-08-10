import express from "express";
import { prisma } from "../../../lib/prisma.js";

const router = express.Router();

router.get("/test", async (req, res) => {
  const count = await prisma.diet_detail.count();
  const first = await prisma.diet_detail.findFirst({
    where: { user_id: 1 },
    orderBy: { consume_date: "desc" },
  });
  res.json({ count, first });
});

export default router;