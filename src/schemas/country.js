import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CountrySchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    showStatus: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("Country", CountrySchema);