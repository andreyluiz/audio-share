import { Component, inject, signal, OnInit, ElementRef, ViewChild, AfterViewInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AudioService, AudioRecord } from '../services/audio.service';
import { LucideAngularModule } from 'lucide-angular';
import { Title, Meta } from '@angular/platform-browser';
import * as QRCode from 'qrcode';
import WaveSurfer from 'wavesurfer.js';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-share',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 relative overflow-hidden">
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20 space-y-4">
          <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p class="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading audio...</p>
        </div>
      } @else if (error()) {
        <div class="text-center py-12 p-6">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-icon name="alert-circle" [size]="32"></lucide-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-2">Audio Not Found</h2>
          <p class="text-slate-500 dark:text-slate-400 mb-6">The audio link you are trying to access is invalid or expired.</p>
          <a routerLink="/" class="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline">Create New Audio</a>
        </div>
      } @else {
      
      <!-- Background Image (Full Width Header) -->
      @if (audio()?.image_public_url) {
        <div class="relative w-full h-64 z-0">
            <img [src]="audio()?.image_public_url" class="w-full h-full object-cover">
            <!-- Fade to background color -->
            <div class="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-white via-white/80 to-transparent dark:from-slate-800 dark:via-slate-800/80 dark:to-transparent"></div>
        </div>
      }

      <div class="relative z-10 px-8 pb-8" [class.pt-8]="!audio()?.image_public_url" [class.-mt-12]="audio()?.image_public_url">
        <div class="text-center mb-8">
          @if (!audio()?.image_public_url) {
            <div class="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm transform -rotate-3">
                <lucide-icon name="share-2" [size]="32"></lucide-icon>
            </div>
          }

          <h1 class="text-3xl font-bold text-center mb-2 text-slate-800 dark:text-white drop-shadow-sm">{{ audio()?.title }}</h1>
          <p class="text-sm text-center mb-8 text-slate-500 dark:text-slate-400 font-medium">Shared via AudioShare</p>
        </div>

        <!-- Audio Player Custom -->
        <div class="mb-8 p-4 rounded-xl bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm border border-slate-100 dark:border-slate-700/50 shadow-sm">
            <div #waveform class="w-full mb-4"></div>
            
            <div class="flex justify-center">
                <button 
                  (click)="togglePlay()"
                  class="w-16 h-16 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
                >
                  <lucide-icon [name]="isPlaying() ? 'pause' : 'play'" [size]="32"></lucide-icon>
                </button>
            </div>
        </div>

        <div class="space-y-6">
          <!-- QR Code -->
          <div class="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-700 border-2 border-dashed border-slate-200 dark:border-slate-600 rounded-xl relative overflow-hidden group">
             <canvas #qrCanvas class="w-48 h-48"></canvas>
             <button (click)="shareQR()" class="mt-4 text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 uppercase tracking-wider flex items-center gap-1 active:scale-95 transition-transform">
                <lucide-icon name="share-2" [size]="14"></lucide-icon> Share QR
             </button>
          </div>

          <!-- Link Copy -->
          <div class="relative">
            <label class="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 pl-1">Share Link</label>
            <div class="flex shadow-sm rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-indigo-100 dark:focus-within:ring-indigo-900 transition-all">
              <div class="flex-grow bg-slate-50 dark:bg-slate-900 px-4 py-3 text-slate-600 dark:text-slate-300 text-sm truncate select-all">{{ shareUrl() }}</div>
              <button 
                (click)="copyLink()"
                class="bg-white dark:bg-slate-700 border-l border-slate-200 dark:border-slate-600 px-4 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center min-w-[60px]"
                [title]="copied() ? 'Copied' : 'Copy Link'"
              >
                <lucide-icon [name]="copied() ? 'check' : 'copy'" [size]="20" [class.text-green-500]="copied()"></lucide-icon>
              </button>
            </div>
          </div>
          
          <div class="pt-4 border-t border-slate-100 dark:border-slate-700">
             <a routerLink="/" class="block text-center text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 py-2">
                Create your own audio link
             </a>
          </div>
        </div>
      </div>
      }
    </div>
  </div>
  `
})
export class ShareComponent implements OnInit, AfterViewInit {
  route = inject(ActivatedRoute);
  audioService = inject(AudioService);
  titleService = inject(Title);
  metaService = inject(Meta);
  platformId = inject(PLATFORM_ID);

  loading = signal(true);
  error = signal(false);
  audio = signal<AudioRecord | undefined>(undefined);
  audioUrl = signal<string | null>(null);

  // Share info
  shareUrl = signal('');
  copied = signal(false);

  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild('waveform', { static: false }) waveformContainer!: ElementRef<HTMLElement>;
  private wavesurfer: WaveSurfer | null = null;
  isPlaying = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    const fullShareUrl = `${environment.baseUrl}/s/${id}`;
    this.shareUrl.set(fullShareUrl);

    this.audioService.getAudio(id).subscribe({
      next: (record) => {
        this.loading.set(false);

        if (record) {
          this.audio.set(record);

          // SEO Metadata
          this.titleService.setTitle(`${record.title} | AudioShare`);
          this.metaService.updateTag({ name: 'description', content: 'Listen to this audio shared via AudioShare' });
          this.metaService.updateTag({ property: 'og:title', content: record.title });
          this.metaService.updateTag({ property: 'og:description', content: 'Listen to this audio shared via AudioShare' });
          this.metaService.updateTag({ property: 'og:url', content: fullShareUrl });

          if (record.image_public_url) {
            this.metaService.updateTag({ property: 'og:image', content: record.image_public_url });
            this.metaService.updateTag({ name: 'twitter:image', content: record.image_public_url });
            this.metaService.updateTag({ name: 'twitter:card', content: 'summary_large_image' });
          } else {
            this.metaService.updateTag({ name: 'twitter:card', content: 'summary' });
          }

          if (isPlatformBrowser(this.platformId)) {
            this.generateQR();
            setTimeout(() => this.initWaveSurfer(record.public_url), 50);
          }
        } else {
          this.error.set(true);
        }
      },
      error: () => {
        this.loading.set(false);
        this.error.set(true);
      }
    });
  }

  ngAfterViewInit() {
    // QR generation handled in subscribe
  }

  ngOnDestroy() {
    if (this.wavesurfer) {
      this.wavesurfer.destroy();
    }
  }

  private initWaveSurfer(url: string) {
    if (this.wavesurfer) return; // Already initialized

    if (!this.waveformContainer) {
      console.error('Waveform container not found!');
      return;
    }

    console.log('Initializing WaveSurfer with URL:', url);

    this.wavesurfer = WaveSurfer.create({
      container: this.waveformContainer.nativeElement,
      waveColor: '#a5b4fc', // Indigo 300
      progressColor: '#4f46e5', // Indigo 600
      cursorColor: '#4338ca',
      barWidth: 2,
      barGap: 3,
      barRadius: 3,
      height: 128,
      normalize: true,
      backend: 'MediaElement', // Try MediaElement to avoid CORS issues with Web Audio
    });

    this.wavesurfer.load(url);

    this.wavesurfer.on('ready', () => console.log('WaveSurfer Ready'));
    this.wavesurfer.on('error', (e) => console.error('WaveSurfer Error:', e));
    this.wavesurfer.on('play', () => this.isPlaying.set(true));
    this.wavesurfer.on('pause', () => this.isPlaying.set(false));
    this.wavesurfer.on('finish', () => this.isPlaying.set(false));
  }

  togglePlay() {
    console.log('Toggle Play Clicked. Instance:', !!this.wavesurfer);
    if (this.wavesurfer) {
      this.wavesurfer.playPause();
    }
  }

  generateQR() {
    // We need to wait for the view to update with the canvas if it was conditional, 
    // but it's inside an @else block dependent on loading, so we use a small timeout or effect
    // Since we call this from subscribe, the view might not be ready if we just switched from loading.
    setTimeout(() => {
      if (this.qrCanvas?.nativeElement) {
        QRCode.toCanvas(this.qrCanvas.nativeElement, this.shareUrl(), {
          width: 200,
          margin: 2,
          color: {
            dark: '#1e293b', // slate-800
            light: '#ffffff'
          }
        }, (error) => {
          if (error) console.error(error);
        });
      }
    }, 100);
  }

  shareQR() {
    const canvas = this.qrCanvas?.nativeElement;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], 'audio-share-qr.png', { type: 'image/png' });

      if (navigator.share) {
        try {
          await navigator.share({
            title: this.audio()?.title || 'Shared Audio',
            text: 'Scan this QR code to listen to the audio.',
            files: [file]
          });
        } catch (err) {
          console.error('Error sharing', err);
        }
      } else {
        alert('Sharing not supported on this device/browser.');
      }
    });
  }

  copyLink() {
    navigator.clipboard.writeText(this.shareUrl()).then(() => {
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2000);
    });
  }
}
