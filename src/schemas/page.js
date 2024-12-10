import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PageSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Page',
    },
    image: String,
    except: String,
    description: String,
    field: String,
    seo_title: String,
    seo_keywords: String,
    seo_description: String,
}, { timestamps: true });

PageSchema.index({ title: 'text' });

module.exports = mongoose.model("Page", PageSchema);