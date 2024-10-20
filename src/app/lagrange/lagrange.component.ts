import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Point } from 'chart.js';
import { isNaN, isNumber, round } from 'mathjs';
import nerdamer from 'nerdamer';
import { NgApexchartsModule } from 'ng-apexcharts';

declare var MathJax: any;

@Component({
  selector: 'app-lagrange',
  standalone: true,
  imports: [FormsModule, CommonModule, NgApexchartsModule],
  templateUrl: './lagrange.component.html',
  styleUrl: './lagrange.component.scss'
})
export class LagrangeComponent implements AfterViewInit {
  numPoints: number = 1;
  points: Point[] = [];
  result: number | undefined = undefined;
  x: number = NaN;

  constructor() {
  }

  ngAfterViewInit() {
    this.updatePoints();
  }

  updatePoints() {
    if (Number.isInteger(this.numPoints) && this.numPoints > 0) {
      // eliminar los últimos elementos si el número de puntos debe ser menor
      // a la longitud de la lista de puntos actual
      if (this.points.length > this.numPoints) {
        this.points = this.points.slice(0, this.numPoints);
      }
      // fillear elementos añadidos con (0, 0)
      for (let i = this.points.length; i < this.numPoints; i++) {
        this.points.push({ x: 0, y: 0 });
      }
    } else {
      console.error('Number of points is not an integer or is <= 0.');
    }
    console.log(`(updatePoints) Points: ${this.points}`);

    this.renderMath();
  }

  addBlankPoint() {
    this.points.push({ x: 0, y: 0 });
    this.numPoints++;
  }

  removeLastPoint() {
    if (this.numPoints > 1) {
      this.points.pop();
      this.numPoints--;
    }
  }

  removePoint(index: number) {
    if (this.numPoints > 1) {
      this.points.splice(index, 1);
      this.numPoints--;
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }

  numberHasValue(num: number | null | undefined): boolean {
    return isNumber(num) && !isNaN(num);
  }

  lagrangeInterpolation(x: number) {
    let y = 0;

    for (let i = 0; i < this.points.length; i++) {
      let y_i = this.points[i].y;
      let product = y_i;

      for (let j = 0; j < this.points.length; j++) {
        if (j === i) continue;

        let x_i = this.points[i].x;
        let x_j = this.points[j].x;
        product *= ((x - x_j) / (x_i - x_j));
      }

      y += product;
    }

    return round(y, 15);
  }

  renderMath() {
    if (!this.numberHasValue(this.x)) {
      console.error('Could not display Y as LaTex. X is not a number')
      return;
    }

    const yProcedureLatex = document.getElementById('y-procedure-latex');

    if (yProcedureLatex) {
      try {
        let latex = '';

        for (let i = 0; i < this.points.length; i++) {
          // término i de la sumatoria
          let termLatex = `${this.points[i].y}`;

          // multiplicatoria del término i
          let productLatex = '';
          for (let j = 0; j < this.points.length; j++) {
            if (j === i) continue;

            let x_i = this.points[i].x;
            let x_j = this.points[j].x;

            productLatex += `((x - ${x_j})`;
            let denominator = `${x_i} - ${x_j}`;
            productLatex += `/(${denominator}))`;
          }
          if (productLatex) {
            // (multiplicatoria)(y)
            termLatex = `(${productLatex})` + `(${termLatex})`;
          }

          latex += termLatex;
          // añade un + si todavía quedan más términos por agregar en la
          // sumatoria
          if (i < this.points.length - 1) {
            latex += ' + ';
          }
        }

        // obtener el polinomio, parsear el LaTex obtenido y desplegarlo en HTML
        let polynomial = nerdamer(latex).expand();
        yProcedureLatex.innerHTML = `$$y = ${polynomial.toTeX()}$$`;
        MathJax.typesetPromise([yProcedureLatex]);
      } catch (error) {
        yProcedureLatex.innerHTML = '';
        console.error(`Could not display Y as LaTex. ${error}`);
      }
    }
  }

  executeInterpolation() {
    this.result = undefined;
    if (this.numberHasValue(this.x)) {
      this.result = this.lagrangeInterpolation(this.x);
      this.renderMath();
    } else {
      let yProcedureLatex = document.getElementById('y-procedure-latex');
      if (yProcedureLatex) { yProcedureLatex.innerHTML = ''; }
      alert("Introduzca un valor numérico para X.")
    }
  }
}
