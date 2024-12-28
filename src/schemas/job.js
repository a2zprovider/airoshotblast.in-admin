import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const JobSchema = new Schema({
    resume: {
        type: String,
        required: true,
    },
    career: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Career',
    },
    status: {
        type: String,
        enum: ['pending', 'success', 'reject'],
        default: 'pending'
    },
    review: {
        type: String,
    },
    showStatus: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("Job", JobSchema);