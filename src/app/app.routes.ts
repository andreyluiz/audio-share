import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ShareComponent } from './share/share.component';
import { audioResolver } from './resolvers/audio.resolver';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 's/:id', component: ShareComponent, resolve: { audio: audioResolver } },
    { path: '**', redirectTo: '' }
];
