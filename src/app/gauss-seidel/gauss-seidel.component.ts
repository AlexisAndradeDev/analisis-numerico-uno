import { CommonModule, NgFor, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  standalone: true,
  imports: [FormsModule, CommonModule],
  selector: 'app-gauss-seidel',
  templateUrl: './gauss-seidel.component.html',
  styleUrls: ['./gauss-seidel.component.scss']
})
export class GaussSeidelComponent {
  numEquationsAndVariables = 0;
  numEquations = 0;
  numVariables = 0;
  tolerance = 0.001;
  matrix: number[][] = [];
  results: number[] = [];
  solution: number[] = [];
  variables: number[] = [];
  rowOrder: number[] = [];
  columnOrder: number[] = [];

  updateMatrix() {
    this.numEquations = this.numEquationsAndVariables;
    this.numVariables = this.numEquationsAndVariables;

    const newMatrix = Array.from({ length: this.numEquations }, (_, i) =>
      Array(this.numVariables).fill(0)
    );
    const newResults = Array(this.numEquations).fill(0);

    // Copiar los valores existentes a la nueva matriz y resultados
    for (let i = 0; i < Math.min(this.matrix.length, this.numEquations); i++) {
      for (let j = 0; j < Math.min(this.matrix[i].length, this.numVariables); j++) {
        newMatrix[i][j] = this.matrix[i][j];
      }
      newResults[i] = this.results[i];
    }

    this.matrix = newMatrix;
    this.results = newResults;
    this.variables = Array.from({ length: this.numVariables }, (_, i) => i + 1);
    this.rowOrder = Array.from({ length: this.numEquations }, (_, i) => i + 1);
    this.columnOrder = Array.from({ length: this.numVariables }, (_, i) => i + 1);
  }

  makeDiagonallyDominant(): boolean {
    const n = this.numVariables;
    const matrixCopy = this.matrix.map(row => [...row]);
    const resultsCopy = [...this.results];
    const rowOrderCopy = [...this.rowOrder];
    const columnOrderCopy = [...this.columnOrder];

    for (let i = 0; i < n; i++) {
      // Encontrar el índice de la fila con el valor absoluto más grande en la columna i
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(matrixCopy[k][i]) > Math.abs(matrixCopy[maxRow][i])) {
          maxRow = k;
        }
      }

      // Intercambiar la fila actual con la fila con el valor absoluto más grande
      if (maxRow !== i) {
        [matrixCopy[i], matrixCopy[maxRow]] = [matrixCopy[maxRow], matrixCopy[i]];
        [resultsCopy[i], resultsCopy[maxRow]] = [resultsCopy[maxRow], resultsCopy[i]];
        [rowOrderCopy[i], rowOrderCopy[maxRow]] = [rowOrderCopy[maxRow], rowOrderCopy[i]];
      }

      // Verificar si la columna actual es diagonalmente dominante
      let sum = 0;
      for (let j = 0; j < n; j++) {
        if (i !== j) {
          sum += Math.abs(matrixCopy[j][i]);
        }
      }

      if (Math.abs(matrixCopy[i][i]) < sum) {
        return false;
      }
    }

    // Si llegamos aquí, la matriz es diagonalmente dominante
    this.matrix = matrixCopy;
    this.results = resultsCopy;
    this.rowOrder = rowOrderCopy;
    this.columnOrder = columnOrderCopy;
    return true;
  }

  solveEquations() {
    const maxIterations = 1000;
    const n = this.numVariables;
    let x = Array(n).fill(0);
    let xOld = Array(n).fill(0);

    // Asegurarse de que la matriz sea diagonalmente dominante
    if (!this.makeDiagonallyDominant()) {
      alert('No se puede hacer la matriz diagonalmente dominante.');
      return;
    }

    for (let iter = 0; iter < maxIterations; iter++) {
      for (let i = 0; i < n; i++) {
        xOld[i] = x[i];
      }

      for (let i = 0; i < n; i++) {
        if (this.matrix[i][i] === 0) {
          alert('La diagonal principal no puede contener ceros.');
          return;
        }

        let sum = this.results[i];
        for (let j = 0; j < n; j++) {
          if (i !== j) {
            sum -= this.matrix[i][j] * x[j];
          }
        }
        x[i] = sum / this.matrix[i][i];
      }

      let error = 0;
      for (let i = 0; i < n; i++) {
        error += Math.abs(x[i] - xOld[i]);
      }

      if (error < this.tolerance) {
        // Reordenar la solución según el orden de las columnas
        this.solution = Array(n).fill(0);
        for (let i = 0; i < n; i++) {
          this.solution[this.columnOrder[i] - 1] = x[i];
        }
        return;
      }
    }

    // Reordenar la solución según el orden de las columnas
    this.solution = Array(n).fill(0);
    for (let i = 0; i < n; i++) {
      this.solution[this.columnOrder[i] - 1] = x[i];
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}