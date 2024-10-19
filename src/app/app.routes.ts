import { Routes } from '@angular/router';
import { GaussSeidelComponent } from './gauss-seidel/gauss-seidel.component';
import { GaussJordanComponent } from './gauss-jordan/gauss-jordan.component';
import { NewtonRaphsonComponent } from './newton-raphson/newton-raphson.component';
import { LagrangeComponent } from './lagrange/lagrange.component';

export const routes: Routes = [
    { path: 'gauss-seidel', component: GaussSeidelComponent, title: "Gauss-Seidel" },
    { path: 'gauss-jordan', component: GaussJordanComponent, title: "Gauss-Jordan" },
    { path: 'newton-raphson', component: NewtonRaphsonComponent, title: "Newton-Raphson" },
    { path: 'lagrange', component: LagrangeComponent, title: "Lagrange" },
    { path: '', redirectTo: '/gauss-seidel', pathMatch: 'full' },
];
