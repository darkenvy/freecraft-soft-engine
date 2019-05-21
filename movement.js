const SPEED = 0.5;

const $posx = document.getElementById('posx');
const $posy = document.getElementById('posy');
const $posz = document.getElementById('posz');

let pposx = 0;
let pposy = -30;
let pposz = 200;

const keyState = {

}

function addKeyboardBindings() {
  console.log('added keyboard bindings');
  document.addEventListener("keydown", event => {
    if (event.isComposing || event.keyCode === 229) return;
    keyState[event.keyCode || event.which] = true;
  });

  document.addEventListener("keyup", event => {
    if (event.isComposing || event.keyCode === 229) return;
    keyState[event.keyCode || event.which] = false;
  });
}

function movementLoop() {
  // left
  if (keyState[65]) {
    pposx = pposx + SPEED;
    $posx.innerText = pposx;
  }

  // right
  if (keyState[69]) {
    pposx = pposx - SPEED;
    $posx.innerText = pposx;
  }

  // forward
  if (keyState[87]) {
    pposz = pposz - SPEED;
    $posz.innerText = pposz;
  }

  // back
  if (keyState[83]) {
    pposz = pposz + SPEED;
    $posz.innerText = pposz;
  }

  // up
  if (keyState[81]) {
    pposy = pposy + SPEED;
    $posy.innerText = pposy;
  }

  // down
  if (keyState[74]) {
    pposy = pposy - SPEED;
    $posy.innerText = pposy;
  }

}

// e.preventDefault(); // prevent the default action (scroll / move caret)
