globalThis.A = 1;
globalThis.B = 1;

export function asciiframe(targetElement) {
  let b = [];
  let z = [];
  globalThis.A += 0.07;
  globalThis.B += 0.03;

  let cA = Math.cos(globalThis.A);
  let sA = Math.sin(globalThis.A);
  let cB = Math.cos(globalThis.B);
  let sB = Math.sin(globalThis.B);

  const width = 62;
  const height = 22;
  const donutHeight = 15; // higher is toller
  const donutWidth = -8;  // lower is wider
  const donutY = 12;     // center of donut

  for (let k = 0; k < width * height; k++) {
    b[k] = k % width == width - 1 ? "\n" : " ";
    z[k] = 0;
  }

  for (let j = 0; j < 6.28; j += 0.07) {
    // j <=> theta
    let ct = Math.cos(j);
    let st = Math.sin(j);

    for (let i = 0; i < 6.28; i += 0.02) {
      // i <=> phi
      let sp = Math.sin(i);
      let cp = Math.cos(i);
      let h = ct + 2; // R1 + R2*cos(theta)
      let D = 1 / (sp * h * sA + st * cA + 5); // this is 1/z
      let t = sp * h * cA - st * sA; // this is a clever factoring of some of the terms in x' and y'

      let x = 0 | ((width / 2) + (width / 2 - donutWidth) * D * (cp * h * cB - t * sB));
      let y = 0 | (donutY + donutHeight * D * (cp * h * sB + t * cB));
      let o = x + width * y;
      let N = 0 | (8 * ((st * sA - sp * ct * cA) * cB - sp * ct * sA - st * cA - cp * ct * sB));
      if (y < height && y >= 0 && x >= 0 && x < width - 1 && D > z[o]) {
        z[o] = D;
        b[o] = ".,-~:;=!*#$@"[N > 0 ? N : 0];
      }
    }
  }
  targetElement.innerHTML = b.join("");
};
