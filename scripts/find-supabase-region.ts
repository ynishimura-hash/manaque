import { Client } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env.local') });

const regions = [
    'ap-northeast-1', 'us-east-1', 'eu-central-1', 'ap-southeast-1',
    'us-west-1', 'us-west-2', 'sa-east-1', 'eu-west-1', 'eu-west-2',
    'eu-west-3', 'ap-northeast-2', 'ap-south-1', 'ca-central-1'
];

const TENANT = 'tgtifzajkpfqpnwbjqds'; // from project info
const PASSWORD = 'Yc*qax57h?*eVDz'; // from .env.local comments

async function checkRegion(region: string) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    const connectionString = `postgres://${TENANT}.pooler:${encodeURIComponent(PASSWORD)}@${host}:6543/postgres`;

    console.log(`Trying region: ${region} (${host})...`);

    const client = new Client({
        connectionString,
        ssl: { rejectUnauthorized: false },
        connectionTimeoutMillis: 5000,
    });

    try {
        await client.connect();
        console.log(`[SUCCESS] Connected to ${region}!`);
        await client.end();
        return region;
    } catch (err: any) {
        await client.end();
        if (err.message && (err.message.includes('Tenant or user not found') || err.message.includes('getaddrinfo ENOTFOUND'))) {
            // Wrong region
            return null;
        }
        // If we get here, it might be the right region but some other error (like strict auth), 
        // but usually 'Tenant not found' is the indicator of wrong region.
        // If password was wrong, we'd get password error. 
        // If we got success, great.
        console.log(`[?] Error in ${region}: ${err.message}`);
        // If it's not "Tenant not found", maybe this is the one?
        return region;
    }
}

async function find() {
    console.log('Searching for tenant region...');
    for (const region of regions) {
        const result = await checkRegion(region);
        if (result) {
            console.log(`\n!!! FOUND REGION: ${result} !!!\n`);
            console.log(`Correct Host: aws-0-${result}.pooler.supabase.com`);
            console.log(`Connection String: postgres://${TENANT}.pooler:[PASSWORD]@aws-0-${result}.pooler.supabase.com:6543/postgres`);
            return;
        }
    }
    console.log('Region not found in common list.');
}

find();
