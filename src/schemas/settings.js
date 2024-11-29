import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const SettingSchema = new Schema({
    title: String,
    tagline: String,
    logo: String,
    favicon: String,
    mobile: Number,
    email: String,
    address: String,
    except: String,
    description: String,
    analytics: String,
    social_links: String,
    seo_details: String,
    other_details: String,
}, { timestamps: true });

module.exports = mongoose.model("Setting", SettingSchema);