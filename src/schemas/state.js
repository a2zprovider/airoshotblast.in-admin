import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const StateSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
    },
    showStatus: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("State", StateSchema);