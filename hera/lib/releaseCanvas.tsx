// Mobile version browsers keep a canvas' pixel memory until garbage collection runs,
// and kill the page once a total canvas memory limit is reached (hence random refresh).
// Shrinking a canvas to 0x0 frees that memory.
export default function releaseCanvas(canvas: HTMLCanvasElement | null | undefined) {
  if (canvas) {
    canvas.width = 0;
    canvas.height = 0;
  }
}
