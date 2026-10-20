import { Schema, model } from "mongoose";
import { IProject } from "../../types/organization.type.js";

const ProjectSchema = new Schema<IProject>(
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
        edition: {
            type: Schema.Types.ObjectId,
            ref: "OrgEdition",
            required: true,
            index: true,
        },
        year: {
            type: Number,
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        short_description: {
            type: String,
            default: null,
        },
        description: {
            type: String,
            default: null,
        },
        student_name: {
            type: String,
            default: null,
            trim: true,
        },
        code_url: {
            type: String,
            default: null,
            trim: true,
        },
        project_url: {
            type: String,
            default: null,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

ProjectSchema.index({ organization: 1, year: -1 });
ProjectSchema.index({ title: "text", short_description: "text" });

export const Project = model<IProject>("Project", ProjectSchema);
export default Project;