import { Redis } from "ioredis";
import { config } from "./config.js";

// In-memory fallback cache entry
interface CacheEntry<T> {
    data: T;
    expiresAt: number;
}

class CacheService {
    private redis: Redis | null = null;
    private memoryCache: Map<string, CacheEntry<unknown>> = new Map();
    private isRedisConnected: boolean = false;

    constructor() {
        if (config.REDIS_URL) {
            try {
                this.redis = new Redis(config.REDIS_URL, {
                    lazyConnect: true,
                    maxRetriesPerRequest: 1,
                    retryStrategy: () => null, // don't aggressively retry and spam logs if down
                    reconnectOnError: () => false,
                });

                this.redis.on("connect", () => {
                    this.isRedisConnected = true;
                    console.log("Redis connected for caching");
                });

                this.redis.on("error", (_err) => {
                    this.isRedisConnected = false;
                });

                // Attempt non-blocking initial connection
                this.redis.connect().catch(() => {
                    this.isRedisConnected = false;
                });
            } catch {
                this.isRedisConnected = false;
            }
        }
    }

    public async get<T>(key: string): Promise<T | null> {
        // Try Redis first if connected
        if (this.isRedisConnected && this.redis) {
            try {
                const val = await this.redis.get(key);
                if (val) {
                    return JSON.parse(val) as T;
                }
            } catch {
                // Fall back to memory cache
            }
        }

        // Memory cache fallback
        const entry = this.memoryCache.get(key);
        if (entry) {
            if (Date.now() < entry.expiresAt) {
                return entry.data as T;
            }
            this.memoryCache.delete(key);
        }

        return null;
    }

    public async set<T>(key: string, value: T, ttlSeconds: number = 3600): Promise<void> {
        // Set in memory cache
        this.memoryCache.set(key, {
            data: value,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });

        // Set in Redis if connected
        if (this.isRedisConnected && this.redis) {
            try {
                await this.redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
            } catch {
                // Ignore Redis errors, memory cache already set
            }
        }
    }

    public async del(key: string): Promise<void> {
        this.memoryCache.delete(key);
        if (this.isRedisConnected && this.redis) {
            try {
                await this.redis.del(key);
            } catch {
                // Ignore
            }
        }
    }
}

export const cache = new CacheService();
