const router = require("express").Router();
const controller = require("../controllers/dashboardController");
const { authenticate } = require("../middleware/auth");

router.use(authenticate);
router.get("/summary", controller.summary);

module.exports = router;
