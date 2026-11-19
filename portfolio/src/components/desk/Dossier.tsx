'use client'

import { Text, useTexture } from '@react-three/drei'
import * as THREE from 'three'
import Pickable from './Pickable'
import StickyNote from './StickyNote'
import { CARD, FOLDER_LABEL } from './reader/paper'

// A closed manila folder lying on the desk. Picking it up opens the reader (Reader.tsx).
// Built from a few thin boxes rather than a model: it's flat card, and this keeps the
// label crisp. Local +y is up off the desk, -z is the far edge (where the tab is). The card
// is the same baked manila the open folder uses (reader/paper.ts), so it's one download.

const FOLDER = { width: 0.235, length: 0.31, card: 0.0012, papers: 0.004 }
// the baked card is a touch light under the desk lamp; this tones it to the folder's old colour
const MANILA = '#ead7ae'

function useManila() {
  return useTexture(CARD, (map) => {
    map.colorSpace = THREE.SRGBColorSpace
    map.anisotropy = 4
  })
}
const TYPE = '/fonts/desk/special_elite.ttf'

type Props = { position: [number, number, number]; rotationY?: number }

export default function Dossier({ position, rotationY = 0 }: Props) {
  const { width, length, card, papers } = FOLDER
  const manila = useManila()
  return (
    <Pickable
      id="dossier"
      label="dossier"
      opens
      flip={false}
      face={[Math.PI / 2, 0, 0]}
      fill={0.9}
      position={position}
      rotation-y={rotationY}
    >
      {/* back cover, with the tab on the far edge */}
      <mesh position={[0, card / 2, 0]}>
        <boxGeometry args={[width, card, length]} />
        <meshStandardMaterial color={MANILA} map={manila} roughness={0.9} />
      </mesh>
      <mesh position={[width * 0.22, card / 2, -length / 2 - 0.009]}>
        <boxGeometry args={[0.085, card, 0.018]} />
        <meshStandardMaterial color={MANILA} map={manila} roughness={0.9} />
      </mesh>
      {/* the sheets inside, peeking out of the open side */}
      <mesh position={[0.002, card + papers / 2, 0.001]}>
        <boxGeometry args={[width - 0.01, papers, length - 0.012]} />
        <meshStandardMaterial color="#efe8d8" roughness={0.95} />
      </mesh>
      {/* front cover, a little shorter so the back cover's edge shows */}
      <mesh position={[0, card * 1.5 + papers, 0.006]}>
        <boxGeometry args={[width, card, length - 0.012]} />
        <meshStandardMaterial color={MANILA} map={manila} roughness={0.9} />
      </mesh>

      <group position={[0, card * 2 + papers + 0.0004, 0]} rotation-x={-Math.PI / 2}>
        {/* typed label */}
        <mesh position={[-0.02, 0.09, 0]}>
          <planeGeometry args={[0.13, 0.034]} />
          <meshStandardMaterial color="#f4f0e6" roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
        <Text font={TYPE} fontSize={0.0115} color="#2a2520" anchorX="center" anchorY="middle" position={[-0.02, 0.094, 0.0004]}>
          {FOLDER_LABEL}
        </Text>
        <Text font={TYPE} fontSize={0.0066} color="#5a5048" anchorX="center" anchorY="middle" position={[-0.02, 0.081, 0.0004]}>
          personnel file
        </Text>
        {/* stamped across the cover */}
        <Text
          font={TYPE}
          fontSize={0.019}
          color="#a3322a"
          fillOpacity={0.55}
          anchorX="center"
          anchorY="middle"
          position={[0.01, -0.035, 0.0004]}
          rotation-z={0.22}
        >
          CONFIDENTIAL
        </Text>
        <StickyNote text={'start\nhere!'} size={0.075} position={[0.055, -0.095, 0.0004]} rotation-z={-0.12} />
      </group>
    </Pickable>
  )
}
