import { Pool, PoolClient } from 'jsr:@db/postgres';

/**
 * Database configuration interface
 */
export interface DbConfig {
  user: string;
  password: string;
  database: string;
  hostname: string;
  port: number;
  poolSize?: number;
  connectionTimeoutMs?: number;
}

/**
 * Default database configuration - modify these values according to your setup
 */
const DEFAULT_CONFIG: DbConfig = {
  user: 'satish', // Updated default user - change to your actual PostgreSQL username
  password: 'satish', // Updated default password - change to your actual PostgreSQL password
  database: 'test', // Updated default database - change to your actual database
  hostname: 'localhost',
  port: 5432,
  poolSize: 10,
  connectionTimeoutMs: 30000,
};

/**
 * PostgreSQL Database Connection Pool Utility
 * Provides a centralized way to manage database connections using a connection pool
 */
export class PostgresDb {
  private static instance: PostgresDb | null = null;
  private pool!: Pool;
  private config: DbConfig;
  private initialized = false;

  private constructor(config: DbConfig = DEFAULT_CONFIG) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    };

  }

  /**
   * Initializes the database connection pool.
   * This is separated from constructor to allow for lazy initialization.
   */
  private async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.pool = new Pool(this.config, this.config.poolSize ?? 10);
      this.initialized = true;

      // Test connection to verify it works
      const client = await this.pool.connect();
      client.release();

      console.log('Database connection pool successfully initialized');
    } catch (error) {
      console.error('Failed to initialize database connection pool:', error);
      throw error;
    }
  }

  /**
   * Get singleton instance of the database connection pool
   */
  public static getInstance(config?: DbConfig): PostgresDb {
    if (!PostgresDb.instance) {
      PostgresDb.instance = new PostgresDb(config);
    } else if (config) {
      console.warn('Database already initialized. Config update ignored.');
    }
    return PostgresDb.instance;
  }

  /**
   * Execute a query using a connection from the pool
   */
  public async query<T>(sql: string, params: any[] = []): Promise<T[]> {
    await this.ensureInitialized();

    const client = await this.pool.connect();
    try {
      const result = await client.queryObject<T>(sql, params);
      return result.rows;
    } finally {
      client.release();
    }
  }

  /**
   * Ensures that the database pool has been initialized
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get a client from the pool for transaction or multiple operations
   * Remember to release the client when done using client.release()
   */
  public async getClient(): Promise<PoolClient> {
    await this.ensureInitialized();
    return await this.pool.connect();
  }

  /**
   * Execute operations within a transaction
   * @param callback Function that receives a client and performs database operations
   */
  public async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    await this.ensureInitialized();

    const client = await this.pool.connect();
    try {
      await client.queryArray('BEGIN');
      const result = await callback(client);
      await client.queryArray('COMMIT');
      return result;
    } catch (error) {
      await client.queryArray('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Close the connection pool
   */
  public async close(): Promise<void> {
    if (this.initialized && this.pool) {
      await this.pool.end();
      this.initialized = false;
      console.log('Database connection pool closed');
    }
  }

  /**
   * Reset the singleton instance - primarily for testing purposes
   */
  public static reset(): void {
    if (PostgresDb.instance?.initialized) {
      console.warn('Resetting database instance while connections may still be active.');
    }
    PostgresDb.instance = null;
  }
}

// Lazy singleton pattern - the instance is created but not initialized until needed
const db = PostgresDb.getInstance();

/**
 * Get the database connection pool instance.
 * Automatically initialized with default configuration on first use.
 */
export function getDb(): PostgresDb {
  return db;
}

/**
 * Initialize the database with custom configuration if needed.
 * Call this before any other database operations if you need custom config.
 * Subsequent calls will be ignored.
 */
export function initDb(config: Partial<DbConfig> = {}): PostgresDb {
  return PostgresDb.getInstance({
    ...DEFAULT_CONFIG,
    ...config,
  });
}
