import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Point } from 'chart.js';
import Decimal from 'decimal.js';
import { ceil, floor, isNaN, isNumber, round } from 'mathjs';
import nerdamer from 'nerdamer';
import { ApexAxisChartSeries, ApexChart, ApexMarkers, ApexTitleSubtitle, ApexXAxis, ApexYAxis, NgApexchartsModule } from 'ng-apexcharts';

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
  chartSeries: ApexAxisChartSeries = [];
  chart: ApexChart = {
    type: 'line',
    height: 500,
  };
  xaxis: ApexXAxis = {
    title: {
      text: 'x'
    },
    tickAmount: 4,
    decimalsInFloat: 5,
    labels: {
      // para mostrar decimales en X al pasar el mouse encima de la gráfica
      formatter: function (val) {
        let num = Number.parseFloat(val);
        return num.toFixed(5); 
      }
    }
  };
  yaxis: ApexYAxis = {
    title: {
      text: 'y'
    },
    tickAmount: 4,
    decimalsInFloat: 5
  };
  title: ApexTitleSubtitle = {
    text: 'Interpolación de Lagrange',
    align: 'left'
  };

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

  /**
   * Retorna verdadero si hay algúna X duplicada en la lista de puntos.
   */
  checkIfAnyDuplicateX(): boolean {
    const uniqueXValues = new Set(this.points.map(point => point.x));
    return uniqueXValues.size !== this.points.length;
  }

  /**
   * Genera el valor interpolado para la coordenada X en Y.
   * @param x Coordenada en X a interpolar.
   * @param showAlerts Si es verdadero, se muestran alertas para avisar de errores al usuario. Por defecto es falso.
   * @returns Valor interpolado de X en Y redondeado a 15 decimales.
   */
  lagrangeInterpolation(x: number, showAlerts: boolean = false) {
    if (this.checkIfAnyDuplicateX()) {
      if (showAlerts) {
        alert("No se puede realizar la interpolación de Lagrange con valores X duplicados.");
      }
      return undefined;
    }

    let y = new Decimal(0);
    let x_ = new Decimal(x);

    for (let i = 0; i < this.points.length; i++) {
      let y_i = new Decimal(this.points[i].y);
      let product = y_i;

      for (let j = 0; j < this.points.length; j++) {
        if (j === i) continue;

        let x_i = new Decimal(this.points[i].x);
        let x_j = new Decimal(this.points[j].x);
        product = product.times(
          (x_.minus(x_j)).dividedBy(
            x_i.minus(x_j))
        );
      }

      y = y.plus(product);
    }

    return y.toNumber();
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
        let polynomialLatex = nerdamer(latex).expand().toTeX();
        yProcedureLatex.innerHTML = `$$y = ${polynomialLatex}$$`;
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
      this.result = this.lagrangeInterpolation(this.x, true);
      this.renderMath();
      this.updateChart()
    } else {
      let yProcedureLatex = document.getElementById('y-procedure-latex');
      if (yProcedureLatex) { yProcedureLatex.innerHTML = ''; }
      alert("Introduzca un valor numérico para X.")
    }
  }

  /**
   * Generar puntos para dibujar la curva de interpolación.
   * @param maxPoints Número de puntos a generar para dibujar la línea.
   * @returns Arreglo de puntos {x, y} para graficar la curva de interpolación.
   */
  generateInterpolatedPoints(maxPoints: number) {
    let interpolatedSeries: { x: number; y: number }[] = [];

    // no puede realizarse interpolación
    if (this.checkIfAnyDuplicateX()) return interpolatedSeries;

    let minX = Math.min(...this.points.map(p => p.x), this.x);
    let maxX = Math.max(...this.points.map(p => p.x), this.x);
    let extra = (maxX - minX) * 0.20;
    minX -= extra;
    maxX += extra;

    let step = (maxX - minX) / maxPoints;
    for (let i = 0; i < maxPoints; i++) {
      let currentX = minX + i * step;
      let currentY = this.lagrangeInterpolation(currentX);
      if (currentY !== undefined)
        interpolatedSeries.push({ x: currentX, y: parseFloat(currentY.toFixed(14)) });
    }

    return interpolatedSeries;
  }

  /**
   * Dibuja la interpolación como una curva y el punto X.
   */
  updateChart() {
    const maxPoints = 500;
    let interpolatedSeries = this.generateInterpolatedPoints(maxPoints);

    this.chartSeries = [
      {
        name: 'Curva de interpolación',
        data: interpolatedSeries,
        type: 'line'
      },
      {
        name: 'Punto X',
        data: [{ x: this.x, y: this.result }],
        type: 'scatter',
        color: '#FF4560',
      }
    ];
  }
}
