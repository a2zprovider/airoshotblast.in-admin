import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const FaqSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
    },
}, { timestamps: true });

module.exports = mongoose.model("Faq", FaqSchema);