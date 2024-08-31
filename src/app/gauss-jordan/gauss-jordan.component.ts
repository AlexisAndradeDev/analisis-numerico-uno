import { Component, SimpleChanges } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

@Component({
  selector: 'app-gauss-jordan',
  standalone: true,
  imports: [FormsModule, NgFor, NgIf],
  templateUrl: './gauss-jordan.component.html',
  styleUrls: ['./gauss-jordan.component.scss']
})
export class GaussJordanComponent {
  col = 0;
  cartel = false;
  matrizInvalida = true;
  reglones = 0;
  columnas = 0;
  matriz: number[][] = [];
  matrizSolucion: number[] = [];
  iteraciones: { matriz: number[][], operacion: string }[] = [];
  iteracionActual = 0;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['col']) {
      this.actualizarMatriz();
    }
  }

  actualizarMatriz() {
    this.reglones = this.col;
    this.columnas = this.col + 1;
    this.matriz = this.creadorMatriz(this.reglones, this.columnas);
  }

  ingresarCoheficientes() {
    this.matrizInvalida = true;
    if (Number.isInteger(this.col) && this.col > 0) {
      this.actualizarMatriz();
      this.cartel = true;
    } else {
      this.col = 1;
      this.actualizarMatriz();
      this.cartel = true;
    }
  }

  creadorMatriz(row: number, col: number): number[][] {
    return Array.from({ length: row }, () => Array(col).fill(0));
  }

  validarYMostrarMatriz() {
    for (let i = 0; i < this.matriz.length; i++) {
      for (let j = 0; j < this.matriz[i].length; j++) {
        let valor = parseFloat(this.matriz[i][j] as any);
        if (isNaN(valor)) {
          alert(`El valor en la posición (${i + 1}, ${j + 1}) no es un número válido.`);
          return;
        }
        this.matriz[i][j] = valor;
      }
    }
    console.log('Matriz válida:', this.matriz);
    this.resolver(this.matriz);
  }

  resolver(matriz: number[][]) {
    // Extraemos solo la parte de la matriz que contiene los coeficientes
    const matrizCoeficientes = this.obtenerMatrizCoeficientes(matriz);
    const determinante = this.calcularDeterminante(matrizCoeficientes);
    console.log('Determinante de la matriz de coeficientes:', determinante);
    if (determinante !== 0) {
      this.matrizInvalida = false;
      this.matrizSolucion = this.gaussJordan(matriz);
      console.log('la solucion para el sistema de ecuaciones es la siguiente matriz', this.matrizSolucion);
    } else {
      this.matrizInvalida = true;
      this.cartel = false;
      alert(`La matriz no tiene solucion`);
      return;
    }
  }

  obtenerMatrizCoeficientes(matriz: number[][]): number[][] {
    const numFilas = matriz.length;
    const numColumnas = matriz[0].length - 1; // Excluimos la columna de términos independientes
    return matriz.map(fila => fila.slice(0, numColumnas)); // Extraemos solo los coeficientes
  }

  calcularDeterminante(matriz: number[][]): number {
    const n = matriz.length;

    if (n === 1) {
      // Caso base para una matriz 1x1
      return matriz[0][0];
    }

    if (n === 2) {
      // Caso base para una matriz 2x2
      return matriz[0][0] * matriz[1][1] - matriz[0][1] * matriz[1][0];
    }

    let determinante = 0;

    for (let j = 0; j < n; j++) {
      // Calculamos el menor complementario
      const submatriz = this.obtenerSubmatriz(matriz, 0, j);
      // Cofactor es (-1)^(i+j) * determinante de la submatriz
      const cofactor = Math.pow(-1, j) * this.calcularDeterminante(submatriz);
      determinante += matriz[0][j] * cofactor;
    }

    return determinante;
  }

  obtenerSubmatriz(matriz: number[][], fila: number, columna: number): number[][] {
    const submatriz = matriz
      .filter((_, index) => index !== fila) // Eliminar la fila
      .map(fila => fila.filter((_, index) => index !== columna)); // Eliminar la columna
    return submatriz;
  }

  gaussJordan(matriz: number[][]): number[] {
    const n = matriz.length;
    const m = matriz[0].length;
    let A = matriz.map(row => row.slice()); // Copia la matriz para no modificar la original
    this.iteraciones = [{ matriz: A.map(row => row.slice()), operacion: 'Matriz inicial' }];

    for (let i = 0; i < n; i++) {
      // Encuentra el pivote
      let maxRow = i;
      for (let k = i + 1; k < n; k++) {
        if (Math.abs(A[k][i]) > Math.abs(A[maxRow][i])) {
          maxRow = k;
        }
      }
      if (A[maxRow][i] === 0) {
        throw new Error("El sistema no tiene solución única o es incompatible.");
      }
      // Intercambia la fila actual con la fila del pivote
      if (i !== maxRow) {
        [A[i], A[maxRow]] = [A[maxRow], A[i]];
        this.iteraciones.push({ matriz: A.map(row => row.slice()), operacion: `Intercambiar fila ${i + 1} con fila ${maxRow + 1}` });
      }
      // Normaliza la fila del pivote
      const pivot = A[i][i];
      for (let j = 0; j < m; j++) {
        A[i][j] /= pivot;
      }
      this.iteraciones.push({ matriz: A.map(row => row.slice()), operacion: `Normalizar fila ${i + 1}` });
      // Elimina los coeficientes en la columna del pivote en otras filas
      for (let k = 0; k < n; k++) {
        if (k !== i) {
          const factor = A[k][i];
          for (let j = 0; j < m; j++) {
            A[k][j] -= factor * A[i][j];
          }
          this.iteraciones.push({ matriz: A.map(row => row.slice()), operacion: `Eliminar coeficiente en columna ${i + 1} de fila ${k + 1}` });
        }
      }
    }
    // La solución está en la última columna
    return A.map(row => row[m - 1]);
  }

  siguienteIteracion() {
    if (this.iteracionActual < this.iteraciones.length - 1) {
      this.iteracionActual++;
    }
  }

  anteriorIteracion() {
    if (this.iteracionActual > 0) {
      this.iteracionActual--;
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}