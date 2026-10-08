// Сцена: крабик Claude и пиксельный лис курят один кальян на краю поля ввода.
// Лис свесил обе задние лапы и болтает ими; шланг переходит от лиса к крабику.
// Одна клетка — один пиксель; анимация — FRAMES кадров по FRAME_MS.

export const PALETTE: Record<string, number> = {
  C: 0xd97757, // крабик
  K: 0x1b1b1b, // глаза
  F: 0xe8772e, // лис
  f: 0xb8561c, // тень на лисе, прищур
  W: 0xf7f1e8, // белая грудка, щёки, кончик хвоста
  D: 0x3b2416, // уши, нос, лапки, чаша
  L: 0x7c7c7c, // край поля ввода
  S: 0xb9bcc6, // металл кальяна, мундштук
  B: 0x3f7fbf, // колба
  b: 0x9fd0ff, // пузырьки
  R: 0xd0452a, // уголь
  Y: 0xffc93c, // раскалённый уголь
  H: 0x2f7a55, // шланг
  G: 0xe3e3e3, // дым
  g: 0x9a9a9a, // тающий дым
}

export const FRAMES = 32
export const FRAME_MS = 250

const CRAB = [
  '.CCCCCCCC.',
  '.CKCCCCKC.',
  'CCKCCCCKCC',
  'CCCCCCCCCC',
  '.CCCCCCCC.',
  '.CCCCCCCC.',
  '.C.C..C.C.',
  '.C.C..C.C.',
]

const HOOKAH = [
  '..R..',
  '.DDD.',
  '..S..',
  '..S..',
  'SSSSS',
  '..S..',
  '..S..',
  '.BBB.',
  'BBBBB',
  'BBBBB',
  '.BBB.',
]

const FOX = [
  '..D.......D..',
  '.DFD.....DFD.',
  '.DFFF...FFFD.',
  '.FFFFFFFFFFF.',
  'FFFFFFFFFFFFF',
  'FFKKFFFFFKKFF',
  'WFFFFFFFFFFFW',
  'WWWFFFFFFFWWW',
  '.WWWWWDWWWWW.',
  '..WWWWWWWWW..',
  '...FFWWWFF.........',
  '..FFFWWWFFF....ff..',
  '..FFFWWWFFF...fFFf.',
  '..FFFWWWFFF..fFFFF.',
  '..FFFWWWFFF.fFFFFW.',
  '..FFFWWWFFFFFFFFWW.',
  '..fFFFFFFFFFFFWWW..',
]

const LEDGE = 17
const CRAB_X = 0
const CRAB_Y = 9
const HOOKAH_X = 12
const HOOKAH_Y = 6
const FOX_X = 19

export const WIDTH = FOX_X + 19
export const HEIGHT = LEDGE + 4

type Grid = string[][]
type Cell = [number, number, string]

const blank = (): Grid => Array.from({ length: HEIGHT }, () => Array(WIDTH).fill('.'))

function put(g: Grid, x: number, y: number, ch: string) {
  x = Math.round(x)
  y = Math.round(y)
  if (y >= 0 && y < HEIGHT && x >= 0 && x < WIDTH) g[y]![x] = ch
}

function stamp(g: Grid, sprite: string[], ox: number, oy: number) {
  sprite.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) if (row[x] !== '.') put(g, ox + x, oy + y, row[x]!)
  })
}

// Шланг: квадратичная кривая от колбы до того, кто сейчас курит.
function hose(g: Grid, to: [number, number], ctrl: [number, number]) {
  const from: [number, number] = [HOOKAH_X + 2, HOOKAH_Y + 7]
  for (let i = 0; i <= 40; i++) {
    const t = i / 40
    const u = 1 - t
    put(
      g,
      u * u * from[0] + 2 * u * t * ctrl[0] + t * t * to[0],
      u * u * from[1] + 2 * u * t * ctrl[1] + t * t * to[1],
      'H',
    )
  }
  put(g, to[0], to[1], 'S')
}

// Клуб дыма через k кадров после выдоха.
function puff(g: Grid, x0: number, y0: number, dx: number, k: number) {
  if (k < 0 || k > 6) return
  const x = x0 + dx * k
  const y = y0 - k
  if (k < 2) {
    put(g, x, y, 'G')
  } else if (k < 4) {
    put(g, x, y, 'G')
    put(g, x + 1, y, 'G')
    put(g, x, y - 1, 'G')
    put(g, x + 1, y - 1, 'g')
  } else if (k < 6) {
    put(g, x, y, 'G')
    put(g, x + 2, y, 'G')
    put(g, x + 1, y - 1, 'G')
    put(g, x + 1, y + 1, 'G')
  } else {
    put(g, x, y, 'g')
    put(g, x + 2, y - 1, 'g')
  }
}

function frame(i: number): Grid {
  const g = blank()

  // Кто держит шланг и что делает.
  const foxHolds = i <= 15 || i === 31
  const crabHolds = i >= 17 && i <= 29
  const foxPuffs = i >= 4 && i <= 9
  const crabPuffs = i >= 17 && i <= 21
  const puffing = foxPuffs || crabPuffs

  // Крабик: подпрыгивает, пока лис выдыхает; щурится на затяжке.
  const crabY = CRAB_Y - (i === 11 || i === 13 ? 1 : 0)
  stamp(g, CRAB, CRAB_X, crabY)
  if (crabPuffs) {
    put(g, CRAB_X + 2, crabY + 1, 'C')
    put(g, CRAB_X + 7, crabY + 1, 'C')
  }
  if (crabHolds) put(g, CRAB_X + 10, crabY + 1, 'C') // клешня поднята к лицу

  // Кальян: уголь разгорается на затяжке, в колбе бегут пузырьки.
  stamp(g, HOOKAH, HOOKAH_X, HOOKAH_Y)
  if (puffing) {
    put(g, HOOKAH_X + 2, HOOKAH_Y, i % 2 ? 'Y' : 'R')
    put(g, HOOKAH_X + 1 + (i % 3), HOOKAH_Y + 9 - (i % 2), 'b')
    put(g, HOOKAH_X + 3 - (i % 2), HOOKAH_Y + 8 + (i % 2), 'b')
  } else if (i % 4 === 0) {
    put(g, HOOKAH_X + 2, HOOKAH_Y - 1 - ((i / 4) % 2), 'g') // струйка над чашей
  }

  // Лис: щурится на затяжке, разок моргает.
  stamp(g, FOX, FOX_X, 0)
  if (foxPuffs || i === 25) {
    for (const x of [2, 3, 9, 10]) put(g, FOX_X + x, 5, 'f')
  }

  // Две свисающие лапы, качаются вразнобой.
  const swing = [0, 1, 0, -1]
  for (const [lx, phase] of [[3, 0], [8, 2]] as const) {
    const dx = swing[(i + phase) % 4]!
    for (const x of [lx, lx + 1]) {
      put(g, FOX_X + x, LEDGE, 'F')
      put(g, FOX_X + x, LEDGE + 1, 'F')
      put(g, FOX_X + x + dx, LEDGE + 2, 'F')
      put(g, FOX_X + x + dx, LEDGE + 3, 'D')
    }
  }

  // Шланг: у лиса, в полёте, у крабика.
  if (foxHolds) hose(g, [FOX_X + 1, 9], [18, 18])
  else if (crabHolds) hose(g, [CRAB_X + 9, crabY], [11, 18])
  else hose(g, [HOOKAH_X + 3, HOOKAH_Y - 2], [20, 12])

  // Дым: два клуба после каждой затяжки.
  for (const s of [0, 2]) {
    puff(g, FOX_X - 1, 7, -0.5, i - 10 - s)
    puff(g, CRAB_X + 8, crabY - 1, 0.3, i - 22 - s)
  }

  return g
}

const GRIDS: Grid[] = Array.from({ length: FRAMES }, (_, i) => frame(i))
const gridAt = (i: number): Grid => GRIDS[((i % FRAMES) + FRAMES) % FRAMES]!

const hex = (c: number) => '#' + c.toString(16).padStart(6, '0')

function paths(cells: Cell[]): string {
  const byColor = new Map<string, string>()
  for (const [x, y, ch] of cells) byColor.set(ch, (byColor.get(ch) ?? '') + `M${x} ${y}h1v1h-1z`)
  return [...byColor].map(([ch, d]) => `<path fill="${hex(PALETTE[ch]!)}" d="${d}"/>`).join('')
}

function cellsOf(g: Grid, keep: (x: number, y: number) => boolean): Cell[] {
  const out: Cell[] = []
  g.forEach((row, y) => row.forEach((ch, x) => {
    if (ch !== '.' && keep(x, y)) out.push([x, y, ch])
  }))
  return out
}

const svgOpen = (px: number) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH * px}" height="${HEIGHT * px}" ` +
  `viewBox="0 0 ${WIDTH} ${HEIGHT}" shape-rendering="crispEdges">`

/** Вся анимация одним SVG: общий фон и по слою на кадр (SMIL, без скриптов). */
export function sceneSvg(px: number): string {
  const same = gridAt(0).map((row, y) => row.map((ch, x) => GRIDS.every(g => g[y]![x] === ch)))
  const dur = (FRAMES * FRAME_MS) / 1000

  const layers = GRIDS.map((g, i) => {
    const a = i / FRAMES
    const b = (i + 1) / FRAMES
    const [values, times] =
      i === 0 ? ['visible;hidden', `0;${b}`]
      : i === FRAMES - 1 ? ['hidden;visible', `0;${a}`]
      : ['hidden;visible;hidden', `0;${a};${b}`]
    return (
      `<g visibility="${i === 0 ? 'visible' : 'hidden'}">` +
      paths(cellsOf(g, (x, y) => !same[y]![x])) +
      `<animate attributeName="visibility" values="${values}" keyTimes="${times}" ` +
      `dur="${dur}s" repeatCount="indefinite" calcMode="discrete"/></g>`
    )
  })

  return (
    svgOpen(px) +
    `<title>Лис и крабик курят кальян</title>` +
    paths(cellsOf(gridAt(0), (x, y) => same[y]![x]!)) +
    layers.join('') +
    `</svg>`
  )
}

/** Один кадр без анимации. */
export function frameSvg(i: number, px: number): string {
  return svgOpen(px) + paths(cellsOf(gridAt(i), () => true)) + `</svg>`
}

const DEFAULT = 0x01000000
const UPPER = 0x2580 // ▀
const LOWER = 0x2584 // ▄

/** Кадр для терминала: полублоки, две строки пикселей на клетку. */
export function sceneCells(i: number): { columns: number; rows: number; cells: string } {
  const g = gridAt(i)
  const rows = Math.ceil(HEIGHT / 2)
  const words = new Uint32Array(WIDTH * rows * 3)
  const at = (x: number, y: number) => {
    const ch = g[y]?.[x] ?? '.'
    return ch === '.' ? null : PALETTE[ch]!
  }
  for (let r = 0; r < rows; r++) {
    for (let x = 0; x < WIDTH; x++) {
      const top = at(x, r * 2)
      const bottom = at(x, r * 2 + 1)
      const k = (r * WIDTH + x) * 3
      if (top === null && bottom === null) words.set([0x20, DEFAULT, DEFAULT], k)
      else if (top === null) words.set([LOWER, bottom!, DEFAULT], k)
      else words.set([UPPER, top, bottom ?? DEFAULT], k)
    }
  }
  return { columns: WIDTH, rows, cells: (new Uint8Array(words.buffer) as Uint8Array & { toBase64(): string }).toBase64() }
}
