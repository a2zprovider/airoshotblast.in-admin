import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const SliderSchema = new Schema({
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
    // country: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: 'Country', 
    // },
    showStatus: {
        type: Boolean,
        default: true,
    }
}, { timestamps: true });

module.exports = mongoose.model("Slider", SliderSchema);