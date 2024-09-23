import { CommonModule } from '@angular/common';
import { AfterViewInit, Component } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { derivative, equal, evaluate, isComplex, isZero, parse, round, smaller } from 'mathjs';
import { Iteration } from '../interface/iteration';
import { NgApexchartsModule } from 'ng-apexcharts';
import { ApexAxisChartSeries, ApexChart, ApexXAxis, ApexYAxis, ApexTitleSubtitle, ApexMarkers } from 'ng-apexcharts';

declare var MathJax: any;

@Component({
  selector: 'app-newton-raphson',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, NgApexchartsModule, FormsModule],
  templateUrl: './newton-raphson.component.html',
  styleUrls: ['./newton-raphson.component.scss']
})
export class NewtonRaphsonComponent implements AfterViewInit {
  form: FormGroup;
  iterations: Iteration[] = [];
  currentIterationIndex: number = 0;
  chartSeries: ApexAxisChartSeries = [];
  chart: ApexChart = {
    type: 'line',
    height: 500,
  };
  xaxis: ApexXAxis = {
    title: {
      text: 'x0'
    },
    tickAmount: 4,
    decimalsInFloat: 5
  };
  yaxis: ApexYAxis = {
    title: {
      text: 'f(x0)'
    },
    tickAmount: 4,
    decimalsInFloat: 5
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
  errorMessage: string = '';
  root: number | undefined;

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      function: ['', Validators.required],
      initialGuess: ['', [Validators.required]],
      tolerance: ['', [Validators.required, Validators.pattern(/^\d+(\.\d+)?$/)]],
      maxIterations: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
      decimals: ['', [Validators.required, Validators.pattern(/^\d+$/)]],
    });

    this.form.get('function')?.valueChanges.subscribe(value => {
      this.renderMath(value);
    });
  }

  ngAfterViewInit() {
    this.renderMath(this.form.get('function')?.value);
  }

  numberIsNan(num: number) {
    return Number.isNaN(num);
  }

  rootFoundWhenX1IsZero(x0: number, x1: number) {
    return equal(x0, x1) && isZero(x1);
  }

  renderMath(f: string) {
    const functionLatex = document.getElementById('function-latex');
    if (functionLatex) {
      try {
        const parsed = parse(f);
        const latex = parsed.toTex();
        functionLatex.innerHTML = `$$${latex}$$`;
        MathJax.typesetPromise([functionLatex]);  
      } catch (error) {
        functionLatex.textContent = 'Función no válida.';
      }
    }

    const derivative1Latex = document.getElementById('derivative-1-latex');
    if (derivative1Latex) {
      try {
        const parsed = derivative(parse(f), 'x');
        const latex = parsed.toTex();
        derivative1Latex.innerHTML = `$$${latex}$$`;
        MathJax.typesetPromise([derivative1Latex]);  
      } catch (error) {
        derivative1Latex.textContent = 'Función no válida.';
      }
    }

    const derivative2Latex = document.getElementById('derivative-2-latex');
    if (derivative2Latex) {
      try {
        const parsed = derivative(derivative(f, 'x'), 'x');
        const latex = parsed.toTex();
        derivative2Latex.innerHTML = `$$${latex}$$`;
        MathJax.typesetPromise([derivative2Latex]);  
      } catch (error) {
        derivative2Latex.textContent = 'Función no válida.';
      }
    }
  }

  addIteration(x0: number, x1: number, fx0: number, fpx0: number, fppx0: number,
      error: number) {
    this.iterations.push({ x0, x1, fx0, fpx0, fppx0, error });
  }

  ifComplexZeroReturnRealZero(num: number) {
    if (isZero(num)) return 0;
    return num;
  }

  findRoot() {
    this.iterations = [];
    this.errorMessage = '';
    const { function: func, initialGuess, tolerance, maxIterations, decimals } = this.form.value;

    // verificar si la función es parseable
    try {
      parse(func);
    } catch (error) {
      this.errorMessage = 'La función introducida no es válida.';
      return;
    }

    const f = (x: number) => evaluate(func, { x });
    const fDerivative1 = (x: number) => derivative(func, 'x').evaluate({ x });
    const fDerivative2 = (x: number) => derivative(derivative(func, 'x'), 'x').evaluate({ x });

    let x0 = evaluate(initialGuess);
    const tolerance_ = parseFloat(tolerance) / 100;
    const maxIterations_ = parseInt(maxIterations, 10);
    const decimals_ = parseInt(decimals, 10);
    this.iterations = [];
    let x1;
    let iter = 0;
    this.root = undefined;

    while (iter < maxIterations_) {
      x0 = this.ifComplexZeroReturnRealZero(round(x0, decimals_));

      let fx0, fpx0, fppx0;
      try {
        fx0 = round(f(x0), decimals_);
        fpx0 = round(fDerivative1(x0), decimals_);
        fppx0 = round(fDerivative2(x0), decimals_);
      } catch (error) {
        this.addIteration(x0, NaN, NaN, NaN, NaN, NaN);
        this.errorMessage = 'Error al evaluar la función. Puede que haya valores imaginarios o la función esté mal escrita.';
        break;
      }

      x1 = this.ifComplexZeroReturnRealZero(round(
        evaluate(`${x0} - (${fx0} * ${fpx0}) / (${fpx0} * ${fpx0} - ${fx0} * ${fppx0})`), 
        decimals_
      ))

      if (Number.isNaN(x1) && !isZero(fx0)) {
        this.addIteration(x0, NaN, fx0, fpx0, fppx0, NaN);
        this.errorMessage = 'x1 tomó un valor NaN (inválido). Usualmente debido a que se realizaron operaciones con complejos o funciones fuera de su dominio (como logaritmos para números negativos).';
        break;
      }

      let error: number;
      // En ocasiones como sin((x)*(pi/180)), se llega a x1=x0=0 y se 
      // produciría división entre cero cíclica
      if (equal(x1, x0)) error = 0
      else error = round(evaluate(`abs((${x1} - ${x0}) / ${x1})`), decimals_);

      // En algunas ocasiones, se llega a la raíz pero se obtiene NaN en x1 y 
      // por consecuencia en el error también. 
      // Por ejemplo, en 2x^e, f(x) y todas las derivadas son 0 en la raíz 
      // x = 0 y x1 resulta NaN, pero la raíz es encontrada
      if (isZero(fx0)) {
        this.addIteration(x0, x1, fx0, fpx0, fppx0, error);
        this.root = x0;
        break;
      }

      this.addIteration(x0, x1, fx0, fpx0, fppx0, error);

      if (smaller(error, tolerance_)) {
        this.root = x1;
        break;
      }

      x0 = x1;
      iter++;
    }

    if (this.root === undefined && !this.errorMessage) this.errorMessage = 'No se encontró una raíz en el límite de iteraciones establecido.'

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
    const xValues = Array.from({ length: 400 }, (_, i) => x0 - 5 + i * 0.025);
    const yValues = xValues.map(x => evaluate(this.form.value.function, { x }));
    const tangentValues = xValues.map(x => fx0 + fpx0 * (x - x0));

    this.chartSeries = [
      {
        name: 'f(x0)',
        data: xValues.map((x, i) => ({ x: x, y: yValues[i] })).filter(point => !isComplex(point.y) && !Number.isNaN(point.y) && Number.isFinite(point.y))
      },
      {
        name: 'f\'(x0)',
        data: xValues.map((x, i) => ({ x: x, y: tangentValues[i] })).filter(point => !isComplex(point.y) && !Number.isNaN(point.y) && Number.isFinite(point.y))
      },
      {
        name: 'x0',
        data: !isComplex(fx0) && !Number.isNaN(fx0) && Number.isFinite(fx0) ? [{ x: x0, y: fx0 }] : [],
        color: '#FF4560'
      }
    ];
  }
}