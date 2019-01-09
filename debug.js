
class Debug {
  constructor() {
    this.logged = false;
    this.intervalLogTime = true;
    
    this.fpsCounterLast = Date.now();
    this.fps = null;
    this.fpsElement = document.getElementById('fps');

    setInterval(() => {
      this.intervalLogTime = true;
      this.fpsElement.innerText = 1 / this.fps | 0; // eslint-disable-line no-bitwise
    }, 1718);
  }

  justOnceLog() {
    if (this.logged) return;
    this.logged = true;
    console.log('just once logged:');
    console.log(...arguments)
  }

  intervalLog() {
    if (!this.intervalLogTime) return;
    this.intervalLogTime = false;
    console.log(...arguments);
  }

  tickFPS() {
    this.fps = (Date.now() - this.fpsCounterLast) / 1000;
    this.fpsCounterLast = Date.now();
  }

  static numberToColor(num, max) {
    const base = '0' + (num * (200/max)).toString(16);
    const short = base.split('').slice(-2).join('');
    const long = `${short}${short}${short}`;
    const split = long.split('').slice(0,6).join('');
    return `#${split}`;
  }
}
