const oWidth = oC[0] - oA[0];
const width = (x - oA[0]) + (oC[0] - x);

const oHeigth = oC[1] - oA[1];
const heigth = (y - oA[1]) + (oC[1] - y);
if (
  oWidth - width === 0 &&
  oHeigth - heigth === 0
) pointInList = true;
intervalLog(oC[0], oA[0], x);




// using averaging to determine. less accurate but easy.
// turns into a flat rectangle to compare point to. No perspective.
const left = Math.min(oA[0], oB[0], oC[0], oD[0]);
const right = Math.max(oA[0], oB[0], oC[0], oD[0]);
const top = Math.max(oA[1], oB[1], oC[1], oD[1]);
const bottom = Math.min(oA[1], oB[1], oC[1], oD[1]);



// get face depth
facesToDraw.forEach(face => {
  const avg = face.reduce((acc, vertex) => (acc + vertex[2]), 0);
  face.push(avg);
});


// sort world objects via the center of each object. from front to back
renderWorld.sort((a, b) => {
  const avgA = a.vertices.reduce((acc, vertex) => (acc + vertex[2]), 0);
  const avgB = b.vertices.reduce((acc, vertex) => (acc + vertex[2]), 0);
  return a - b;
});
renderWorld.reverse();