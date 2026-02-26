import * as dns from 'dns';

const regions = [
    'ap-northeast-1', 'ap-northeast-2', 'ap-northeast-3',
    'ap-southeast-1', 'ap-southeast-2', 'ap-south-1',
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'eu-west-1', 'eu-west-2', 'eu-west-3', 'eu-central-1',
    'eu-north-1', 'me-south-1', 'sa-east-1', 'ca-central-1'
];

async function checkRegion(region: string) {
    const host = `aws-0-${region}.pooler.supabase.com`;
    return new Promise((resolve) => {
        dns.lookup(host, (err, address) => {
            if (err) {
                resolve({ region, host, status: 'NOT_FOUND' });
            } else {
                resolve({ region, host, status: 'FOUND', address });
            }
        });
    });
}

async function start() {
    console.log('Brute-forcing Supabase regions...');
    const results = await Promise.all(regions.map(checkRegion));
    results.forEach((r: any) => {
        if (r.status === 'FOUND') {
            console.log(`[+] Found host for region ${r.region}: ${r.address}`);
        }
    });
    console.log('Done.');
}

start();
