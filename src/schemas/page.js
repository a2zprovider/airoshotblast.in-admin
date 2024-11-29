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
    image: String,
    except: String,
    description: String,
    seo_title: String,
    seo_keywords: String,
    seo_description: String,
}, { timestamps: true });

module.exports = mongoose.model("Page", PageSchema);