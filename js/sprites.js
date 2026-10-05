// Loads the SVG drawings in assets/sprites/ and paints them on a canvas.

const loading = new Map(); // sprite name -> Promise of its image
const stamps = new Map(); // "name@pixels" -> a ready-made bitmap at that size

function loadSprite(name) {
  if (!loading.has(name)) {
    loading.set(
      name,
      new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Could not load sprite: ${name}`));
        img.src = `assets/sprites/${name}.svg`;
      }),
    );
  }
  return loading.get(name);
}

// Resolves with { name: image } once every named sprite has loaded.
export async function loadSprites(names) {
  const unique = [...new Set(names)];
  const images = await Promise.all(unique.map(loadSprite));
  return Object.fromEntries(unique.map((name, i) => [name, images[i]]));
}

// An SVG is a recipe, and following it 60 times a second for every character is
// slow. So each sprite is turned into a plain bitmap once per size and reused.
function stampFor(name, img, height) {
  // The same sharpness as the Battleground canvas, so each stamp lands pixel for pixel.
  const scale = Math.min(window.devicePixelRatio || 1, 1.5);
  const pixels = Math.round(height * scale);
  const key = `${name}@${pixels}`;
  if (!stamps.has(key)) {
    const stamp = document.createElement('canvas');
    stamp.height = pixels;
    stamp.width = Math.round((pixels * img.width) / img.height);
    stamp.getContext('2d').drawImage(img, 0, 0, stamp.width, stamp.height);
    stamps.set(key, stamp);
  }
  return stamps.get(key);
}

// Draws a sprite standing on the point (x, groundY), `height` pixels tall.
export function drawSprite(ctx, name, img, x, groundY, height, alpha = 1) {
  const stamp = stampFor(name, img, height);
  const width = (height * img.width) / img.height;
  ctx.globalAlpha = alpha;
  ctx.drawImage(stamp, x - width / 2, groundY - height, width, height);
  ctx.globalAlpha = 1;
}
