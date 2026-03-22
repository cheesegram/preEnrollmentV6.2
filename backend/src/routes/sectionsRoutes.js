import express from "express";
import {
  createSection,
  getAllSections,
  getSectionsMeta,
  syncSectionsFromStudents,
  updateSectionById,
} from "../controllers/sectionsController.js";

const router = express.Router();

router.post("/sync", syncSectionsFromStudents);
router.post("/", createSection);
router.get("/meta", getSectionsMeta);
router.get("/", getAllSections);
router.patch("/:id", updateSectionById);

export default router;
