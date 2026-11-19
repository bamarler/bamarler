# The Desk: staged build plan

A 3D room with a desk, wall shelves and a world map. You look around freely, pick things up and turn them over. The dossier holds the résumé.

Design reference: Figma "bamarler.com Redesign" → ✏️ Lo-fi "Desk v3" and 🧭 User Flows.

## Ground rules

- **Human-made art only.** Models come from open libraries (CC0 first, then CC-BY) or from scans of Ben's real objects. No AI-generated meshes or textures. Every asset gets a provenance entry, and the credits page is built from those entries.
- **Content lives in data, not code.** Dossier pages and map pins come from Supabase. Room objects come from one typed scene file. Adding something should never mean writing a new component.
- **Almost nothing is announced.** The only guides are the sticky notes (how to move, how to pick things up, "start here" on the dossier). Everything else is found by exploring. Hovering gives physical feedback (a slight lift, the cursor changes) and never shows labels.
- **Bounded and on-demand.** The room is a closed box and the camera can't leave it. The scene only renders when something changes.

## Stage 0: Groundwork

- Add `three`, `@react-three/fiber`, `@react-three/drei`, `zustand` and `@react-three/postprocessing`.
- Build the new site at `/desk` next to the current one, and swap it in at the end.
- Move Supabase reads to Server Components.
- Asset pipeline:
  - `assets/raw/` holds the sources and is not shipped.
  - A `gltf-transform` script handles meshopt and KTX2 compression and writes to `public/models/`.
  - `assets/credits.json` is the provenance manifest.
- Manifest entry: `{ id, title, author, source_url, license (SPDX id), origin: "library" | "scan" | "handmade", downloaded, archive_url, sha256, modifications, ai_check }`.
- The build fails if any model file has no manifest entry, if a license is outside the allow-list (CC0-1.0, PDDL / public domain, CC-BY-3.0, CC-BY-4.0), or if the origin is outside the list.
- Write the credit into each GLB's `asset.copyright` field as well.
- The repo is public and browsers can download GLBs, so shipping a model counts as redistributing it. That rules out NC, ND and the licenses that forbid redistribution, such as Sketchfab Standard, Fab Standard and BlenderKit. Details are in `docs/model-sourcing.md`.

## Stage 1: The room, the camera and the views

**Room.** Back wall, side-wall stubs, floor edge, the desk, two shelves, and a wall area for the world map. Use plain boxes at first and swap in real models later. Use simple real-time lighting while iterating; it gets baked in Stage 5.

**Surfaces as data.** Each surface is a named anchor:
- desk top
- upper shelf
- lower shelf
- back wall (the map)

Each one has an origin, two in-plane axes, a normal and its size. Stage 4 places objects on these.

**Views as data.** Each view stores a camera pose and pan limits:

| View | Camera | Drag does |
|---|---|---|
| Overview | 3/4 angle at desk height | pans within a small box |
| Table | top-down over the desk | pans across the desk |
| Shelf | front-on | pans left and right along the shelves |
| Map | front-on at the wall | pans and zooms over the map |

**Moving around:**
- Clicking a surface flies the camera to that surface's view.
- Esc, or a right click, goes back one step.
- The HUD switch jumps straight to a view.
- Drag pans, the wheel or a pinch zooms within limits, and transitions use `CameraControls` (animated `setLookAt`).
- On mobile, a swipe pans and a tap selects.

**Done when** all four views work on desktop, a phone, and with only the keyboard, the camera can never leave the room, and it stays smooth on a mid-range phone.

## Stage 2: Pick up and inspect (with a placeholder cube)

- A generic `<Pickable>` wrapper. Anything inside it can be picked up with no extra code.
- A state machine: `idle → lifting → inspecting → returning`, plus `opening` for objects that open (dossier, books, map pins).
- Lifting: a GSAP arc from the resting pose to a point in front of the camera, turning to face the viewer.
- Inspecting:
  - Drag spins the object, with inertia.
  - The wheel or a pinch zooms within limits.
  - Double-click flips it over.
  - An optional caption (name plus one line) comes from the object's data.
- The background blurs: depth of field on desktop, a blurred scrim on mobile or slow devices. The blur is only mounted while something is being inspected.
- Putting it back: Esc, a click outside, or a swipe down. The object returns to exactly where it was.
- Keyboard and screen readers: every pickable has a hidden button proxy. Tab moves between them, Enter picks up, Esc puts down.
- Per-object config: inspect distance, starting orientation, whether it can flip, and an optional `onOpen` action.

**Done when** the cube does all of this on desktop, a phone and the keyboard, and returns to the right spot every time.

**As built** (`Pickable.tsx`, `Inspector.tsx`, `InspectUI.tsx`, `inspect.ts`):

- Built on the mug instead of a cube.
- The lift and return are hand-written eased tweens in `useFrame`, not GSAP. They work with the on-demand frame loop, and the held pose is recomputed from the camera every frame.
- Depth of field was tried and dropped: it also blurred the held object and the hint note. The backdrop is a dark scrim on every device. A selective blur can come back in Stage 5.
- Holding an object shows nothing but the object: no caption and no hint note (Ben's call).
- Keyboard: arrows turn the object, +/- zoom and F flips. Focus moves to a "put back" button and then returns to the object's button.
- `opening` / `onOpen` is deferred to Stage 3, where the dossier needs it.

## Stage 3: The dossier (the core, driven by the database)

A manila folder sits in the centre of the desk with a "start here" note on it. Picking it up opens it, and you flip through the sheets.

**Data in Supabase.** It's public-read only for published rows.

- `dossier_pages`:
  - `id`, `display_order`, `published`
  - `tab` (the divider-tab label, or null)
  - `template` (`cover | profile | experience | project | contact | freeform`)
  - `data jsonb`
- `experiences` and `projects` (existing tables, extended):
  - add `published` and `skills text[]` (they already have `display_order`), so skills now live in the entries;
  - add `kind` to projects (`project | book`) so a shelf book can link to a project.
- Every published experience and project creates its own page automatically, under its own tab. Adding a row adds a page. No code changes.
- Body text is Markdown. A long entry continues onto the next sheet, measured in the DOM.

**Paper:**
- One `<Sheet>` component.
- HTML text over a scanned paper texture with `mix-blend-mode: multiply`.
- An SVG ink-bleed filter.
- A typewriter font plus a handwriting font for margin notes.
- Scanned stamps and coffee rings.

**Interaction:**
- Click or drag a corner to turn the page.
- Arrow keys work too.
- Tabs jump to a section.

The same page data also renders the plain `/list` view and the mobile reader.

**Freshness:** Pages are rendered on the server and revalidated when a row changes, through a Supabase webhook that calls `revalidateTag`. Edits go live without a deploy.

**Done when** adding, reordering or unpublishing a row in Supabase changes the dossier with no code change, and the text reads like ink on paper and can still be selected.

**As built** (`Dossier.tsx`, `reader/`, `src/lib/desk/content.ts`, `supabase/migrations/003_dossier_pages.sql`):

- Existing tables are used unchanged, with no new columns:
  - `experiences` gives one sheet per row.
  - `projects` gives one sheet per row; `tech_stack` is shown as "tools".
  - `skill_categories` and `skills` together give one sheet.
  - Photos and the resume come from the `assets` storage bucket.
- `dossier_pages` holds the hand-written sheets: cover, profile, contact and freeform. It also has placeholder rows (`experiences`, `projects`, `skills`) that mark where each generated section goes and which tab it gets.
  - Until the migration is run, the dossier falls back to work → projects → skills.
- The folder in 3D is a `<Pickable opens>`. Once it's held, a DOM reader takes over, so the text is real, selectable and readable by screen readers.
- Page turns:
  - The sheets are a CSS 3D stack.
  - Dog-eared corners, divider tabs, a swipe, or arrows / PageUp / PageDown / Home / End turn the page.
  - Esc or a click outside puts the folder back.
- Paper and ink:
  - The paper is procedural noise; no scanned asset is needed.
  - An SVG ink filter roughens the headings.
  - Courier Prime sets the body text and Special Elite the headings and stamps. Both go through the credits pipeline.
- Freshness: `/api/desk/revalidate` takes a Supabase webhook, using the `x-desk-secret` header and `DESK_REVALIDATE_SECRET`. Without the webhook, content still refreshes within 5 minutes.
- Not done yet:
  - Long entries scroll inside their sheet instead of continuing onto the next one.
  - The `/list` view.
  - Scanned stamps and coffee rings.

**Paper and pages (after Stage 3):**
- **Pages are flat for now.** Ben saw the folding turn break in Safari: turned-over faces didn't draw, and pages showed the wrong sheet. So the reader shows a static spread (`reader/Page.tsx`).
  - Ways to change pages: a folded-corner arrow on each outer bottom corner, the divider tabs (`reader/Tabs.tsx`), the contents card, swipes and arrow keys.
  - The fold engine (`reader/fold.ts`, `reader/Leaves.tsx`) is kept but unused, to bring back once it works in Safari.
- **Wide screens:** the folder lies open on a two-page spread, and pages are double-sided like a book (`reader/paginate.ts`). The inside front cover holds a lined contents card.
- **Phones:** one page at a time.
- **Divider tabs:** coloured card with typed paper labels. A tab sticks out of the leaf its section starts on, so sections already turned past have their tabs on the left.
- **Textures:** baked by `bun run desk:paper` (`scripts/desk-paper.mjs`).
  - Sheets: ambientCG Paper001 grain plus Paper003 creases.
  - Folder: Paper006, recoloured to manila.
  - Photos: a film-grain tile.
- **Photos** are prints: a white border, gloss, grain, and lifted-corner shadows. They're held by torn tape, or by a paperclip for the headshot.
- **Pages don't scroll.** `Page.tsx` shrinks a page's content with CSS `zoom` (binary search, no lower than 0.5) until it fits. Titles start smaller the longer they are.
- **Contact page:** the resume links to https://bamarler.com/resume, and the Book a meeting link is gone (Ben is removing that page from the site).
- **Safari pitfall:** give SVGs an explicit width and height. Safari won't size one from aspect-ratio alone, and the paperclip came out huge.
- **Performance:**
  - Holding any object no longer re-renders the 3D scene every frame (`Pickable` only invalidates while it tweens).
  - The candle stops asking for frames while the dossier covers the room.
- Until `003_dossier_pages.sql` is run, `content.ts` falls back to the same rows it seeds. Sample sheets (`src/lib/desk/sample.ts`) appear only in development without Supabase keys.

**Room tweaks:**
- `Trinkets.tsx`: Poly Haven props, plus four single Sketchfab books standing spine-out on the lower shelf. Every book can be picked up, as can the clock, binoculars, shell, horse and compass.
  - The books were modelled lying flat, so `Model` `tip` stands them up before sizing.
  - The encyclopedia set (too blurry) and the mug are out of the scene; their files are still in `public/models`.
  - The camera shows about 0.19 m above the upper shelf, so tall props go on the lower shelf or the desk.
  - Glass panes are hidden (`Model` `noGlass`), because they rendered solid black.
- `Reflections` in `Scene.tsx`: a dim `RoomEnvironment`, generated once on load, gives glass, brass and varnish something to reflect.
- The back wall is painted forest green over the plaster (`Surface` `color`), and the shelves are stained toward the table's finish (`Model` `tint`).

## Stage 4: Filling the room

**Placement system.** Everything in the room is one entry in `scene.ts`:

```ts
{ id: "frisbee", model: "frisbee.glb",
  on: "desk", at: [0.42, 0.18], yaw: 35,   // metres from the surface origin, degrees about its normal
  pickable: { caption: "…", flip: true } }
// or a free placement:
{ id: "rocket", model: "rocket.glb", position: [x, y, z], rotation: [rx, ry, rz] }
```

- The resolver turns `on` + `at` into a world transform. It drops the object so the bottom of its bounding box sits on the surface (or its back sits against the wall).
- Optional `stackOn: "<id>"` puts one object on top of another.
- A dev-only mode lets you drag objects around and copy the new coordinates.

**World map (replaces the globe):**
- A flat world map on the back wall, made from public-domain imagery: Natural Earth or NASA Blue Marble.
- Pins come from a Supabase table: `places (name, lat, lon, kind: trip | hike | tournament, date, note, photo)`.
- Pins are positioned with an equirectangular projection: `x = (lon + 180) / 360 · W`, `y = (90 − lat) / 180 · H`.
- Clicking a pin pulls its postcard or polaroid off the map into inspect view.

**Models:**
- Furniture and props come from open libraries: Poly Haven is the base for one consistent photoreal, CC0, human-made style. Gaps are filled from Sketchfab (CC-BY, filtered to "Human Created"), and textures come from ambientCG. Per-object picks are in `docs/model-sourcing.md`.
- Early room pieces: desk `wooden_table_02`, shelves `painted_wooden_shelves`, wall `white_plaster_02`, floor `plank_flooring_02`, books `decorative_book_set_01` (all Poly Haven, CC0).
- Ben's scans are swapped in as they're ready.
- The frisbee is a lathe mesh with his own art on it.

**Built early:** a lit candle at the back-left of the desk (`Candle.tsx`).
- The candlestick is Poly Haven's `wooden_candlestick` (CC0). The source mesh has 213k triangles, so the build simplifies it to about 6% (new optional `simplify` field in `credits.json`).
- The flame, a faint halo and a warm point light are drawn in code. A value-noise flicker drives all three, with an occasional draught that leans the flame over.
- With the "demand" frameloop, the flame asks for 30 frames a second while it's alive. It burns still under reduced motion and in the poster stills.
- The flame draws just before the inspect scrim, so holding something dims it with the rest of the room.

**Credits:** a `/credits` page generated from `assets/credits.json` in TASL format (title, author, source, license), with any changes made. It's linked from the ≡ menu and from a small credits note somewhere in the room.

## Stage 5: Polish, performance and cutover

**Performance:**
- Bake the lighting in Blender.
- Pack textures into atlases.
- Instance repeated objects such as books and coins.
- Use two detail levels: a light proxy in the room, and the full model loaded on hover or pick-up.
- Lazy-load the shelf and map assets.
- Show a still image of the room as the first paint.

**Accessibility and fallbacks:**
- the `/list` route;
- a reduced-motion path;
- a fallback for no WebGL or slow devices.

**Details:**
- the sticky notes;
- the easter eggs (never announced);
- the colour palette, chosen against the lit room.

**Cutover:**
- `/desk` becomes `/`.
- Delete the booking system (code, API routes, Google Calendar, Resend, Turnstile, the tables, and the booking RLS policies that currently expose rows).
- Delete the old sections and the skills tables.
- Decide whether Slingshot stays as an easter egg.

## Open inputs from Ben

- Which real objects to scan.
- Dossier page order and the cover/profile text.
- Real places for the map pins.
- Art for the frisbee.
- Whether shelf books are projects, favourite sci-fi, or both.

**Dossier and props pass (2026-11-17):**
- The cover carries the contact details (location, email, LinkedIn/GitHub with logos, resume) in place of the stamp. The skills and contact pages are out of the seed; both templates still work if a row asks for them.
- The email is scrambled on the server (`scrambleEmail` in `dossier.ts`) and only unscrambled in the browser, so it never appears as plain text in the HTML or RSC payload.
- Photos are stuck down at a random angle of up to ±8° (was ±20°), picked once per browser session (`reader/tilt.ts`). Space is left around each print for its turned corners. Scotch tape (tinted so it shows on cream paper) replaced the paperclips on the cover and the index card.
- The 3D folder uses the same baked manila card as the reader.
- The shelf books stand upright with spines out, flush with the shelf front. `Model` gained `cut` (drops the leather book's ribbon) and `art` (swaps a material's picture).
- The picture frame can be picked up and shows the photos in `assets/frame/`, in name order, changing every 9 s. Listing that folder needs migration 004 (`004_frame_photos.sql`), which is not yet run.
- No text is written into the code (2026-11-17), except the outside of the folder: the 'MARLER, B.' label (`FOLDER_LABEL`), 'personnel file' and the CONFIDENTIAL stamp, which Ben OK'd as fixed. The `DEFAULT_SECTIONS` and `SAMPLE_SHEETS` fallbacks are gone. Every word on the dossier, the page title and the screen-reader text come from `dossier_pages` (keys are listed in 003), `experiences` and `projects`. A key that is left out is simply not shown. The only copy left in code is the UI: sticky-note instructions and the reader's empty/error page.

## Cutover: built on 2026-11-18
- The desk is now the home page. It lives in the `src/app/(desk)/` route group, which holds the page, its own fonts and full-screen layout, and `/credits`. `/desk` and `/desk/credits` redirect there. `/resume` is unchanged.
- Removed:
  - the old landing page: sections, Navbar, SmoothScroll and the space-background canvas;
  - the whole booking system: the `/book` pages, the auth/availability/book/bookings/debug APIs, the booking components, `ui/*`, and the email, calendar, rate-limit, turnstile and validation libraries;
  - `middleware.ts`;
  - 17 dependencies that nothing used any more.
- The database tables and RLS policies for bookings are untouched.
- Slingshot is kept but not routed. Its old page is now `components/slingshot/SlingshotPage.tsx` and its section is `components/slingshot/SlingshotSection.tsx`. The WASM build, `public/wasm` and `slingshot-engine/` are all unchanged.
- A credits link shows in the corner, as the CC-BY licences require. The dev status box only shows in development.
