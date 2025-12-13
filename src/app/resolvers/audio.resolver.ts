import { Injectable, inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AudioService, AudioRecord } from '../services/audio.service';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const audioResolver: ResolveFn<AudioRecord | undefined> = (
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
) => {
    const audioService = inject(AudioService);
    const id = route.paramMap.get('id');

    if (!id) {
        return of(undefined);
    }

    return audioService.getAudio(id).pipe(
        catchError(() => of(undefined))
    );
};
