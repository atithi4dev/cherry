import { Types } from "mongoose";

export interface IOrganization {
    source_id: string;
    organizationName: string;
    slug: string;
    url: string;
    image_url?: string | null;
    image_background_color?: string | null;
    description: string;
    // Map where keys are string years, and values are ObjectId to OrgEdition model
    years: Map<string, Types.ObjectId>;
    
    // Aggregated data for fast queries and filters
    categories?: string[];
    topics?: string[];
    technologies?: string[];
    years_participated?: number[];
    total_projects?: number;

    // Contact details
    irc_channel: string;
    contact_email: string;
    mailing_list: string;
    guide_url: string;
    ideas_url: string;
    twitter_url: string;
    blog_url: string;
}

export interface IOrgEdition {
    source_id: string;  
    organization: Types.ObjectId;
    year: number;
    category: string;
    topics: string[];
    technologies: string[];
    num_projects: number;
    // Projects stored as array of Mongoose ObjectId 
    projects: Types.ObjectId[];
}

export interface IProject {
    source_id: string;
    organization: Types.ObjectId;
    edition: Types.ObjectId;
    year: number;
    title: string;
    short_description: string;
    description: string;
    student_name: string;
    code_url: string;
    project_url: string;
}