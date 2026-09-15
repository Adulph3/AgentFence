export declare function rootClass(value: string): 'project' | 'home' | 'filesystem' | 'sensitive' | 'other' | 'unknown';
export declare function endpointClass(value: string): {
    scheme: 'https' | 'http' | 'other';
    hostClass: 'loopback-literal' | 'private-literal' | 'other' | 'unresolved';
} | undefined;
