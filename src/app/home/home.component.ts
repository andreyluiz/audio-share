import { Component, inject, signal, computed, ViewChild, ElementRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AudioService } from '../services/audio.service';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-4 bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
      <div class="w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-100 dark:border-slate-700 p-6">
        <h1 class="text-3xl font-bold text-center mb-8 text-slate-800 dark:text-white">Share Audio</h1>

        <!-- Error Message -->
        @if (errorMessage()) {
          <div class="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-start gap-3">
             <div class="text-red-500 dark:text-red-400 mt-0.5"><lucide-icon name="alert-circle" [size]="20"></lucide-icon></div>
             <div>
               <h3 class="text-sm font-semibold text-red-800 dark:text-red-300">Error</h3>
               <p class="text-sm text-red-600 dark:text-red-400 mt-1">{{ errorMessage() }}</p>
             </div>
             <button (click)="errorMessage.set(null)" class="text-red-400 hover:text-red-600 dark:hover:text-red-300 ml-auto"><lucide-icon name="x" [size]="16"></lucide-icon></button>
          </div>
        }

        <!-- Title Input & Cover Image -->
        <div class="mb-6 space-y-4">
          <div>
            <label class="block text-sm font-medium text-slate-600 dark:text-slate-300 mb-2">Title</label>
            <input 
              [formControl]="titleControl"
              type="text" 
              placeholder="Give your audio a name..." 
              class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 dark:focus:ring-indigo-900 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <!-- Cover Image Selector -->
          <div class="flex items-center gap-4">
            <button 
              (click)="imageInput.click()"
              class="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              <div class="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center border border-slate-200 dark:border-slate-600">
                @if (imageFile()) {
                   <img [src]="imagePreviewUrl()" class="w-full h-full object-cover rounded-lg" />
                } @else {
                   <lucide-icon name="image" [size]="18"></lucide-icon>
                }
              </div>
              {{ imageFile() ? 'Change Cover Image' : 'Add Cover Image (Optional)' }}
            </button>
            
            @if (imageFile()) {
                <button (click)="removeImage()" class="text-slate-400 hover:text-red-500 transition-colors p-1">
                    <lucide-icon name="x" [size]="16"></lucide-icon>
                </button>
            }

            <input 
              #imageInput
              type="file" 
              accept="image/*" 
              class="hidden"
              (change)="onImageSelected($event)"
            />
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex p-1 bg-slate-50 dark:bg-slate-900 rounded-xl mb-6 border border-slate-100 dark:border-slate-700">
          <button 
            (click)="mode.set('record')"
            [class.bg-white]="mode() === 'record'"
            [class.dark:bg-slate-700]="mode() === 'record'"
            [class.shadow-sm]="mode() === 'record'"
            [class.text-indigo-600]="mode() === 'record'"
            [class.dark:text-indigo-400]="mode() === 'record'"
            class="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center gap-2"
          >
            <lucide-icon name="mic" [size]="18"></lucide-icon>
            Record
          </button>
          <button 
            (click)="mode.set('upload')"
            [class.bg-white]="mode() === 'upload'"
            [class.dark:bg-slate-700]="mode() === 'upload'"
            [class.shadow-sm]="mode() === 'upload'"
            [class.text-indigo-600]="mode() === 'upload'"
            [class.dark:text-indigo-400]="mode() === 'upload'"
            class="flex-1 py-2.5 rounded-lg text-sm font-medium text-slate-500 dark:text-slate-400 transition-all flex items-center justify-center gap-2"
          >
            <lucide-icon name="upload" [size]="18"></lucide-icon>
            Upload
          </button>
        </div>

        <!-- Record Mode -->
      <div *ngIf="mode() === 'record'" class="flex flex-col items-center justify-center py-8 min-h-[12rem] bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 mb-6 relative overflow-hidden">
        
        <!-- Live Visualizer Background -->
        <canvas #visualizerCanvas class="absolute inset-0 w-full h-full opacity-30 pointer-events-none"></canvas>

        @if (!recordedBlob()) {
          <div class="relative mb-4 group z-10">
            <div *ngIf="isRecording()" class="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-20"></div>
            <button 
              (click)="toggleRecording()"
              [class.bg-red-500]="isRecording()"
              [class.bg-indigo-600]="!isRecording()"
              class="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <lucide-icon [name]="isRecording() ? 'square' : 'mic'" [size]="32"></lucide-icon>
            </button>
          </div>
          <p class="text-sm font-medium text-slate-500 dark:text-slate-400 z-10">
            {{ isRecording() ? 'Recording... ' + recordingTime() + 's' : 'Tap to Record' }}
          </p>
        } @else {
          <div class="w-full px-6 z-10">
            <div class="flex items-center justify-between bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm mb-4">
              <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-full bg-indigo-50 dark:bg-indigo-900/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                  <lucide-icon name="file-audio" [size]="20"></lucide-icon>
                </div>
                <div>
                  <p class="text-sm font-medium text-slate-700 dark:text-slate-200">Recorded Audio</p>
                  <p class="text-xs text-slate-400 dark:text-slate-500">{{ (recordedBlob()?.size || 0) / 1024 | number:'1.0-1'}} KB</p>
                </div>
              </div>
              <button 
                (click)="resetRecording()"
                class="text-xs font-medium text-red-500 hover:text-red-600 px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
              >
                Delete
              </button>
            </div>
            
            <audio [src]="recordedUrl()" controls class="w-full mb-2"></audio>
          </div>
        }
      </div>

        <!-- Upload Mode -->
        <div *ngIf="mode() === 'upload'" class="mb-6">
          <div 
            (dragover)="onDragOver($event)"
            (dragleave)="onDragLeave($event)"
            (drop)="onDrop($event)"
            [class.border-indigo-500]="isDragging()"
            [class.bg-indigo-50]="isDragging()"
            [class.dark:bg-indigo-900]="isDragging()"
            class="relative w-full h-48 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 flex flex-col items-center justify-center transition-all overflow-hidden"
          >
            <input 
              type="file" 
              accept="audio/*" 
              (change)="onFileSelected($event)" 
              class="absolute inset-0 opacity-0 cursor-pointer z-10"
            />
            
            @if (!uploadedFile()) {
              <div class="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
                <lucide-icon name="upload" [size]="24"></lucide-icon>
              </div>
              <p class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Click or drag file to upload</p>
              <p class="text-xs text-slate-400 dark:text-slate-500">MP3, WAV, M4A up to 10MB</p>
            } @else {
              <div class="flex flex-col items-center z-20 pointer-events-none">
                <div class="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center mb-3 shadow-md">
                  <lucide-icon name="file-audio" [size]="28"></lucide-icon>
                </div>
                <p class="text-sm font-medium text-slate-800 dark:text-white text-center max-w-[200px] truncate">{{ uploadedFile()?.name }}</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">{{ (uploadedFile()?.size || 0) / 1024 | number:'1.1-1' }} KB</p>
              </div>
              <button (click)="uploadedFile.set(null); $event.stopPropagation()" class="absolute top-2 right-2 z-30 p-1.5 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm border border-slate-100 dark:border-slate-700">
                 <lucide-icon name="x" [size]="16"></lucide-icon>
              </button>
            }
          </div>
        </div>

        <!-- Submit Button -->
        <button 
          (click)="submit()"
          [disabled]="isSubmitting() || titleControl.invalid || (!recordedBlob() && !uploadedFile())"
          class="w-full py-3.5 rounded-xl bg-indigo-600 text-white font-medium shadow-lg shadow-indigo-200 dark:shadow-indigo-900/50 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
        >
          @if (isSubmitting()) {
            <div class="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            Creating...
          } @else {
            Create & Share
          }
        </button>
      </div>
    </div>
  `
})
export class HomeComponent implements OnDestroy {
  audioService = inject(AudioService);
  router = inject(Router);

  @ViewChild('visualizerCanvas') visualizerCanvas!: ElementRef<HTMLCanvasElement>;

  // Form Controls
  titleControl = new FormControl('', [Validators.required, Validators.minLength(3)]);

  // UI State
  mode = signal<'record' | 'upload'>('record');
  isRecording = signal(false);
  recordingTime = signal(0);

  // Audio State
  recordedBlob = signal<Blob | null>(null);
  recordedUrl = signal<string | null>(null); // Changed from computed to signal as per instruction
  uploadedFile = signal<File | null>(null);
  isDragging = signal(false);

  // Cover Image State
  imageFile = signal<File | null>(null);
  imagePreviewUrl = signal<string | null>(null);

  // Submit State
  isSubmitting = signal(false);

  // Media Recorder State
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = []; // Renamed from 'chunks'
  private timerInterval: any;

  // Audio Visualizer State
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private dataArray: Uint8Array | null = null;
  private animationId: number | null = null;
  private stream: MediaStream | null = null; // Moved stream here

  // Error State
  errorMessage = signal<string | null>(null);

  ngOnDestroy() {
    this.stopWrapper();
  }

  private stopWrapper() {
    this.stopTimer();
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
    }
    if (this.stream) { // Ensure stream tracks are stopped
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.cancelVisualization();
  }

  async toggleRecording() {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  private async startRecording() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.errorMessage.set('Audio recording is not supported in this browser or environment (requires secure context like https or localhost).');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.stream = stream; // Store the stream
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      // Setup Visualizer
      this.setupVisualizer(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.onstop = () => {
        const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.recordedBlob.set(blob);
        this.recordedUrl.set(URL.createObjectURL(blob));
        // Stream tracks are stopped in stopWrapper or resetRecording if needed
        this.cancelVisualization();
      };

      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.startTimer();
      this.visualize();
    } catch (err: any) {
      console.error('Error accessing microphone', err);
      if (err.name === 'NotAllowedError') {
        this.errorMessage.set('Microphone access denied. Please check your browser settings.');
      } else if (err.name === 'NotFoundError') {
        this.errorMessage.set('No microphone found. Please connect a microphone.');
      } else {
        this.errorMessage.set('Could not access microphone: ' + (err.message || 'Unknown error'));
      }
    }
  }

  private stopRecording() {
    if (this.mediaRecorder) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
      this.stopTimer();
      // The onstop event handler will take care of recordedBlob, recordedUrl, and cancelVisualization
    }
  }

  private setupVisualizer(stream: MediaStream) {
    this.audioContext = new AudioContext();
    const source = this.audioContext.createMediaStreamSource(stream);
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 256;
    source.connect(this.analyser);
    const bufferLength = this.analyser.frequencyBinCount;
    this.dataArray = new Uint8Array(bufferLength);
  }

  private visualize() {
    if (!this.analyser || !this.visualizerCanvas) return;

    const canvas = this.visualizerCanvas.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions for proper drawing
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    const width = canvas.width;
    const height = canvas.height;

    const draw = () => {
      this.animationId = requestAnimationFrame(draw);

      if (this.analyser && this.dataArray) {
        this.analyser.getByteFrequencyData(this.dataArray as any);
      }

      ctx.clearRect(0, 0, width, height);

      if (!this.dataArray) return;

      const barWidth = (width / this.dataArray.length) * 2.5;
      let barHeight;
      let x = 0;

      for (let i = 0; i < this.dataArray.length; i++) {
        barHeight = this.dataArray[i] / 2;

        // Gradient for bars
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        gradient.addColorStop(0, '#6366f1'); // Indigo 500
        gradient.addColorStop(1, '#a5b4fc'); // Indigo 300

        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth, barHeight);

        x += barWidth + 1;
      }
    };

    draw();
  }

  private cancelVisualization() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    // Clear canvas
    if (this.visualizerCanvas?.nativeElement) {
      const ctx = this.visualizerCanvas.nativeElement.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, this.visualizerCanvas.nativeElement.width, this.visualizerCanvas.nativeElement.height);
    }
  }

  resetRecording() {
    this.recordedBlob.set(null);
    this.recordedUrl.set(null); // Clear the URL
    this.audioChunks = [];
    if (this.stream) { // Stop stream tracks if recording was active
      this.stream.getTracks().forEach(t => t.stop());
      this.stream = null;
    }
    this.cancelVisualization(); // Ensure visualizer is off
  }

  private startTimer() {
    this.recordingTime.set(0);
    this.timerInterval = setInterval(() => {
      this.recordingTime.update(t => t + 1);
    }, 1000);
  }

  private stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Upload Logic
  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      this.imageFile.set(file);
      this.imagePreviewUrl.set(URL.createObjectURL(file));
    }
  }

  removeImage() {
    this.imageFile.set(null);
    this.imagePreviewUrl.set(null);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      this.uploadedFile.set(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging.set(false);
    const file = event.dataTransfer?.files[0];
    if (file && file.type.startsWith('audio/')) {
      this.uploadedFile.set(file);
    }
  }

  // Submit Logic
  submit() {
    if (this.titleControl.invalid) return;

    const blob = this.recordedBlob();
    const file = this.uploadedFile();

    if (!blob && !file) return;

    this.isSubmitting.set(true);
    const title = this.titleControl.value!;
    const image = this.imageFile() || undefined;

    // Determine what to upload
    const uploadData = blob || file!;

    this.audioService.createAudio(uploadData, title, image).subscribe({
      next: (id) => {
        this.router.navigate(['/s', id]);
      },
      error: (err) => {
        console.error('Upload failed', err);
        this.isSubmitting.set(false);
        this.errorMessage.set('Upload failed. Please try again.');
      }
    });
  }
}
