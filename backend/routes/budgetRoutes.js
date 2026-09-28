const router = require("express").Router();
const controller = require("../controllers/budgetController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.get("/:id/utilization", controller.utilization);
router.post("/", authorize("admin", "finance_officer"), controller.create);
router.put("/:id", authorize("admin", "finance_officer"), controller.update);
router.delete("/:id", authorize("admin", "finance_officer"), controller.remove);

module.exports = router;
