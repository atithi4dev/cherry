export type MatchMode = "any" | "all";

export interface PaginationParams {
    page?: number;
    limit?: number;
}

export interface PaginationResult {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    pagination?: PaginationResult;
    error?: string;
    message?: string;
}

export interface OrgSearchParams extends PaginationParams {
    tech?: string | string[];
    technologies?: string | string[];
    topic?: string | string[];
    topics?: string | string[];
    category?: string;
    year?: number;
    year_start?: number;
    year_end?: number;
    min_year?: number;
    max_year?: number;
    start_year?: number;
    end_year?: number;
    text?: string;
    q?: string;
    search?: string;
    match?: MatchMode;
    sort?: string;
}

export interface EditionQueryParams extends PaginationParams {
    org?: string;
    orgSlug?: string;
    year?: number;
    tech?: string | string[];
    technology?: string | string[];
    topic?: string | string[];
    category?: string;
}

export interface ProjectQueryParams extends PaginationParams {
    org?: string;
    orgSlug?: string;
    year?: number;
    year_start?: number;
    year_end?: number;
    start_year?: number;
    end_year?: number;
    text?: string;
    q?: string;
    search?: string;
    full?: boolean | string | number;
}

export interface CompareOrgsParams {
    slugs: string[] | string;
}
