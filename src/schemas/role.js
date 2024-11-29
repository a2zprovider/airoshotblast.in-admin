import mongoose from 'mongoose';
const Schema = mongoose.Schema;

const RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Permission' }]
}, { timestamps: true });

module.exports = mongoose.model("Role", RoleSchema);