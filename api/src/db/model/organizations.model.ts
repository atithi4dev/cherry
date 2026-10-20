import mongoose, { Schema, model } from "mongoose";
import { IOrganization } from "../../types/organization.type.js";

const OrganizationSchema = new Schema<IOrganization>(
    {
        source_id: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        organizationName: {
            type: String,
            default: null,
            trim: true,
            index: true,
        },
        url: {
            type: String,
            default: null,
            trim: true,
        },
        image_url: {
            type: String,
            default: null,
            trim: true,
        },
        image_background_color: {
            type: String,
            default: null,
            trim: true,
        },
        description: {
            type: String,
            default: null,
            trim: true,
        },
        years: {
            type: Map,
            of: {
                type: Schema.Types.ObjectId,
                ref: "OrgEdition",
            },
            default: {},
        },
        categories: {
            type: [String],
            default: [],
            index: true,
        },
        topics: {
            type: [String],
            default: [],
            index: true,
        },
        technologies: {
            type: [String],
            default: [],
            index: true,
        },
        years_participated: {
            type: [Number],
            default: [],
            index: true,
        },
        total_projects: {
            type: Number,
            default: 0,
        },
        irc_channel: {
            type: String,
            default: null,
            trim: true,
        },
        contact_email: {
            type: String,
            default: null,
            trim: true,
        },
        mailing_list: {
            type: String,
            default: null,
            trim: true,
        },
        guide_url: {
            type: String,
            default: null,
            trim: true,
        },
        ideas_url: {
            type: String,
            default: null,
            trim: true,
        },
        twitter_url: {
            type: String,
            default: null,
            trim: true,
        },
        blog_url: {
            type: String,
            default: null,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

// Free text search for find_orgs
OrganizationSchema.index({ organizationName: "text", description: "text" });

export const Organization = model<IOrganization>("Organization", OrganizationSchema);
export default Organization;