// Geometry for turning a sheet by folding it, the way paper actually turns: the corner
// is lifted to a point P and the sheet folds along the perpendicular bisector of the
// corner and P. Everything is a 2D affine transform, so the browser only composites.
//
// World space is the open folder: origin at the top of the binding (the spine), +x to the
// right, +y down. A sheet lies either on the right (x in [0, W], front up) or turned over
// on the left (x in [-W, 0], back up). Each side folds from its free bottom corner.

export type Side = 'right' | 'left'
export type Vec = { x: number; y: number }
/** CSS matrix(a, b, c, d, e, f): x' = a x + c y + e, y' = b x + d y + f */
export type Mat = [number, number, number, number, number, number]

const I: Mat = [1, 0, 0, 1, 0, 0]
const MIRROR: Mat = [-1, 0, 0, 1, 0, 0] // reflect about the spine

/** A ∘ B: apply B, then A */
export function mul(A: Mat, B: Mat): Mat {
  return [
    A[0] * B[0] + A[2] * B[1],
    A[1] * B[0] + A[3] * B[1],
    A[0] * B[2] + A[2] * B[3],
    A[1] * B[2] + A[3] * B[3],
    A[0] * B[4] + A[2] * B[5] + A[4],
    A[1] * B[4] + A[3] * B[5] + A[5],
  ]
}

export function inv([a, b, c, d, e, f]: Mat): Mat {
  const det = a * d - b * c
  const ia = d / det
  const ib = -b / det
  const ic = -c / det
  const id = a / det
  return [ia, ib, ic, id, -(ia * e + ic * f), -(ib * e + id * f)]
}

export const css = (m: Mat) => `matrix(${m.map((v) => +v.toFixed(5)).join(',')})`

/** the free bottom corner of a sheet lying on this side */
export const corner = (side: Side, W: number, H: number): Vec => ({ x: side === 'right' ? W : -W, y: H })

/** Keep P where paper can reach without tearing at the spine. */
export function clamp(P: Vec, W: number, H: number): Vec {
  let { x, y } = P
  // the bottom of the spine holds: the corner stays within a sheet's width of it
  const dx = x
  const dy = y - H
  let r = Math.hypot(dx, dy)
  if (r > W) {
    x = (dx * W) / r
    y = H + (dy * W) / r
  }
  // so does the top: the corner stays within the sheet's diagonal of it
  const D = Math.hypot(W, H)
  r = Math.hypot(x, y)
  if (r > D) {
    x = (x * D) / r
    y = (y * D) / r
  }
  return { x, y }
}

export type Fold = {
  flat: boolean
  /** the clip box: its edge lies on the fold line and it covers the side the sheet stays on */
  clip: Mat
  /** transforms for the sheet's two faces, relative to the clip box */
  base: Mat
  flap: Mat
  /** shadow the lifted part casts on the sheet beneath, in world space (a strip 2L long) */
  under: Mat
  /** shading across the folded-over flap, in the flap face's own space (also 2L long) */
  flapShade: Mat
}

/**
 * Where everything goes when the corner of a sheet on `side` is at P. `S` is the size of
 * the clip box, which only has to be larger than the open folder. The shading strips run
 * `L` either side of the fold's midpoint: a sheet's diagonal covers any fold across it, and
 * keeping them that short keeps what the browser rasterises small.
 */
export function fold(side: Side, P: Vec, W: number, H: number, S: number, L = Math.hypot(W, H)): Fold {
  const C = corner(side, W, H)
  const dx = C.x - P.x
  const dy = C.y - P.y
  const len = Math.hypot(dx, dy)
  const flat = len < 0.5
  // n points from the fold toward the lifted corner; flat sheets fold well past their corner
  const n = flat ? { x: side === 'right' ? 1 : -1, y: 0 } : { x: dx / len, y: dy / len }
  // (far enough that a divider tab sticking out past the edge stays down too)
  const M = flat ? { x: C.x + n.x * W, y: C.y } : { x: (C.x + P.x) / 2, y: (C.y + P.y) / 2 }
  const t = { x: n.y, y: -n.x } // along the fold

  // box coords (u, v): u runs from the fold into the side that stays down, v along the fold
  const clip: Mat = [-n.x, -n.y, t.x, t.y, M.x - S * t.x, M.y - S * t.y]
  const lieDown = side === 'right' ? I : MIRROR
  // reflect across the fold line
  const r: Mat = [t.x * t.x - t.y * t.y, 2 * t.x * t.y, 2 * t.x * t.y, t.y * t.y - t.x * t.x, 0, 0]
  const R: Mat = [r[0], r[1], r[2], r[3], M.x - (r[0] * M.x + r[2] * M.y), M.y - (r[1] * M.x + r[3] * M.y)]
  const toClip = inv(clip)
  const flapPose = mul(R, lieDown)
  return {
    flat,
    clip,
    base: mul(toClip, lieDown),
    flap: mul(toClip, flapPose),
    under: [n.x, n.y, -t.x, -t.y, M.x + L * t.x, M.y + L * t.y],
    flapShade: mul(inv(flapPose), [-n.x, -n.y, t.x, t.y, M.x - L * t.x, M.y - L * t.y]),
  }
}

/** smooth in, gentle landing */
export const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
