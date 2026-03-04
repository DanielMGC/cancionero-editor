// src/routes/api/[type]/+server.ts
import { json } from '@sveltejs/kit';
import fs from 'fs/promises';
import path from 'path';
import type { Song } from '$lib/types';

export async function GET({ params }) {
    const { type } = params;
    // Security check to only allow specific files
    if (type !== 'canciones' && type !== 'oraciones') return json([], { status: 400 });
    
    const dataPath = path.resolve(`src/data/${type}.json`);
    
    try {
        const fileContent = await fs.readFile(dataPath, 'utf-8');
        const items: Song[] = JSON.parse(fileContent);
        return json(items);
    } catch (error) {
        // Returns an empty array if the oraciones.json file doesn't exist yet
        return json([]);
    }
}

export async function POST({ params, request }) {
    const { type } = params;
    if (type !== 'canciones' && type !== 'oraciones') return json({ success: false }, { status: 400 });
    
    const dataPath = path.resolve(`src/data/${type}.json`);
    
    try {
        const updatedItems: Song[] = await request.json();
        await fs.writeFile(dataPath, JSON.stringify(updatedItems, null, 2), 'utf-8');
        return json({ success: true });
    } catch (error) {
        return json({ success: false, error: 'Failed to save data' }, { status: 500 });
    }
}