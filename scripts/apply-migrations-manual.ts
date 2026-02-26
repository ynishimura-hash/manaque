import { Client } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
const password = process.env.SUPABASE_DB_PASSWORD;
const encodedPassword = encodeURIComponent(password || '');

const connectionString = `postgres://postgres.${projectRef}:${encodedPassword}@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres`;

async function applyMigrations() {
    const client = new Client({
        connectionString: connectionString,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('Connecting to database...');
        await client.connect();
        console.log('Connected.');

        const migrationsDir = path.join(process.cwd(), 'supabase/migrations');
        const migrationFiles = [
            '20260212_create_reskill_events.sql',
            '20260212_dummy_events.sql'
        ];

        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            console.log(`Applying migration: ${file}...`);
            const sql = fs.readFileSync(filePath, 'utf8');

            // Execute the SQL
            await client.query(sql);
            console.log(`Successfully applied ${file}.`);
        }

        console.log('All migrations applied successfully.');
    } catch (err) {
        console.error('Error applying migrations:', err);
    } finally {
        await client.end();
    }
}

applyMigrations();
