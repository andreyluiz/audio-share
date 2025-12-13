import { ApplicationConfig, provideBrowserGlobalErrorListeners, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { LucideAngularModule, Mic, Upload, Play, Pause, Square, FileAudio, Share2, Link, Copy, Check, Download, AlertCircle, X } from 'lucide-angular';

import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    importProvidersFrom(LucideAngularModule.pick({ Mic, Upload, Play, Pause, Square, FileAudio, Share2, Link, Copy, Check, Download, AlertCircle, X }))
  ]
};
