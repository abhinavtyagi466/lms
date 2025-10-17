const mongoose = require('mongoose');

const UnmatchedKPISchema = new mongoose.Schema(
  {
    fe: { type: String, required: true },
    employeeId: { type: String },
    email: { type: String },
    period: { type: String, required: true },
    kpiScore: { type: Number },
    rating: { type: String },
    rawData: { type: mongoose.Schema.Types.Mixed },
    notes: { type: String },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

UnmatchedKPISchema.index({ period: 1, fe: 1, employeeId: 1 });

module.exports = mongoose.model('UnmatchedKPI', UnmatchedKPISchema);


