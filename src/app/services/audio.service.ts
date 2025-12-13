import { Injectable, signal } from '@angular/core';
import { Observable, of, delay, map } from 'rxjs';

export interface AudioRecord {
    id: string;
    title: string;
    blob: Blob;
    createdAt: Date;
}

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    // In-memory storage for mock purpose
    private storage = new Map<string, AudioRecord>();

    constructor() { }

    createAudio(blob: Blob, title: string): Observable<string> {
        const id = this.generateId();
        const record: AudioRecord = {
            id,
            title,
            blob,
            createdAt: new Date()
        };
        this.storage.set(id, record);
        // Simulate network delay
        return of(id).pipe(delay(500));
    }

    getAudio(id: string): Observable<AudioRecord | undefined> {
        const record = this.storage.get(id);
        return of(record).pipe(delay(300));
    }

    private generateId(): string {
        return Math.random().toString(36).substring(2, 9);
    }
}
