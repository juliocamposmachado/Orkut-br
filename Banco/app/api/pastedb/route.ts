/**
 * API Route para PasteDB
 * 
 * Esta API faz a ponte entre o frontend Next.js e o backend Python PasteDB
 */

import { spawn } from 'child_process';
import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

function runPython(operation: string, args: string[] = []): Promise<any> {
    return new Promise((resolve, reject) => {
        const pythonArgs = ['orkut_pastedb_interface.py', operation, ...args];
        const pythonProcess = spawn('python', pythonArgs, {
            cwd: path.join(process.cwd()),
            stdio: ['pipe', 'pipe', 'pipe']
        });

        let output = '';
        let errorOutput = '';

        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonProcess.on('close', (code) => {
            if (code === 0) {
                try {
                    // Pegar apenas a última linha que deve ser o JSON
                    const lines = output.trim().split('\n');
                    const lastLine = lines[lines.length - 1];
                    const result = JSON.parse(lastLine);
                    resolve(result);
                } catch (e) {
                    resolve({ success: true, output: output.trim() });
                }
            } else {
                reject(new Error(`Python script failed: ${errorOutput || output}`));
            }
        });
    });
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const operation = searchParams.get('operation');
        const key = searchParams.get('key');

        if (!operation) {
            return NextResponse.json({ error: 'Operation is required' }, { status: 400 });
        }

        switch (operation) {
            case 'test':
                const testResult = await runPython('test');
                return NextResponse.json(testResult);

            case 'read':
                if (!key) {
                    return NextResponse.json({ error: 'Key is required for read operation' }, { status: 400 });
                }
                const readResult = await runPython('read', [key]);
                return NextResponse.json(readResult);

            case 'list_keys':
                const listResult = await runPython('list_keys');
                return NextResponse.json(listResult);

            case 'count':
                const countResult = await runPython('count');
                return NextResponse.json({ count: countResult });

            case 'info':
                const infoResult = await runPython('info');
                return NextResponse.json(infoResult);

            default:
                return NextResponse.json({ error: 'Unsupported operation for GET' }, { status: 400 });
        }
    } catch (error) {
        console.error('PasteDB API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { operation, key, data, metadata, query, field, filename } = body;

        if (!operation) {
            return NextResponse.json({ error: 'Operation is required' }, { status: 400 });
        }

        switch (operation) {
            case 'create':
                if (!key || !data) {
                    return NextResponse.json({ error: 'Key and data are required for create operation' }, { status: 400 });
                }
                const args = [key, JSON.stringify(data)];
                if (metadata) {
                    args.push(JSON.stringify(metadata));
                }
                const createResult = await runPython('create', args);
                return NextResponse.json(createResult);

            case 'update':
                if (!key || !data) {
                    return NextResponse.json({ error: 'Key and data are required for update operation' }, { status: 400 });
                }
                const updateArgs = [key, JSON.stringify(data)];
                if (metadata) {
                    updateArgs.push(JSON.stringify(metadata));
                }
                const updateResult = await runPython('update', updateArgs);
                return NextResponse.json(updateResult);

            case 'delete':
                if (!key) {
                    return NextResponse.json({ error: 'Key is required for delete operation' }, { status: 400 });
                }
                const deleteResult = await runPython('delete', [key]);
                return NextResponse.json(deleteResult);

            case 'search':
                if (!query) {
                    return NextResponse.json({ error: 'Query is required for search operation' }, { status: 400 });
                }
                const searchArgs = [query];
                if (field) {
                    searchArgs.push(field);
                }
                const searchResult = await runPython('search', searchArgs);
                return NextResponse.json(searchResult);

            case 'backup':
                const backupArgs = filename ? [filename] : [];
                const backupResult = await runPython('backup', backupArgs);
                return NextResponse.json(backupResult);

            default:
                return NextResponse.json({ error: 'Unsupported operation' }, { status: 400 });
        }
    } catch (error) {
        console.error('PasteDB API Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
