

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

function safeParse(str) {
  let json = {};
  try {
    json = JSON.parse(str);
  } catch (error) {
    json = {};
  }
  return json;
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
