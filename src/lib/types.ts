// src/lib/types.ts
export interface Song {
    number: number;
    category: string;
    title: string;
    author: string;
    text: string;
}

export interface Lista {
    number: number;
    title: string;
    elements: number[];
}