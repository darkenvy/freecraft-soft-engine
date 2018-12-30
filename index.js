/* eslint-disable no-bitwise */
const AXIS = {
  X: 'Axis/X',
  Y: 'Axis/Y',
  Z: 'Axis/Z',
}

const degrees = degrees => degrees * Math.PI / 180; // converts to rads

function get(url, callback) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const DONE = 4; // readyState 4 means the request is done.
    const OK = 200; // status 200 is a successful return.

    xhr.open('GET', url);
    xhr.send(null);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === DONE && xhr.status === OK) {
        console.log('success')
        resolve(xhr.responseText);
      } else if (xhr.status !== 200) {
        reject(xhr.status);
      }
    }
  });
};

function jsonTo3D(jsonObj) {
  const oldVertices = jsonObj.meshes[0].vertices;
  const oldFaces = jsonObj.meshes[0].faces;
  const newVertices = [];
  const out = {};

  // refactor old vert format to new
  for (let i = 0; i < oldVertices.length; i += 3) {
    newVertices.push([
      oldVertices[i],
      oldVertices[i + 1],
      oldVertices[i + 2],
      1,
    ]);
  }

  out.vertices = newVertices;
  out.faces = oldFaces;
  return out;
}

// ----------------------------------------------------- //

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
    this.final.matrix[7] = yAmt;
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

class PerspectiveMatrix {
  constructor(fov, near, far) {
    this.final = new Matrix();

    const s = 1 / Math.tan( (fov / 2) * (Math.PI / 180) );

    this.final.matrix[0] = s;
    this.final.matrix[5] = s;

    this.final.matrix[10] = -far / (far - near);
    this.final.matrix[14] = -far * near / (far - near);

    this.final.matrix[11] = -1;
    this.final.matrix[15] = 0;

    return this.final;
  }
}



// ----------------------------------------------------- //
// Scaling + Rotation + Tranlation. In that order

// const tMat = new TranslationMatrix(0, 0, -20);
// const eMat = new EulerMatrix(degrees(75), degrees(0), degrees(-90));
// const rMat = new ScalingMatrix(2, 2, 2);

// const tfMatrix = new Matrix()
//   .multiply(rMat)
//   .multiply(eMat)
//   .multiply(tMat);

// const finalTest = tfMatrix.transform(simpleFace);
// console.log(finalTest);

// ----------------------------------------------------- //

const width = 212 * 2;
const heigth = 120 * 2;
const ctx = document.getElementById('game').getContext('2d');
const pixels = ctx.createImageData(width, heigth);
const requestAnimFrame = (
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (callback => window.setTimeout(callback, 1000 / 100))
);
let currentObject = null;

let fpsCounterLast = Date.now();
let fps;
const fpsElement = document.getElementById('fps');
const perspectiveMatrix = new PerspectiveMatrix(90, 0.1, 100);
console.log(perspectiveMatrix);

function setPixel(xy, rgba) {
  const [r, g, b, a] = rgba;
  let [x, y] = xy;
  x |= 0;
  y |= 0;

  const index = (x + y * pixels.width) * 4;
  pixels.data[index + 0] = r || 0;
  pixels.data[index + 1] = g || 0;
  pixels.data[index + 2] = b || 0;
  pixels.data[index + 3] = a || 0;
}

function vertexToCanvas(vertex, canvasWidth, canvasHeight) {
  const [x, y] = vertex;
  const newX = x + canvasWidth / 2;
  const newY = y + canvasHeight / 2;
  return [newX, newY];
}

function drawLine(xy1, xy2) {
  if (!xy1) return;

  const [a, b] = vertexToCanvas(xy1, width, heigth);
  const [c, d] = vertexToCanvas(xy2, width, heigth);

  ctx.beginPath();
  ctx.moveTo(a, b);
  ctx.lineTo(c, d);
  ctx.stroke();
}

function clearScreen() {
  for (let i = 0; i < width * heigth; i++) {
    pixels.data[i * 4 + 3] = 50;
  }
}

function render() {
  clearScreen();

  const slowRot = new EulerMatrix(degrees(0), degrees(0.25), degrees(0));
  currentObject.vertices = slowRot.transform(currentObject.vertices);

  const inPerspectiveObject = Object.assign({}, currentObject);
  inPerspectiveObject.vertices = perspectiveMatrix.transform(currentObject.vertices);
  

  inPerspectiveObject.faces.forEach(face => {
    const [ a, b, c ] = [ face[0], face[1], face[2] ];
    const [ vertexA, vertexB, vertexC ] = [
      inPerspectiveObject.vertices[a],
      inPerspectiveObject.vertices[b],
      inPerspectiveObject.vertices[c],
    ];

    drawLine(vertexA, vertexB);
    drawLine(vertexB, vertexC);
    drawLine(vertexC, vertexA);
  });

  // let lastLine = null;
  // currentObject.vertices.forEach(vertex => {
  //   const xy = vertexToCanvas(vertex, width, heigth);
    
  //   // drawLine(lastLine, xy);
  //   // lastLine = xy;

  //   setPixel(xy, [0, 0, 0, 255]);
  //   lastLine = xy;
  // });
}

function clock() {
  fps = (Date.now() - fpsCounterLast) / 1000;
  fpsCounterLast = Date.now();
  
  requestAnimFrame(clock);
  ctx.putImageData(pixels, 0, 0);
  render();
  // ctx.putImageData(pixels, 0, 0);
}

function main() {
  // get('porygon.json').then(res => {
  get('cube.json').then(res => {
    let json = {};
    try {
      json = JSON.parse(res);
    } catch (error) {
      json = {};
    }

    console.log(json);
    const normalizedObject = jsonTo3D(json);

    const tMat = new TranslationMatrix(0, 0, 0);
    const eMat = new EulerMatrix(degrees(0), degrees(0), degrees(0));
    const rMat = new ScalingMatrix(100, 30, 30);

    const tfMatrix = new Matrix()
      .multiply(rMat)
      .multiply(eMat)
      .multiply(tMat);

    normalizedObject.vertices = tfMatrix.transform(normalizedObject.vertices);
    console.log(normalizedObject);
    currentObject = normalizedObject;

    clock();
    setInterval(() => {
      fpsElement.innerText = 1 / fps | 0;
    }, 1000);
  });
}

main();