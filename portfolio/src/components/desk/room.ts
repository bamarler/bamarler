// Room layout in metres. Back wall at z = WALL_Z, floor at y = 0, x = 0 is the middle of the desk.
export const WALL_Z = -1.5

// wooden_table_02 is 1.13 x 0.71 x 0.80 m; stretched to a big work table that fills an alcove
// wall to wall, so its side edges always meet a side wall
export const DESK = { width: 2.2, depth: 0.75, top: 0.8, z: WALL_Z + 0.375 + 0.01 }

// solid_oak_floating_shelf: 1 m plank, 0.2 m deep, 0.045 m thick, plus 0.06 m pins that go into the wall
export const SHELF = { width: 1, depth: 0.2, thickness: 0.045, pins: 0.06, x: 0, heights: [1.06, 1.34] }
export const SHELF_Z = WALL_Z + (SHELF.depth + SHELF.pins) / 2 - SHELF.pins // plank back flush with the wall
export const SHELF_FRONT_Z = WALL_Z + SHELF.depth

export const ROOM = { height: 2.6, sideWallDepth: 2 } // side walls run from the back wall toward the camera
