'use strict'; // eslint-disable-line

/* eslint-disable no-bitwise */
// Scaling + Rotation + Tranlation. In that order
let fpsCounterLast = Date.now();
let fps;
const fpsElement = document.getElementById('fps');

let logged = false;
function justOnceLog() {
  if (logged) return;
  logged = true;
  console.log('just once logged:');
  console.log(...arguments)
}

let intervalLogTime = true;
function intervalLog() {
  if (!intervalLogTime) return;
  intervalLogTime = false;
  console.log(...arguments);
}
setInterval(() => {
  intervalLogTime = true;
}, 718);

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

// ----------------------------------------------------- //

const width = 212 * 2;
const heigth = 120 * 2;
const VIEWING_DISTANCE = 200;
const HITHER_PLANE = 5;
const YON_PLANE = 400;
const world = [];
const worldColor = [];
const ctx = document.getElementById('game').getContext('2d');
const pixels = ctx.createImageData(width, heigth);
const AXIS = {
  X: 'Axis/X',
  Y: 'Axis/Y',
  Z: 'Axis/Z',
}
const requestAnimFrame = (
  window.requestAnimationFrame ||
  window.webkitRequestAnimationFrame ||
  window.mozRequestAnimationFrame ||
  window.oRequestAnimationFrame ||
  window.msRequestAnimationFrame ||
  (callback => window.setTimeout(callback, 1000 / 100))
);

function radians(degrees) {
  return degrees * Math.PI / 180; // converts to rads
}

function get(url, callback) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const DONE = 4; // readyState 4 means the request is done.
    const OK = 200; // status 200 is a successful return.

    xhr.open('GET', url);
    xhr.send(null);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === DONE && xhr.status === OK) {
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

function drawLine(xy1, xy2, color) {
  if (!xy1) return;

  const [a, b] = vertexToCanvas(xy1, width, heigth);
  const [c, d] = vertexToCanvas(xy2, width, heigth);

  ctx.strokeStyle = color || '#000000';
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

function angle(xy1, xy2) {
  const [ aX, aY, bX, bY ] = [ xy1[0], xy1[1], xy2[0], xy2[1] ];
  const xDelta = aX - bX;
  const yDelta = aY - bY;
  let theta = Math.atan(xDelta / yDelta);
  theta *= 180/Math.PI;
  return theta || 0;
}

function rotatePoint(xy, degrees) {
  const x = xy[0];
  const y = xy[1];
  const rads = radians(degrees);

  const cos = Math.cos(rads);
  const sin = Math.sin(rads);

  const newX = (x * cos) - (y * sin);
  const newY = (y * cos + (x * sin));

  return [
    newX,
    newY,
  ];
}

function drawFace(obj, index) {
  obj.faces.forEach(face => {
    let canDraw = true;
    const [ a, b, c ] = [ face[0], face[1], face[2] ];
    const [ vertexA, vertexB, vertexC ] = [
      obj.vertices[a],
      obj.vertices[b],
      obj.vertices[c],
    ];

    // --------------- Cull back facing --------------- //
    // determine if face is drawn clockwise or counter-clockwise. //

    // get the arctangent of vertexA+VertexB.
    const angleAB = angle(vertexA, vertexB);
    // const newVertexC = rotatePoint(vertexC, angleAB);

    const ang = angleAB;
    const newA = rotatePoint(vertexA, ang);
    const newB = rotatePoint(vertexB, ang);
    const newC = rotatePoint(vertexC, ang);
    // drawLine(newA, newB, '#ff0000');
    // drawLine(newB, newC, '#ffff00');
    // drawLine(newC, newA, '#ffffff');

    // rotate vertexC by the angle of vertexA/B
    // const e = rotatePoint(vertexC, 10);
    // if (e[0] > vertexB[0]) canDraw = false;
    // drawLine(vertexA, e);
    // if (newC[0] < newA[0]) canDraw = false;

    // check if vertexC is right or left (which determines of clock/anticlockwise)

    // ------- only draw if within the frustrum ------- //
    ;[ vertexA, vertexB, vertexC ].forEach(vertex => {
      const frustrumWidth = (width*vertexA[2]) / ( 0.5 * VIEWING_DISTANCE);
      const frustrumHeight = (heigth*vertex[2]) / ( 1.5 * VIEWING_DISTANCE);

      if (vertex[0] > frustrumWidth) canDraw = false;
      else if (vertex[0] < -frustrumWidth) canDraw = false;

      else if (vertex[1] > frustrumHeight) canDraw = false;
      else if (vertex[1] < -frustrumHeight) canDraw = false;

      else if (vertex[2] > YON_PLANE) canDraw = false;
      else if (vertex[2] < HITHER_PLANE) canDraw = false;
    });

    // -------------- perform draw ------------------- //
    const color = worldColor[index];
    if (!canDraw) return;
    drawLine(vertexA, vertexB, '#ff0000');
    drawLine(vertexB, vertexC, '#ff7700');
    drawLine(vertexC, vertexA, '#ffff00');
  });
}

function safeParse(str) {
  let json = {};
  try {
    json = JSON.parse(str);
  } catch (error) {
    json = {};
  }
  return json;
}

function cloneWorld(worldArr) {
  const clone = [];

  worldArr.forEach(item => {
    const cloneItem = {};
    cloneItem.faces = item.faces.slice(0); // shallow copy. We don't need deep copy of faces
    cloneItem.vertices = [];

    item.vertices.forEach(vertice => {
      const cloneVertice = vertice.slice(0);
      cloneItem.vertices.push(cloneVertice);
    });

    clone.push(cloneItem);
  });

  return clone;
}

function loadModel(filename, translate, rotate=[0,0,0], scale) {
  return new Promise(resolve => {
    get(filename).then(res => {
      const [rotX, rotY, rotZ] = rotate || 0;
      const cubeJSON = safeParse(res);
      const normalizedObject = jsonTo3D(cubeJSON);
  
      const tMat = new TranslationMatrix(...translate);
      const eMat = new EulerMatrix(radians(rotX), radians(rotY), radians(rotZ));
      const rMat = new ScalingMatrix(...scale);
  
      const tfMatrix = new Matrix()
        .multiply(rMat)
        .multiply(eMat)
        .multiply(tMat);
  
      normalizedObject.vertices = tfMatrix.transform(normalizedObject.vertices);
      resolve(normalizedObject);
    });
  });
}

function render() {
  clearScreen();


  // ----------------- world space ----------------- //
  // rotate world
  const rotWorldMat = new EulerMatrix(radians(0), radians(0.1), radians(0));
  world.forEach((item, idx) => {
    world[idx].vertices = rotWorldMat.transform(item.vertices);
  });

  const renderWorld = cloneWorld(world);

  // ----------------- camera space ----------------- //
  // move world
  const moveWorld = new TranslationMatrix(0,0,180); // 180
  renderWorld.forEach((item, idx) => {
    renderWorld[idx].vertices = moveWorld.transform(item.vertices);
  });
  
  // perspective
  renderWorld.forEach((item, idx) => {
    renderWorld[idx].vertices = renderWorld[idx].vertices.map(vertex => {
      const [ x, y, z, w ] = vertex;
      const d = VIEWING_DISTANCE;

      return [ x*d/z, y*d/z, z, 1];
    });
  });

  // draw world
  renderWorld.forEach((item, idx) => {
    drawFace(item, idx);
  })
}

function clock() {
  // fps counter
  fps = (Date.now() - fpsCounterLast) / 1000;
  fpsCounterLast = Date.now();
  
  // wait for ready. put image then restart
  requestAnimFrame(clock);
  ctx.putImageData(pixels, 0, 0);
  render();
}

function main() {
  loadModel('cube.json', [0,0,0], [0,0,0], [10,10,10]).then(mCube => {
    // world.push(mCube);
    // worldColor.push('#f00');

    const mCube1 = Object.assign({}, mCube);
    mCube1.vertices = new TranslationMatrix(100,0,0).transform(mCube.vertices);
    world.push(mCube1);
    worldColor.push('#0f0');

    // const mCube2 = Object.assign({}, mCube);
    // mCube2.vertices = new TranslationMatrix(0,100,0).transform(mCube.vertices);
    // world.push(mCube2);
    // worldColor.push('#00f');

    // const mCube3 = Object.assign({}, mCube);
    // mCube3.vertices = new TranslationMatrix(0,0,100).transform(mCube.vertices);
    // world.push(mCube3);
    // worldColor.push('#0ff');

    // const mCube4 = Object.assign({}, mCube);
    // mCube4.vertices = new TranslationMatrix(0,-100,0).transform(mCube.vertices);
    // world.push(mCube4);
    // worldColor.push('#f00');

    // start
    clock();
    console.log('started clock')
  });

  // loadModel('porygon.json', [0,0,-10], [90,0,180], [1,1,1]).then(mPorygon => {
  //   world.push(mPorygon);
  //   worldColor.push('#a7f');
  // });

  // fps timer
  setInterval(() => {
    fpsElement.innerText = 1 / fps | 0;
  }, 1000);
}

main();