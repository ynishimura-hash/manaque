
const { Client } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

const envPath = path.resolve(process.cwd(), '.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

async function main() {
    const client = new Client({
        connectionString: envConfig.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        await client.connect();
        console.log('Connected to database.');

        // Check if column exists
        const checkRes = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='rpg_tiles' AND column_name='is_obstacle';
    `);

        if (checkRes.rowCount === 0) {
            console.log('Adding is_obstacle column...');
            await client.query('ALTER TABLE rpg_tiles ADD COLUMN is_obstacle BOOLEAN DEFAULT FALSE;');
            console.log('Column added successfully.');
        } else {
            console.log('Column is_obstacle already exists.');
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

main();
