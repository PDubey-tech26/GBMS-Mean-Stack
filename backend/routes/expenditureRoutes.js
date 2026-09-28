const router = require("express").Router();
const controller = require("../controllers/expenditureController");
const { authenticate, authorize } = require("../middleware/auth");
const upload = require("../middleware/upload");

router.use(authenticate);

router.get("/", controller.list);
router.get("/category-summary", controller.categorySummary);
router.get("/:id", controller.getOne);
router.post("/", authorize("admin", "finance_officer", "department_head"), upload.single("document"), controller.create);
router.put("/:id", authorize("admin", "finance_officer", "department_head"), upload.single("document"), controller.update);
router.delete("/:id", authorize("admin", "finance_officer"), controller.remove);

module.exports = router;
