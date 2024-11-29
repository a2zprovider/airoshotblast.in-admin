import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
    title: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true,
        unique: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
    },
    image: String,
    images: String,
    price: String,
    application: String,
    field: String,
    field1: String,
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

ProductSchema.index({ title: 'text' });

module.exports = mongoose.model("Product", ProductSchema);