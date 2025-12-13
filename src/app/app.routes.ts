import { Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { ShareComponent } from './share/share.component';

export const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 's/:id', component: ShareComponent },
    { path: '**', redirectTo: '' }
];
