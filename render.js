
function constructFaces(obj, index) {
  const faces = [];

  obj.faces.forEach(face => {
    const [ a, b, c, d ] = [ face[0], face[1], face[2], face[3] ];
    const [ vertexA, vertexB, vertexC, vertexD ] = [
      obj.vertices[a],
      obj.vertices[b],
      obj.vertices[c],
      obj.vertices[d],
    ];
    
    faces.push([ vertexA, vertexB, vertexC, vertexD ]);
  });

  return faces;
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

function render() {
  clearScreen();
  occlusionList = []; // eslint-disable-line

  // ----------------- world space ----------------- //
  // rotate world
  const rotWorldMat = new EulerMatrix(radians(0), radians(0.25), radians(0));
  world.forEach((item, idx) => {
    world[idx].vertices = rotWorldMat.transform(item.vertices);
  });

  let renderWorld = cloneWorld(world);

  // simple sort world
  renderWorld = renderWorld.sort((a,b) => {
    const one = (a && a[0] && a[0][2]);
    const two = (b && b[0] && b[0][2]);
    return one - two;
  });

  // ----------------- camera space ----------------- //
  // move world
  const moveWorld = new TranslationMatrix(0,0,100); // 180
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

  // ----------------- draw world ----------------- //

  // convert world into an array of faces to draw
  let facesToDraw = [];
  renderWorld.forEach((item, idx) => {
    const faces = constructFaces(item, idx);
    facesToDraw = Array.prototype.concat(facesToDraw, faces);
  });

  // sort faces to draw
  facesToDraw.sort((a, b) => {
    const avgA = a.reduce((acc, curr) => acc + curr[2],0);
    const avgB = b.reduce((acc, curr) => acc + curr[2],0);
    return avgA - avgB;
  });

  // culling
  facesToDraw = facesToDraw.filter(face => {
    const [ vertexA, vertexB, vertexC, vertexD ] = face;
    return cullFace(vertexA, vertexB, vertexC, vertexD);
  });

  // draw faces
  facesToDraw.forEach((face, idx) => {
    drawFace(face, idx, facesToDraw.length);
  });
}
