import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const EnquirySchema = new Schema({
    name: String,
    mobile: Number,
    email: String,
    subject: String,
    message: String,
    status: {
        type: String,
        enum: ['pending', 'success', 'reject'],
        default: 'pending'
    },
}, { timestamps: true });

module.exports = mongoose.model("Enquiry", EnquirySchema);