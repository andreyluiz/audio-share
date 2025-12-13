import { Injectable } from '@angular/core';
import { Observable, from, map, switchMap } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface AudioRecord {
    id: string;
    created_at?: Date;
    title: string;
    file_name: string;
    mime_type: string;
    storage_path: string;
    public_url: string;
    transcription?: string;
    summary?: string;
    blob?: Blob; // Helper for client-side usage, not in DB
}

@Injectable({
    providedIn: 'root'
})
export class AudioService {
    private supabase: SupabaseClient;

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
    }

    createAudio(blob: Blob, title: string): Observable<string> {
        const fileExt = blob.type.split('/')[1] || 'webm';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`; // bucket/filename

        // 1. Upload to Storage
        return from(this.supabase.storage.from('audios').upload(filePath, blob, {
            contentType: blob.type,
            upsert: false
        })).pipe(
            switchMap(({ data, error }) => {
                if (error) throw error;

                // 2. Get Public URL
                const { data: { publicUrl } } = this.supabase.storage.from('audios').getPublicUrl(filePath);

                // 3. Insert into Database
                const dbRecord = {
                    title: title,
                    file_name: fileName,
                    mime_type: blob.type,
                    storage_path: filePath,
                    public_url: publicUrl
                };

                return from(this.supabase.from('audios').insert(dbRecord).select().single());
            }),
            map(({ data, error }) => {
                if (error) throw error;
                return data.id;
            })
        );
    }

    getAudio(id: string): Observable<AudioRecord | undefined> {
        return from(this.supabase.from('audios').select('*').eq('id', id).single()).pipe(
            map(({ data, error }) => {
                if (error || !data) return undefined;
                return data as AudioRecord;
            })
        );
    }
}
