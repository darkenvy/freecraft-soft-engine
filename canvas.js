/* global debug */


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
    // pixels.data[i * 4 + 3] = 50;
    pixels.data[i * 4 + 3] = 0;
  }
}

function drawFace(face, idx, max) {
  const [ vertexA, vertexB, vertexC, vertexD ] = face;
  const color = debug.constructor.numberToColor(idx, max);
  // const color = '#000'
  drawLine(vertexA, vertexB, color);
  drawLine(vertexB, vertexC, color);
  drawLine(vertexC, vertexD, color);
  drawLine(vertexD, vertexA, color);
  // drawLine(vertexA, vertexB, '#ff0000');
  // drawLine(vertexB, vertexC, '#ff7700');
  // drawLine(vertexC, vertexD, '#ffff00');
  // drawLine(vertexD, vertexA, '#ffffff');
}

