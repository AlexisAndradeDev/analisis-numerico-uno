import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Point } from 'chart.js';
import { prod, sum } from 'mathjs';

@Component({
  selector: 'app-lagrange',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './lagrange.component.html',
  styleUrl: './lagrange.component.scss'
})
export class LagrangeComponent implements OnChanges, AfterViewInit {
  numPoints: number = 1;
  points: Point[] = [];
  result: number | undefined = undefined;
  x: number | undefined = undefined;

  constructor() {
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['numPoints'] || changes['points']) {
      this.updatePoints();
    }
  }

  ngAfterViewInit() {
    this.updatePoints();
  }

  updatePoints() {
    if (Number.isInteger(this.numPoints) && this.numPoints > 0) {
      // eliminar los últimos elementos si el número de puntos debe ser menor
      // a la longitud de la lista de puntos actual
      if (this.points.length > this.numPoints) {
        this.points = this.points.slice(0, this.numPoints - 1);
      }
      // fillear elementos añadidos con (0, 0)
      for (let i = this.points.length; i < this.numPoints; i++) {
        this.points.push({ x: 0, y: 0 });
      }
    } else {
      console.error('Number of points is not an integer or is <= 0.');
    }
    console.log(`(updatePoints) Points: ${this.points}`);
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

    return y;
  }

  executeInterpolation() {
    if (this.x) {
      this.result = this.lagrangeInterpolation(this.x);
    } else {
      alert("Introduzca un valor para X.")
    }
  }
}
