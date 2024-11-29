import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const PermissionSchema = new Schema({
    resource: {
        type: String,
        required: true,
    },
    action: {
        type: String,
        required: true,
    },
}, { timestamps: true });

module.exports = mongoose.model("Permission", PermissionSchema);