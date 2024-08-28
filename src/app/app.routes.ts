import { Routes } from '@angular/router';
import { GaussSeidelComponent } from './gauss-seidel/gauss-seidel.component';
import { GaussJordanComponent } from './gauss-jordan/gauss-jordan.component';

export const routes: Routes = [
    { path: 'gauss-seidel', component: GaussSeidelComponent, title: "Gauss-Seidel" },
    { path: 'gauss-jordan', component: GaussJordanComponent },
    { path: '', redirectTo: '/gauss-seidel', pathMatch: 'full' }
];
