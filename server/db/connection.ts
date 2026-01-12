import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';

// Load .env and .env.local files
dotenv.config();
dotenv.config({ path: '.env.local' });

// Configure Neon for better performance
neonConfig.fetchConnectionCache = true;

// Get database URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create Neon client
export const sql = neon(databaseUrl);

// Test database connection
export async function testConnection(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Execute raw SQL (for migrations)
// Neon requires sql.query() for dynamic SQL strings
export async function executeSQL(query: string): Promise<void> {
  try {
    // Split SQL by semicolons and filter out empty/whitespace statements
    const statements = query
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'));

    // Execute each statement separately using sql.query() for dynamic SQL
    for (const statement of statements) {
      if (statement.trim()) {
        // Use sql.query() for dynamic SQL strings
        await sql.query(statement);
      }
    }
  } catch (error) {
    console.error('SQL execution error:', error);
    throw error;
  }
}

