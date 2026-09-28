const router = require("express").Router();
const controller = require("../controllers/alertController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get("/", controller.list);
router.put("/:id/resolve", authorize("admin", "finance_officer"), controller.resolve);
router.post("/run-detection", authorize("admin", "finance_officer"), controller.runDetection);

module.exports = router;
