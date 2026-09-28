const router = require("express").Router();
const controller = require("../controllers/departmentController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/", controller.list);
router.get("/:id", controller.getOne);
router.post("/", authorize("admin", "finance_officer"), controller.create);
router.put("/:id", authorize("admin", "finance_officer"), controller.update);
router.delete("/:id", authorize("admin"), controller.remove);

module.exports = router;
