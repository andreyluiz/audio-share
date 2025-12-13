import { Component, inject, signal, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AudioService, AudioRecord } from '../services/audio.service';
import { LucideAngularModule } from 'lucide-angular';
import * as QRCode from 'qrcode';

@Component({
  selector: 'app-share',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, RouterLink],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
      @if (loading()) {
        <div class="flex flex-col items-center justify-center py-20 space-y-4">
          <div class="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
          <p class="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Loading audio...</p>
        </div>
      } @else if (error()) {
        <div class="text-center py-12">
          <div class="w-16 h-16 bg-red-50 dark:bg-red-900/30 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <lucide-icon name="alert-circle" [size]="32"></lucide-icon>
          </div>
          <h2 class="text-xl font-bold text-slate-800 dark:text-white mb-2">Audio Not Found</h2>
          <p class="text-slate-500 dark:text-slate-400 mb-6">The audio link you are trying to access is invalid or expired.</p>
          <a routerLink="/" class="text-indigo-600 dark:text-indigo-400 font-medium hover:text-indigo-700 dark:hover:text-indigo-300 hover:underline">Create New Audio</a>
        </div>
      } @else {
        <div class="text-center mb-8">
          <div class="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm transform -rotate-3">
            <lucide-icon name="share-2" [size]="32"></lucide-icon>
          </div>
          <h1 class="text-2xl font-bold text-slate-900 dark:text-white mb-2">{{ audio()?.title }}</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400">Shared via AudioShare</p>
        </div>

        <div class="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-8">
          <audio [src]="audioUrl()" controls class="w-full"></audio>
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
      }
      </div>
    </div>
  `
})
export class ShareComponent implements OnInit, AfterViewInit {
  route = inject(ActivatedRoute);
  audioService = inject(AudioService);

  loading = signal(true);
  error = signal(false);
  audio = signal<AudioRecord | undefined>(undefined);
  audioUrl = signal<string | null>(null);

  // Share info
  shareUrl = signal('');
  copied = signal(false);

  @ViewChild('qrCanvas') qrCanvas!: ElementRef<HTMLCanvasElement>;

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error.set(true);
      this.loading.set(false);
      return;
    }

    this.shareUrl.set(window.location.href);

    this.audioService.getAudio(id).subscribe({
      next: (record) => {
        if (record) {
          this.audio.set(record);
          this.audioUrl.set(record.public_url); // Use public URL from Supabase
          this.generateQR();
        } else {
          this.error.set(true);
        }
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      }
    });
  }

  ngAfterViewInit() {
    // Attempt QR generation if data is already ready (unlikely due to delay, but safe)
    if (this.audio()) {
      this.generateQR();
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
