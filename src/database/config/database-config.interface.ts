export interface DatabaseConfig {
    url: string;
    connectionLimit: number;
    poolTimeout: number;
    enableLogging: boolean;
}