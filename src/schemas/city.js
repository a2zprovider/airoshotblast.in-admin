import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CitySchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    code: {
        type: String,
        required: true,
        unique: true,
    },
    state: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'State',
    },
}, { timestamps: true });

module.exports = mongoose.model("City", CitySchema);