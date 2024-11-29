import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const TagsSchema = new Schema({
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
}, { timestamps: true });

module.exports = mongoose.model("Tag", TagsSchema);