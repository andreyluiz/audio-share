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
    image_storage_path?: string;
    image_public_url?: string;
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

    createAudio(blob: Blob, title: string, imageFile?: File): Observable<string> {
        const fileExt = blob.type.split('/')[1] || 'webm';
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const filePath = `${fileName}`; // bucket/filename

        // Prepare Uploads
        const uploads: Promise<any>[] = [
            this.supabase.storage.from('audios').upload(filePath, blob, {
                contentType: blob.type,
                upsert: false
            })
        ];

        let imagePath: string | undefined;

        if (imageFile) {
            const imgExt = imageFile.name.split('.').pop() || 'png';
            imagePath = `images/${crypto.randomUUID()}.${imgExt}`;
            uploads.push(
                this.supabase.storage.from('audios').upload(imagePath, imageFile, {
                    contentType: imageFile.type,
                    upsert: false
                })
            );
        }

        return from(Promise.all(uploads)).pipe(
            switchMap((results) => {
                // results[0] is audio, results[1] is image (if existing)
                const audioError = results[0].error;
                if (audioError) throw audioError;

                const imageError = results[1]?.error;
                if (imageError) throw imageError;

                // Get Public URLs
                const { data: { publicUrl: audioPublicUrl } } = this.supabase.storage.from('audios').getPublicUrl(filePath);

                let imagePublicUrl: string | undefined;
                if (imagePath) {
                    const { data: { publicUrl } } = this.supabase.storage.from('audios').getPublicUrl(imagePath);
                    imagePublicUrl = publicUrl;
                }

                // Insert into Database
                const dbRecord = {
                    title: title,
                    file_name: fileName,
                    mime_type: blob.type,
                    storage_path: filePath,
                    public_url: audioPublicUrl,
                    image_storage_path: imagePath || null,
                    image_public_url: imagePublicUrl || null
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
