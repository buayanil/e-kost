import { Router } from "express";
import {
    getAllAssignments,
    createAssignment,
    updateAssignment,
    deleteAssignment,
} from "../controllers/roomAssignment.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

router.use(authMiddleware);

router.get("/", getAllAssignments);
router.post("/", createAssignment);
router.put("/:id", updateAssignment);
router.delete("/:id", deleteAssignment);

export default router;
