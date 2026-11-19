// URLs for files produced by `bun run assets:build`. Every id here must exist in assets/credits.json.
export const modelUrl = (id: string) => `/models/${id}.glb`

export const textureSet = (id: string) => ({
  map: `/textures/${id}/diff.webp`,
  normalMap: `/textures/${id}/nor.webp`,
  // ARM packing: R = ambient occlusion, G = roughness, B = metalness (matches three.js channels)
  aoMap: `/textures/${id}/arm.webp`,
  roughnessMap: `/textures/${id}/arm.webp`,
  metalnessMap: `/textures/${id}/arm.webp`,
})

/** a flat image (a texture shipped with only its colour map), for use in the DOM */
export const imageUrl = (id: string) => `/textures/${id}/diff.webp`
