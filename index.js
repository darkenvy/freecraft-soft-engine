/* global Debug render loadModel TranslationMatrix */
/* eslint-disable no-bitwise */
'use strict'; // eslint-disable-line

const debug = new Debug();
const width = 212 * 2;
const heigth = 120 * 2;
const world = [];
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

// ---------------------------------------- //

function clock() {
  // fps counter
  debug.tickFPS();
  
  // wait for ready. put image then restart
  requestAnimFrame(clock);
  ctx.putImageData(pixels, 0, 0);
  render();
}

function main() {
  // loadModel('explode-cube.json', [0,0,0], [0,0,0], [10,10,10]).then(mCube => {
  //   world.push(mCube);
  //   worldColor.push('#70ff70');
  // });
  loadModel('cube.json', [0,0,0], [0,0,0], [10,10,10]).then(mCube => {
    world.push(mCube);
    console.log(mCube)

    const mCube1 = Object.assign({}, mCube);
    mCube1.vertices = new TranslationMatrix(20,0,0).transform(mCube.vertices);
    world.push(mCube1);

    // const mCube2 = Object.assign({}, mCube);
    // mCube2.vertices = new TranslationMatrix(0,20,0).transform(mCube.vertices);
    // world.push(mCube2);

    // const mCube3 = Object.assign({}, mCube);
    // mCube3.vertices = new TranslationMatrix(0,0,20).transform(mCube.vertices);
    // world.push(mCube3);

    // const mCube4 = Object.assign({}, mCube);
    // mCube4.vertices = new TranslationMatrix(0,-20,0).transform(mCube.vertices);
    // world.push(mCube4);

    // const mCube5 = Object.assign({}, mCube);
    // mCube5.vertices = new TranslationMatrix(-20,0,0).transform(mCube.vertices);
    // world.push(mCube5);

    // const mCube6 = Object.assign({}, mCube);
    // mCube6.vertices = new TranslationMatrix(0,0,-20).transform(mCube.vertices);
    // world.push(mCube6);
    // start
  });
  
  clock();
  console.log('started clock');
}

main();