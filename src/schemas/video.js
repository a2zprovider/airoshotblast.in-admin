import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const VideoSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    image: String,
    url: String,
    showStatus: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

VideoSchema.index({ title: 'text' });

module.exports = mongoose.model("Video", VideoSchema);