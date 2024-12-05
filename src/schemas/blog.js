import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const BlogSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    author: {
        type: String
    },
    tags: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Tag',
        },
    ],
    categories: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'BlogCategory',
        },
    ],
    image: String,
    thumb_image: String,
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
BlogSchema.index({ title: 'text' });

module.exports = mongoose.model("Blog", BlogSchema);