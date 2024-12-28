import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CareerSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    image: String,
    except: String,
    description: String,
    address:String,
    vacancy:String,
    seo_title: String,
    seo_keywords: String,
    seo_description: String,
    showStatus: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

CareerSchema.index({ title: 'text' });

module.exports = mongoose.model("Career", CareerSchema);