import { Router } from "express";
import { getSummary } from "../controllers/summary.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getSummary);

export default router;
