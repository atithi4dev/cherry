import { config } from "./config.js";

const BASE_URL = config.API_BASE_URL;
const INTERNAL_KEY = config.INTERNAL_API_KEY;

async function request(path: string, init: RequestInit = {}): Promise<any> {
    const res = await fetch(`${BASE_URL}${path}`, {
        ...init,
        headers: {
            "x-internal-key": INTERNAL_KEY,
            ...init.headers,
        },
    });
    const text = await res.text();
    if (!res.ok) {
        throw new Error(`API ${res.status} ${res.statusText}: ${text}`);
    }
    if (!text) return null;
    return JSON.parse(text);
}

export const api = {
    ping() {
        return request("/ping");
    },
    searchOrg(params: Record<string, string | number | boolean | undefined> = {}) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null || v === "") continue;
            if (Array.isArray(v)) {
                for (const item of v) qs.append(k, String(item));
            } else {
                qs.append(k, String(v));
            }
        }
        return request(`/orgs?${qs.toString()}`);
    },
    getOrg(slug: string) {
        return request(`/orgs/${encodeURIComponent(slug)}`);
    },
    compareOrgs(slugs: string[]) {
        const qs = new URLSearchParams();
        qs.append("slugs", slugs.join(","));
        return request(`/orgs/compare?${qs.toString()}`);
    },
    listEditions(params: Record<string, string | number | boolean | undefined> = {}) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null || v === "") continue;
            qs.append(k, String(v));
        }
        return request(`/editions?${qs.toString()}`);
    },
    listProjects(params: Record<string, string | number | boolean | undefined> = {}) {
        const qs = new URLSearchParams();
        for (const [k, v] of Object.entries(params)) {
            if (v === undefined || v === null || v === "") continue;
            qs.append(k, String(v));
        }
        return request(`/projects?${qs.toString()}`);
    },
    getFilters() {
        return request("/filters");
    },
};
