'use client'

import { Suspense, useEffect } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import CameraRig from './CameraRig'
import Candle from './Candle'
import Dossier from './Dossier'
import Inspector from './Inspector'
import Model from './Model'
import StickyNote from './StickyNote'
import Surface from './Surface'
import Trinkets from './Trinkets'
import { DESK, ROOM, SHELF, SHELF_FRONT_Z, SHELF_Z, WALL_Z } from './room'
import { useDevice } from './useDevice'

const WALL_PAINT = '#5e8263'
// darkens the light oak shelves toward the table's reddish-brown finish
const SHELF_STAIN = '#b8845a'

function Room({ poster, framePhotos }: { poster: boolean; framePhotos: string[] }) {
  return (
    <>
      <Surface
        texture="plank_flooring_02"
        size={[4, 3]}
        repeat={[2, 1.5]}
        rotation-x={-Math.PI / 2}
      />
      {/* the back wall is painted forest green over the plaster; the side walls stay white */}
      <Surface
        texture="white_plaster_02"
        color={WALL_PAINT}
        roughness={0.8}
        size={[4, ROOM.height]}
        repeat={[4, ROOM.height]}
        position={[0, ROOM.height / 2, WALL_Z]}
      />
      {/* alcove side walls at the desk's ends */}
      {[-1, 1].map((side) => (
        <Surface
          key={side}
          texture="white_plaster_02"
          size={[ROOM.sideWallDepth, ROOM.height]}
          repeat={[ROOM.sideWallDepth, ROOM.height]}
          position={[
            (side * DESK.width) / 2,
            ROOM.height / 2,
            WALL_Z + ROOM.sideWallDepth / 2,
          ]}
          rotation-y={(-side * Math.PI) / 2}
        />
      ))}
      <Model
        id="wooden_table_02"
        position={[0, 0, DESK.z]}
        fit={{ x: DESK.width, y: DESK.top, z: DESK.depth }}
      />
      {/* the shelf model is in inches and its pins face -z, so turn it to face the room */}
      {SHELF.heights.map((y) => (
        <Model
          key={y}
          id="solid_oak_floating_shelf"
          position={[SHELF.x, y, SHELF_Z]}
          rotationY={Math.PI}
          fit={{ x: SHELF.width }}
          tint={SHELF_STAIN}
        />
      ))}
      <Dossier position={[-0.08, DESK.top, DESK.z + 0.06]} rotationY={0.07} />
      <Candle position={[-0.44, DESK.top, DESK.z - 0.16]} still={poster} />
      <Trinkets framePhotos={framePhotos} still={poster} />
    </>
  )
}

// The only instructions on the site. Each one shows only where it's useful.
function Notes() {
  const { touch, portrait } = useDevice()
  const shelfTop = SHELF.heights[0] + SHELF.thickness
  return (
    <>
      {/* stuck to the front edge of the lower shelf, hanging down */}
      <StickyNote
        text={"hi, I'm Ben!\npoke around :)"}
        position={[-0.24, shelfTop - 0.05, SHELF_FRONT_Z + 0.001]}
        rotation-z={0.05}
      />
      {touch && portrait && (
        <StickyNote
          text={"<-- swipe -->\nthere's more"}
          color="pink"
          size={0.11}
          position={[0.14, DESK.top + 0.0005, DESK.z + 0.25]}
          rotation={[-Math.PI / 2, 0, -0.08]}
        />
      )}
      {portrait && (
        <StickyNote
          text={'psst...\nturn me\nsideways ;)'}
          color="blue"
          position={[0.2, 1.62, WALL_Z + 0.001]}
          rotation-z={-0.07}
        />
      )}
    </>
  )
}

/** Something for glass, brass and varnish to reflect: a soft generic room, built once on
 *  load (no download, no per-frame cost) and kept dim so the candle still sets the mood. */
function Reflections() {
  const get = useThree((s) => s.get)
  useEffect(() => {
    const { gl, scene, invalidate } = get()
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.25
    invalidate()
    return () => {
      scene.environment = null
      env.dispose()
      pmrem.dispose()
    }
  }, [get])
  return null
}

/** Fires once the first frame with every model loaded has been drawn. */
function Ready({ onReady }: { onReady: () => void }) {
  const invalidate = useThree((s) => s.invalidate)
  useEffect(() => {
    invalidate()
    const id = requestAnimationFrame(() => requestAnimationFrame(onReady))
    return () => cancelAnimationFrame(id)
  }, [invalidate, onReady])
  return null
}

export default function Scene({
  onReady,
  poster = false,
  framePhotos = [],
}: {
  onReady: () => void
  poster?: boolean
  framePhotos?: string[]
}) {
  const { touch } = useDevice()
  return (
    <Canvas
      frameloop="demand"
      dpr={touch ? [1, 1.5] : [1, 2]}
      camera={{ fov: 38, near: 0.05, far: 20 }}
      gl={{ antialias: true, preserveDrawingBuffer: poster }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#1a1a18']} />
      <hemisphereLight args={['#f4efe6', '#3a3226', 0.6]} />
      <directionalLight position={[0.8, 2.8, 1.4]} intensity={2.2} />
      <Reflections />
      <Suspense fallback={null}>
        <Room poster={poster} framePhotos={framePhotos} />
        {!poster && <Notes />}
        {!poster && <Inspector />}
        <Ready onReady={onReady} />
      </Suspense>
      <CameraRig />
    </Canvas>
  )
}
