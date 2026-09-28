const mongoose = require("mongoose");

// Singleton document holding admin-configurable anomaly detection thresholds
const thresholdSchema = new mongoose.Schema(
  {
    key: { type: String, default: "GLOBAL", unique: true },
    underUtilizationMaxPercent: { type: Number, default: 40 },   // utilization must be below this
    underUtilizationTimeElapsedPercent: { type: Number, default: 70 }, // when this much of the fiscal year has elapsed
    overspendingWarningPercent: { type: Number, default: 90 },
    overspendingCriticalPercent: { type: Number, default: 100 },
    spikeMultiplier: { type: Number, default: 3 } // a transaction > (avg * multiplier) triggers a spike alert
  },
  { timestamps: true }
);

module.exports = mongoose.model("Threshold", thresholdSchema);
