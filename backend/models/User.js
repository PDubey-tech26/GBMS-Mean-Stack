const mongoose = require("mongoose");

const ROLES = ["admin", "finance_officer", "department_head"];

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ROLES, default: "department_head" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department", default: null },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

userSchema.methods.toSafeObject = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

module.exports = mongoose.model("User", userSchema);
module.exports.ROLES = ROLES;
