const router = require("express").Router();

const controller = require("../controllers/reportController");

const { authenticate, authorize } = require("../middleware/auth");

router.use(authenticate);

router.get(
  "/csv",
  authorize("admin", "finance_officer", "department_head"),
  controller.exportCsv
);

router.get(
  "/pdf",
  authorize("admin", "finance_officer", "department_head"),
  controller.exportPdf
);

module.exports = router;