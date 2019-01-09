let occlusionList = []; // eslint-disable-line
const VIEWING_DISTANCE = 200;
const HITHER_PLANE = 5;
const YON_PLANE = 400;

function radians(degrees) {
  return degrees * Math.PI / 180; // converts to rads
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

function cullFace(vertexA, vertexB, vertexC, vertexD) {
  let canDraw = true;
  // --------------- culling --------------- //
  // if (canDraw) canDraw = viewFrustrumCulling(vertexA, vertexB, vertexC, vertexD);
  if (canDraw) canDraw = occlusionCulling(vertexA, vertexB, vertexC, vertexD);
  // if (canDraw) canDraw = backfaceCulling(vertexA, vertexB, vertexC);

  return canDraw;
}

// -------------------------------------------------- //

// backface
function backfaceCulling(vertexA, vertexB, vertexC) {
  /* determine if face is drawn clockwise or counter-clockwise.
  returns canDraw bool */
  let canDraw = true;

  // get the arctangent of vertexA+VertexB.
  let angleAB = angle(vertexA, vertexB);

  // rotate vertexC by the angle of vertexA/B
  let newA = rotatePoint(vertexA, angleAB);
  let newB = rotatePoint(vertexB, angleAB);

  // if upside down, add 180 additional degrees & recalculate
  if (newB[1] > newA[1]) {
    angleAB += 180;
    newA = rotatePoint(vertexA, angleAB);
    newB = rotatePoint(vertexB, angleAB);
  }

  const newC = rotatePoint(vertexC, angleAB);

  /* check if vertexC is right or left (which determines of clock/anticlockwise)
  only draw if to the right. */
  if (newC[0] < newA[0]) canDraw = false;
  return canDraw;
}

// frustrum
function viewFrustrumCulling(vertexA, vertexB, vertexC, vertexD) {
  let canDraw = true;
  ;[ vertexA, vertexB, vertexC, vertexD ].forEach(vertex => {
    const frustrumWidth = (width*vertexA[2]) / ( 0.5 * VIEWING_DISTANCE);
    const frustrumHeight = (heigth*vertex[2]) / ( 1.5 * VIEWING_DISTANCE);

    if (vertex[0] > frustrumWidth) canDraw = false;
    else if (vertex[0] < -frustrumWidth) canDraw = false;

    else if (vertex[1] > frustrumHeight) canDraw = false;
    else if (vertex[1] < -frustrumHeight) canDraw = false;

    else if (vertex[2] > YON_PLANE) canDraw = false;
    else if (vertex[2] < HITHER_PLANE) canDraw = false;
  });

  return canDraw;
}

// occlusion
function pointInOcclusionList(point) {
  const [ x, y ] = point;
  let pointInList = false;

  occlusionList.forEach(vector => {
    if (pointInList) return;
    const [ oA, oB, oC, oD ] = vector;

    // if x/y shares the same point, it is 'inside' the trapazoid
    if (x === oA[0] && y === oA[1]) pointInList = true;
    else if (x === oB[0] && y === oB[1]) pointInList = true;
    else if (x === oC[0] && y === oC[1]) pointInList = true;
    else if (x === oD[0] && y === oD[1]) pointInList = true;

    if (pointInList) return;

    // using averaging to determine. less accurate but easy.
    // turns into a flat rectangle to compare point to. No perspective.
    const left = Math.min(oA[0], oB[0], oC[0], oD[0]);
    const right = Math.max(oA[0], oB[0], oC[0], oD[0]);
    const top = Math.max(oA[1], oB[1], oC[1], oD[1]);
    const bottom = Math.min(oA[1], oB[1], oC[1], oD[1]);

    if (
      x >= left && x <= right &&
      y >= bottom && y <= top
    ) pointInList = true;
  });

  return pointInList;
}

function isInOcclusionList(face) {
  let isInList = false;
  const [ a, b, c, d ] = face;

  const aOcc = pointInOcclusionList(a);
  const bOcc = pointInOcclusionList(b);
  const cOcc = pointInOcclusionList(c);
  const dOcc = pointInOcclusionList(d);

  if (aOcc && bOcc && cOcc && dOcc) isInList = true;

  return isInList;
}

function occlusionCulling(vertexA, vertexB, vertexC, vertexD) {
  let canDraw = true;

  const face = [
    [ vertexA[0] | 0, vertexA[1] | 0 ],
    [ vertexB[0] | 0, vertexB[1] | 0 ],
    [ vertexC[0] | 0, vertexC[1] | 0 ],
    [ vertexD[0] | 0, vertexD[1] | 0 ],
  ];

  const isInList = isInOcclusionList(face);
  if (isInList) canDraw = false;
  else occlusionList.push(face);

  return canDraw;
}
