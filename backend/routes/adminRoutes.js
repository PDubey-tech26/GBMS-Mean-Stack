const router = require("express").Router();
const controller = require("../controllers/adminController");
const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate, authorize("admin"));

router.get("/users", controller.listUsers);
router.post("/users", controller.createUser);
router.put("/users/:id", controller.updateUserRole);

router.get("/thresholds", controller.getThresholds);
router.put("/thresholds", controller.updateThresholds);

router.get("/audit-logs", controller.auditLogs);

module.exports = router;
