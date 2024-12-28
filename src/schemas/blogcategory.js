import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const BlogCategorySchema = new Schema({
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
    country: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Country',
    },
    seo_title: String,
    seo_keywords: String,
    seo_description: String,
    showStatus: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });
BlogCategorySchema.index({ title: 'text' });

module.exports = mongoose.model("BlogCategory", BlogCategorySchema);