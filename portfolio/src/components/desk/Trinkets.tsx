'use client'

import * as THREE from 'three'
import Model from './Model'
import Pickable from './Pickable'
import PictureFrame from './PictureFrame'
import { DESK, SHELF, SHELF_FRONT_Z, WALL_Z } from './room'

// Books and odds and ends on the shelves and the desk. The Poly Haven models are at real
// size, so they only need a spot and a turn; the Sketchfab books are scaled to fit. The
// small things can be picked up and turned over.

const LOW = SHELF.heights[0] + SHELF.thickness // top of each shelf
const HIGH = SHELF.heights[1] + SHELF.thickness
const ON_SHELF = WALL_Z + SHELF.depth / 2

type Spot = {
  id: string
  at: [number, number, number]
  turn?: number
  label?: string
  /** size to fit, in metres, for models that weren't made at real scale */
  fit?: { x?: number; y?: number }
  noGlass?: boolean
  tip?: [number, number, number]
  cut?: { axis: 'x' | 'y' | 'z'; above: number }
  alphaTest?: number
}

// Four books standing upright in a row, spines out and flush with the shelf's front edge,
// each one its own book to pick up. All four were modelled with the spine toward -x and the
// top toward -z (the textbooks, lying flat) or +y (the novel, standing), so standing them up
// and turning them a quarter makes the spine face the room. The novel was modelled leaning
// and turned; `tip` straightens it (the angles found by fitting its tightest box).
// `thick` and `deep` are each book's size on the shelf at its `height`, from its model.
const STAND: [number, number, number] = [Math.PI / 2, 0, 0]
const SPINE_OUT = Math.PI / 2
const straighten = (x: number, y: number, z: number, order: THREE.EulerOrder): [number, number, number] => {
  const e = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z, order)))
  return [e.x, e.y, e.z]
}
type Book = {
  id: string
  label: string
  height: number
  thick: number
  deep: number
  tip: [number, number, number]
  cut?: { axis: 'x' | 'y' | 'z'; above: number }
  alphaTest?: number
}
const BOOKS: Book[] = [
  // its bookmark ribbon hangs out of the bottom; trimmed so the book stands on its cover.
  // Exported see-through (blended), which shows its own insides; drawn solid.
  { id: 'book_leather', label: 'leather book', height: 0.215, thick: 0.064, deep: 0.176, tip: STAND, cut: { axis: 'z', above: 212 }, alphaTest: 0 },
  { id: 'book_quantum_integrals', label: 'quantum integrals book', height: 0.205, thick: 0.042, deep: 0.134, tip: STAND },
  // the cover's ragged edges are an alpha cutout; compression left soft spots in the middle
  // of the cover that the model's 0.64 threshold turned into holes, so cut lower
  { id: 'book_quantum_mathematics', label: 'quantum mathematics book', height: 0.195, thick: 0.013, deep: 0.129, tip: STAND, alphaTest: 0.25 },
  { id: 'book_blithedale_romance', label: 'old novel', height: 0.19, thick: 0.028, deep: 0.136, tip: straighten(0.14, -0.46, -0.03, 'ZXY') },
]
const BOOKS_FROM = -0.44 // left end of the row
const BOOK_GAP = 0.0015
const SPINE_INSET = 0.012 // spines sit this far back from the shelf's front edge

// The camera shows about 0.19 m of wall above the upper shelf, and the shelves are 0.235 m
// apart, so the tall things live on the lower shelf and the desk.
const ITEMS: Spot[] = [
  // lower shelf (the "hi, I'm Ben" note hangs off its front at x = -0.24)
  ...BOOKS.map((book, k): Spot => ({
    id: book.id,
    at: [
      BOOKS_FROM + BOOKS.slice(0, k).reduce((x, b) => x + b.thick + BOOK_GAP, 0) + book.thick / 2,
      LOW,
      SHELF_FRONT_Z - SPINE_INSET - book.deep / 2,
    ],
    turn: SPINE_OUT,
    label: book.label,
    fit: { y: book.height },
    tip: book.tip,
    cut: book.cut,
    alphaTest: book.alphaTest,
  })),
  { id: 'horse_statue_01', at: [0.2, LOW, ON_SHELF], turn: 0.35, label: 'horse statue' },
  { id: 'brass_vase_03', at: [0.4, LOW, ON_SHELF] },
  // upper shelf
  { id: 'alarm_clock_01', at: [-0.3, HIGH, ON_SHELF], turn: 0.3, label: 'alarm clock', noGlass: true },
  { id: 'lambis_shell', at: [0.04, HIGH, ON_SHELF + 0.02], turn: 0.5, label: 'shell' },
  { id: 'vintage_binocular', at: [0.32, HIGH, ON_SHELF], turn: 1.2, label: 'binoculars' },
  // desk
  { id: 'potted_plant_04', at: [-0.68, DESK.top, DESK.z - 0.24] },
  { id: 'seadogs_compass', at: [-0.62, DESK.top, DESK.z + 0.06], turn: 0.5, label: 'compass' },
]

export default function Trinkets({ framePhotos, still = false }: { framePhotos: string[]; still?: boolean }) {
  return (
    <>
      {ITEMS.map(({ id, at, turn = 0, label, fit, noGlass, tip, cut, alphaTest }) =>
        label ? (
          <Pickable key={id} id={id} label={label} position={at} rotation-y={turn}>
            <Model id={id} fit={fit} noGlass={noGlass} tip={tip} cut={cut} alphaTest={alphaTest} />
          </Pickable>
        ) : (
          <Model key={id} id={id} position={at} rotationY={turn} fit={fit} noGlass={noGlass} tip={tip} cut={cut} alphaTest={alphaTest} />
        ),
      )}
      {/* angled back toward the middle of the desk */}
      <PictureFrame photos={framePhotos} position={[0.64, DESK.top, DESK.z - 0.22]} turn={0.35 - Math.PI / 6} still={still} />
    </>
  )
}
