import { Router } from "express";
import { getMe, updateMe } from "../controllers/me.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);
router.get("/", getMe);
router.put("/", updateMe);

export default router;