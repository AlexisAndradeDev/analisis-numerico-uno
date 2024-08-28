import { Routes } from '@angular/router';
import { GaussSeidelComponent } from './gauss-seidel/gauss-seidel.component';

export const routes: Routes = [
    { path: 'gauss-seidel', component: GaussSeidelComponent, title: "Gauss-Seidel" },
];
