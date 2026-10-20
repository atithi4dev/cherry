import mongoose, { Schema, model } from "mongoose";
import { IOrgEdition } from "../../types/organization.type.js";

const OrgEditionSchema = new Schema<IOrgEdition>(
    {
        source_id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        organization: {
            type: Schema.Types.ObjectId,
            ref: "Organization",
            required: true,
            index: true,
        },
        year: {
            type: Number,
            required: true,
            index: true,
        },
        category: {
            type: String,
            trim: true,
            default: null,
            index: true,
        },
        topics: {
            type: [String],
            index: true,
            default: [],
        },
        technologies: {
            type: [String],
            index: true,
            default: [],
        },
        num_projects: {
            type: Number,
            default: 0,
        },
        projects: [
            {
                type: Schema.Types.ObjectId,
                ref: "Project",
            },
        ],
    },
    {
        timestamps: true,
    }
);

// One edition per organization per year; also serves "edition for org X newest first"
OrgEditionSchema.index({ organization: 1, year: -1 }, { unique: true });

export const OrgEdition = model<IOrgEdition>("OrgEdition", OrgEditionSchema);
export default OrgEdition;