'use strict'; // eslint-disable-line

// Scaling + Rotation + Tranlation. In that order
const AXIS = {
  X: 'Axis/X',
  Y: 'Axis/Y',
  Z: 'Axis/Z',
};

class Matrix {
  constructor(matrix) {
    this.matrix = matrix || [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  }

  multiply(matrix2) {
    const lMatrix = this.matrix;
    const rMatrix = matrix2.matrix;
    const newMatrix = [
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
      0,0,0,0,
    ];
    for (let i=0; i<64; i++) {
      const i16 = i / 16 | 0;
      const newMatrixIdx = ((i / 4 | 0) * 4) % 16 + i16;
      const leftIdx = i % 16;
      const rightIdx = (i % 4 * 4) + i16;
      
      const leftItem = lMatrix[leftIdx];
      const rightItem = rMatrix[rightIdx];
      let product = 0;

      if (leftItem === 0 || rightItem === 0) /* optim. blank */;
      else if (leftItem === 1) product = rightItem;
      else if (rightItem === 1) product = leftItem;
      else product = leftItem * rightItem;

      newMatrix[newMatrixIdx] += product;
      // console.log(`${newMatrixIdx}) ${product} (${lMatrix[leftIdx]} ${rMatrix[rightIdx]}) [${leftIdx} ${rightIdx}]`)
    }

    this.matrix = newMatrix;
    return this;
  }

  transform(model) {
    const newModel = [];
    model.forEach(vertex => {
      newModel.push(
        this._transformVertex(vertex)
      );
    });
    return newModel;
  }

  _transformVertex(vertex) {
    if (!vertex || vertex.length < 4) return [,,,,];
  
    const newVertex = [];
    const matrix = this.matrix;
    for (let i=0; i<16; i+=4) {
      newVertex.push(
        (matrix[i + 0] * vertex[0]) +
        (matrix[i + 1] * vertex[1]) +
        (matrix[i + 2] * vertex[2]) +
        (matrix[i + 3] * vertex[3])
      );
    }
    return newVertex;
  }

  print() {
    // prettify. Gets rid of rounding errors for readability
    const m = this.matrix.map(num =>Math.round(num * 100) / 100)
    console.log(`
      [
        ${m[0]}, ${m[1]}, ${m[2]}, ${m[3]},
        ${m[4]}, ${m[5]}, ${m[6]}, ${m[7]},
        ${m[8]}, ${m[9]}, ${m[10]}, ${m[11]},
        ${m[12]}, ${m[13]}, ${m[14]}, ${m[15]},
      ]
    `)
  }
}

class TranslationMatrix {
  constructor(xAmt, yAmt, zAmt) {
    this.final = new Matrix();

    this.final.matrix[3] = xAmt;
    this.final.matrix[7] = -yAmt;
    this.final.matrix[11] = zAmt;

    return this.final;
  }
}

class ScalingMatrix {
  constructor(xAmt, yAmt, zAmt) {
    this.final = new Matrix();

    this.final.matrix[0] = xAmt;
    this.final.matrix[5] = yAmt;
    this.final.matrix[10] = zAmt;

    return this.final;
  }
}

class RotationMatrix {
  constructor(axis, rotation) {
    this.rotation = rotation;

    let rotMatrix;
    switch(axis) {
      case AXIS.X:
        rotMatrix = this.xRot;
        break;
      case AXIS.Y:
        rotMatrix = this.yRot;
        break;
      case AXIS.Z:
        rotMatrix = this.zRot;
        break;
      default:
        console.log('Error:', 'No Axis specified. Returned Identity Matrix')
        rotMatrix = new Matrix();
        break;
    }

    return rotMatrix;
  }

  get xRot() {
    const a = this.rotation;
    return new Matrix([
      1, 0, 0, 0,
      0, Math.cos(a), -Math.sin(a), 0,
      0, Math.sin(a), Math.cos(a), 0,
      0, 0, 0, 1,
    ]);
  }

  get yRot() {
    const a = this.rotation;
    return new Matrix([
      Math.cos(a), 0, Math.sin(a), 0,
      0, 1, 0, 0,
      -Math.sin(a), 0, Math.cos(a), 0,
      0, 0, 0, 1,
    ]);
  }

  get zRot() {
    const a = this.rotation;
    return new Matrix([
      Math.cos(a), -Math.sin(a), 0, 0,
      Math.sin(a), Math.cos(a), 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  }
}

class EulerMatrix {
  constructor(xRot, yRot, zRot) {
    const euler = new Matrix();

    // algo from Opengl-tutorials.org. Optimized rotMatrix's to minimize operations.
    const a = Math.cos(xRot);
    const b = Math.sin(xRot);
    const c = Math.cos(yRot);
    const d = Math.sin(yRot);
    const e = Math.cos(zRot);
    const f = Math.sin(zRot);

    const ad = a * d;
    const bd = b * d;

    euler.matrix[0] = c * e;
    euler.matrix[1] = -c * f;
    euler.matrix[2] = d;
    euler.matrix[4] = bd * e + a * f;
    euler.matrix[5] = -bd * f + a * e;
    euler.matrix[6] = -b * c;
    euler.matrix[8] = -ad * e + b * f;
    euler.matrix[9] = ad * f + b * e;
    euler.matrix[10] = a * c;

    return euler;
  }
}
