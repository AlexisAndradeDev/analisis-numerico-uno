import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { derivative, evaluate } from 'mathjs';
import { Iteration } from '../interface/iteration';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexTitleSubtitle, ApexMarkers } from 'ng-apexcharts';

@Component({
  selector: 'app-newton-raphson',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgApexchartsModule],
  templateUrl: './newton-raphson.component.html',
  styleUrls: ['./newton-raphson.component.scss']
})
export class NewtonRaphsonComponent {
  form: FormGroup;
  iterations: Iteration[] = [];
  currentIterationIndex: number = 0;

  chartSeries: ApexAxisChartSeries = [];
  chart: ApexChart = {
    type: 'line',
    height: 350
  };
  xaxis: ApexXAxis = {
    title: {
      text: 'X'
    }
  };
  yaxis: ApexYAxis = {
    title: {
      text: 'Y'
    }
  };
  title: ApexTitleSubtitle = {
    text: 'Función y tangente en x0',
    align: 'left'
  };
  markers: ApexMarkers = {
    size: 3,
    colors: ['#FF4560'],
    strokeColors: '#fff',
    strokeWidth: 0,
    hover: {
      size: 7
    }
  };

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
    this.updateChart();
  }

  nextIteration() {
    if (this.currentIterationIndex < this.iterations.length - 1) {
      this.currentIterationIndex++;
      this.updateChart();
    }
  }

  prevIteration() {
    if (this.currentIterationIndex > 0) {
      this.currentIterationIndex--;
      this.updateChart();
    }
  }

  updateChart() {
    const currentIteration = this.iterations[this.currentIterationIndex];
    const x0 = currentIteration.x0;
    const fx0 = currentIteration.fx0;
    const fpx0 = currentIteration.fpx0;

    const xValues = Array.from({ length: 20 }, (_, i) => x0 - 2 + i * 0.2);
    const yValues = xValues.map(x => evaluate(this.form.value.function, { x }));

    // tangente (primera derivada)
    const tangentValues = xValues.map(x => fx0 + fpx0 * (x - x0));

    this.chartSeries = [
      {
        name: 'f(x0)',
        data: xValues.map((x, i) => ({ x, y: yValues[i] }))
      },
      {
        name: 'f\'(x0)',
        data: xValues.map((x, i) => ({ x, y: tangentValues[i] }))
      },
      {
        name: 'x0',
        data: [{ x: x0, y: fx0 }]
      }
    ];
  }
}