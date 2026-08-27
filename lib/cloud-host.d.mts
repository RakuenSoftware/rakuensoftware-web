/* The app is TypeScript and lib/ is plain ESM, so this is the one place the two
 * meet. Hand-written rather than generated: the module is one function and a
 * build step to produce four lines would be the larger moving part. */
export declare function isCloudHost(hostname: unknown): boolean;
export declare const AIMEE_CLOUD_URL: string;
export declare function aimeeCloudHref(hostname: unknown): string;
