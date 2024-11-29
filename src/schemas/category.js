import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
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
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    except: String,
    description: String,
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
    },
    seo_title: String,
    seo_keywords: String,
    seo_description: String,
}, { timestamps: true });

module.exports = mongoose.model("Category", CategorySchema);