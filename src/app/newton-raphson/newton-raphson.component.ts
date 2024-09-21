import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { derivative, evaluate } from 'mathjs';
import { Iteration } from '../interface/iteration';

@Component({
  selector: 'app-newton-raphson',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './newton-raphson.component.html',
  styleUrl: './newton-raphson.component.scss'
})
export class NewtonRaphsonComponent {
  form: FormGroup;
  iterations: Iteration[] = [];
  currentIterationIndex: number = 0;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      function: ['', Validators.required],
      initialGuess: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/)]],
      tolerance: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
      maxIterations: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    });
  }

  findRoot() {
    const { function: func, initialGuess, tolerance, maxIterations } = this.form.value;
    const f = (x: number) => evaluate(func, { x });
    const fPrime = (x: number) => derivative(func, 'x').evaluate({ x });
    const fDoublePrime = (x: number) => derivative(derivative(func, 'x'), 'x').evaluate({ x });

    let x0 = parseFloat(initialGuess);
    const tol = parseFloat(tolerance);
    const maxIter = parseInt(maxIterations, 10);

    this.iterations = [];
    let x1;
    let iter = 0;

    while (iter < maxIter) {
      const fx0 = f(x0);
      const fpx0 = fPrime(x0);
      const fppx0 = fDoublePrime(x0);

      if (Math.abs(fpx0) < 1e-10) {
        this.iterations.push({
          x0,
          x1: NaN,
          fx0,
          fpx0,
          fppx0,
          error: NaN,
        });
        break;
      }

      x1 = x0 - (fx0 * fpx0) / (fpx0 * fpx0 - fx0 * fppx0);
      const error = Math.abs((x1 - x0) / x1);

      this.iterations.push({
        x0,
        x1,
        fx0,
        fpx0,
        fppx0,
        error,
      });

      if (error < tol) {
        break;
      }

      x0 = x1;
      iter++;
    }

    this.currentIterationIndex = this.iterations.length - 1;
  }

  nextIteration() {
    if (this.currentIterationIndex < this.iterations.length - 1) {
      this.currentIterationIndex++;
    }
  }

  prevIteration() {
    if (this.currentIterationIndex > 0) {
      this.currentIterationIndex--;
    }
  }
}
