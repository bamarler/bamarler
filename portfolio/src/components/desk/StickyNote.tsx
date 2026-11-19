'use client'

import { useMemo } from 'react'
import { Text } from '@react-three/drei'
import type { ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'

// A square sticky note written in marker. The top edge is glued down and the bottom
// curls away from the surface. The note's local +z is the surface normal.

const FONT = '/fonts/desk/permanent_marker.ttf'
const SEGMENTS = 10
const CURL_START = 0.6 // fraction of the way down where the paper starts lifting

export const NOTE_COLORS = {
  yellow: '#f6e27a',
  pink: '#f4a7b9',
  blue: '#9fd3e6',
  green: '#c3e88d',
} as const

type Props = {
  text: string
  size?: number
  color?: keyof typeof NOTE_COLORS
  /** how far the bottom edge lifts off the surface (m) */
  curl?: number
  fontSize?: number
} & ThreeElements['group']

export default function StickyNote({ text, size = 0.1, color = 'yellow', curl = 0.005, fontSize, ...props }: Props) {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(size, size, 1, SEGMENTS)
    const pos = g.attributes.position
    for (let i = 0; i < pos.count; i++) {
      const fromTop = (size / 2 - pos.getY(i)) / size // 0 at the glued edge, 1 at the bottom
      pos.setZ(i, curl * (Math.max(0, fromTop - CURL_START) / (1 - CURL_START)) ** 2)
    }
    g.computeVertexNormals()
    return g
  }, [size, curl])

  return (
    <group {...props}>
      {/* fake contact shadow, since the scene has no shadow maps */}
      <mesh position={[size * 0.03, -size * 0.04, 0.0002]}>
        <planeGeometry args={[size * 1.02, size * 1.02]} />
        <meshBasicMaterial color="#000" transparent opacity={0.16} depthWrite={false} />
      </mesh>
      <mesh geometry={geometry} position-z={0.0006}>
        <meshStandardMaterial color={NOTE_COLORS[color]} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <Text
        font={FONT}
        fontSize={fontSize ?? size * 0.16}
        lineHeight={1.15}
        maxWidth={size * 0.86}
        textAlign="center"
        anchorX="center"
        anchorY="middle"
        color="#1d1b18"
        position={[0, size * 0.04, 0.0016]}
      >
        {text}
      </Text>
    </group>
  )
}
