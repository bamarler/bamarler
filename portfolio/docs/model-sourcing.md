# 3D Asset Sourcing Report: Desk + Wall Shelves Scene (R3F / glTF)

Researched 2026-10-19. Licenses checked against live pages, plus the Poly Haven, ambientCG and Sketchfab APIs. Re-check each license on the day you download, and archive a copy (see Part 3).

**Context that drives the recommendations**
- A GLB that ships to the browser can be downloaded by anyone, so legally you are **redistributing the raw asset**.
- `github.com/bamarler/bamarler` is a **PUBLIC** repo. Any model or texture you commit there is also redistributed as source files. That rules out every "royalty-free but no redistribution" license, even for assets you might somehow obfuscate on the web.
- Visual consistency: Poly Haven alone covers about 60% of the object list in one photoreal, human-made, CC0 style (it has a "Project Lighthouse" and "The Shed" prop set). Use it as the backbone and fill gaps from Sketchfab CC0/CC-BY.

---

## Part 1: Sources

Legend for "Raw GLB on public site / public repo": **OK** = license allows redistribution. **NO** = license forbids redistributing raw files, or requires protection against extraction. **Per-asset** = depends on each model's license.

| Source | License(s) | Raw GLB on public site / public repo | Attribution | Style / quality | AI content | Formats |
|---|---|---|---|---|---|---|
| **Poly Haven** (polyhaven.com) | CC0 for everything | **OK**: "redistribute them, share them around… even in a product you sell" | Not required (appreciated) | Photoreal. Photoscanned textures and HDRIs, hand-made hero props, 1k–8k (some textures up to 16k) | Stated policy: assets are made by humans, not with generative AI. Some ML tools are used for small jobs like seam removal (blog: "AI and Poly Haven") | glTF (+bin+textures), FBX, .blend, USD; textures as JPG/PNG/EXR. Public API (api.polyhaven.com) |
| **ambientCG** | CC0 1.0 | **OK**: explicitly allows putting raw files into projects | Not required. Suggested line: "Created using <asset> from ambientCG.com, licensed under CC0 1.0" | PBR materials. The API's `creationMethod` field tells you whether each one is **Photogrammetry**, **Procedural** (Substance) or **Approximated** (made from a photo) | No published generative-AI statement found. The creationMethod field gives provenance per asset | JPG/PNG maps 1k–16k, some .sbsar, a few models |
| **Sketchfab** (downloadable filter) | Chosen per model: CC0, CC-BY 4.0, CC-BY-SA, CC-BY-ND, CC-BY-NC(-SA/-ND), and **Sketchfab Standard** (now also used for free downloads) | **Per-asset.** CC0 and CC-BY are OK. **Standard: NO.** Files "cannot be resold or redistributed" and must sit inside a larger work, and a raw fetchable GLB is arguably just the file. NC and ND are risky (see Part 3) | CC-BY: TASL required | Huge range: museum scans, photogrammetry, hobbyist work, low-poly | Creators must tag AI work `CreatedWithAI`. A "Human Created / AI Generated" search filter exists, but it relies on self-reporting. The `NoAI` tag only bans *using the model for AI training*; it does not restrict you | Original upload plus an auto-converted glTF/GLB/USDZ |
| **Poly Pizza** | Per model: **CC0** or **CC-BY 3.0** (the Google Poly archive is CC-BY 3.0, credited as "Poly by Google") | **OK** for both | CC-BY 3.0 needs **Title**, author, source and license | Low-poly, flat-shaded. Upload guidelines require that style | No AI policy found. The ToS bans scraping the site for ML | GLB/glTF, OBJ, FBX |
| **Kenney** | CC0 | **OK** | Not required. Don't use the Kenney logo | Clean stylized low-poly | No statement found. Long-running solo studio work | GLB, FBX, OBJ |
| **Quaternius** | CC0 | **OK**: free to modify and combine | Not required | Stylized low-poly | No statement found | FBX, .blend (many packs also include glTF) |
| **Smithsonian 3D** (3d.si.edu) | **CC0 only when labelled "CC0".** Others say "Usage conditions apply" = non-commercial, educational and personal use only | CC0 items **OK**. "Usage conditions" items: **NO** (avoid) | Not required for CC0 | Museum-grade scans of artifacts, specimens and spacecraft. Very high poly, so they need decimating | Scans. No AI | GLB, glTF, OBJ, PLY, USDZ (from the 3d.si.edu viewer) |
| **NASA 3D Resources** (science.nasa.gov/3d-resources, github.com/nasa/NASA-3D-Resources) | "Free and without copyright" (US Gov work). Follows NASA Media Usage Guidelines | **OK** | Credit "NASA" requested, not required. **Don't use the NASA insignia or "worm" logo as branding, don't imply endorsement.** The guidelines also forbid putting NASA insignia in AI-generated imagery | Engineering and outreach models of mixed quality | Made by NASA staff | GLB (newer), 3DS, OBJ, .blend, STL |
| **BlenderKit** (blenderkit.com, which currently 301-redirects to blendkit.com) | Two licenses: **CC0** or **Royalty Free** | CC0 assets: **OK**. Royalty Free: **NO**. It forbids resale "in the same form", and its FAQ allows games only "if these can't be extracted by the users in an easy way" | RF: none | Wide range. Many good PBR materials | No AI policy found in the license docs | .blend through the add-on (export to glTF yourself) |
| **Fab.com** (Epic) | **CC-BY 4.0** (free) or **Fab Standard License** (free or paid, Personal/Professional tiers). No CC0 option | CC-BY: **OK**. Standard: **NO**. You may ship projects that incorporate it and share it with collaborators through a private repo, but you may not redistribute the asset on its own. That rules out a public repo and a raw GLB | CC-BY: TASL | Mostly game/Unreal assets, plus Quixel Megascans (Standard license) | **Heavy AI presence.** `CreatedWithAI` disclosure is required, and you can hide those assets through "content preferences", but press and forum reports describe floods of untagged AI uploads | Varies: FBX, glTF, .uasset |
| **Thingiverse / Printables** | Per upload: CC-BY, CC-BY-SA, CC-BY-NC(-SA), CC0, GPL, etc. Printables also has its own restrictive licenses for paid/Club files. Most Thingiverse files are NC | Per-asset. Usable **only** when CC0 or CC-BY (SA if you accept share-alike) | Per license | STL meant for printing. **No UVs or textures.** Shapes only, so you would retexture them with CC0 materials | Growing amount of AI-made STLs. Provenance is hard to check, and re-uploads of copyrighted characters are common | STL, 3MF, STEP |
| **Textures.com** | Proprietary license | **NO.** "Redistribution of the materials is not allowed." Images can't go under open-source licenses: *"if working on an open source game, content… must be released under a closed source license"*. That is incompatible with a public repo | Bundling requires a notice | Excellent photo textures | No statement found | JPG/PNG/TIFF, PBR sets |
| **CGTrader free / TurboSquid free** (other sources) | Royalty Free (proprietary) | **NO.** Both require you to stop end users getting at the model (proprietary or encrypted formats). TurboSquid only allows Unity/Unreal/Lumberyard WebGL exports, so an open GLB is out | – | Mixed | Mixed. Both allow AI uploads | Various |
| **Free3D** (other) | Mostly "personal use only" | **NO** (avoid) | – | Mixed | Unknown | Various |
| **Natural Earth** (naturalearthdata.com) | Public domain | **OK** | Not required | Cartographic rasters (shaded relief, "Natural Earth II", "Gray Earth") | No | GeoTIFF/PNG |
| **NASA Blue Marble NG** | Public domain (NASA) | **OK** | Credit "NASA Earth Observatory" requested | Satellite composite world maps, 5400x2700 up to 21600x10800 | No | JPG, GeoTIFF |
| **Museum Sketchfab accounts** (other) | Often CC0, e.g. Cleveland Museum of Art, Minneapolis Institute of Art (artsmia), Scottish Maritime Museum, The Hunt Museum, DiNArDa (disc3d), ffish.asia | OK when the license is CC0 | – | Photogrammetry scans | No | glTF/GLB |
| **Wikimedia Commons / Library of Congress** (other, for map posters) | PD or CC, per file. LoC often says "No known restrictions" | Per-file | Per file | Vintage map scans | Check the file history | JPG/TIFF |
| ⚠ **David Rumsey Map Collection** (other) | CC BY-NC-SA | Avoid (NC) | – | Great vintage maps | – | – |

**Bottom line for this project:** use **CC0 first** (Poly Haven, ambientCG, Smithsonian CC0, NASA, Natural Earth), then **CC-BY** (Sketchfab, Poly Pizza, Fab CC-BY only). **Never** use Sketchfab Standard, Fab Standard, BlenderKit Royalty Free, Textures.com, CGTrader, TurboSquid or Free3D. All of them conflict with both the open GLB and the public repo.

**Sketchfab ownership note:** Epic closed the Sketchfab Store in Oct 2024 and moved commerce to Fab. In **August 2026 KitBash acquired Sketchfab** (per Wikipedia). Reports from September 2026 say free downloads, the download API and the filters still work as before. Because the terms could change again, archive the license for each asset when you download it.

---

## Part 2: Specific candidates

Poly Haven URLs follow `https://polyhaven.com/a/<id>`. "Polycount" is the figure the Poly Haven API reports. Sketchfab "faces" is the API's faceCount (triangles). Every Poly Haven entry is **CC0, human-made, and has glTF downloads at 1k/2k/4k (8k where noted)**.

### Furniture and surfaces

| Object | ★ Pick | Author | License | Detail | Alternates |
|---|---|---|---|---|---|
| Wooden desk/table | ★ **Wooden Table 02**: polyhaven.com/a/wooden_table_02 | Serhii Khromov | CC0 | 196 polys. Roughly 1134×706×800 mm, which is desk-sized. Warm worn varnished wood. 1k–4k | `dining_table` (Aron Łyczek, 1,048, 8k, has a cloth); `metal_office_desk` (Ulan Cabanilla, 6,898, 8k); `SchoolDesk_01` (Ethan Place, 4,162); `WoodenTable_01` (952) |
| Wall shelves / bookshelf | ★ **Painted Wooden Shelves**: polyhaven.com/a/painted_wooden_shelves | Kirill Sannikov | CC0 | 524 polys, vintage farmhouse look, 4k | `Shelf_01` (Gabriel Radić, 182, tall bookcase); `wooden_display_shelves_01` (James Ray Cock, 3,174, 8k, cubbies); `wooden_bookshelf_worn` (Ulan Cabanilla, 10,106); `steel_frame_shelves_03`. For a true floating wall shelf, model a plank in Blender and use a Poly Haven wood texture (CC0) |
| Wall / plaster PBR | ★ **White Plaster 02**: polyhaven.com/a/white_plaster_02 | Rob Tuytel | CC0 | Photoscanned, up to 8k | Poly Haven `beige_wall_001` (up to 16k), `painted_plaster_wall`, `white_stucco`; ambientCG **PaintedPlaster017** (photogrammetry, up to 16k): ambientcg.com/view?id=PaintedPlaster017 |
| Wood floor PBR | ★ **Plank Flooring 02**: polyhaven.com/a/plank_flooring_02 | Dario Barresi, Dimitrios Savva | CC0 | Indoor plank floor, photoscanned | Poly Haven `wooden_floor_01`, `herringbone_parquet`, `laminate_floor_02`, `wood_floor_worn`; ambientCG `WoodFloor043` (approximated, up to 16k), `WoodFloor051` (procedural) |

### Desk and shelf props

| Object | ★ Pick | Author | License | Detail | Alternates / notes |
|---|---|---|---|---|---|
| Books (row) | ★ **Decorative Book Set 01**: polyhaven.com/a/decorative_book_set_01 | James Ray Cock | CC0 | Around 112k polys for the whole set. Many paperback, hardcover and magazine variants with ~90 cover textures, all explicitly CC0. You can split out single books | `book_encyclopedia_set_01` (John Malcolm, 67k, 8k, leather spines) |
| Book (single) | ★ Split one from **Decorative Book Set 01** | as above | CC0 | Pull out single `book_hardcover_01` / `book_softcover_01` meshes | – |
| Desk lamp | ★ **Desk Lamp Arm 01**: polyhaven.com/a/desk_lamp_arm_01 | Yann Kervran, Kuutti Siitonen | CC0 | 25,710 polys, rigged, clamp-on industrial lamp, 8k | `industrial_pipe_lamp` (8,626); `vintage_oil_lamp` |
| Coffee mug | ★ **Old Ceramic Mug**: sketchfab.com/3d-models/old-ceramic-mug-e553f0cf76454aab8c4f4b22be781c9c | Coozy (@GameDevNick) | CC-BY 4.0 | 2,136 faces, Blender + Substance, 2021 | **Old Rustic Metal Mug** by Sousinho (8,636, CC-BY, 2021, campy enamel look that suits the carabiner/headlamp theme): …/old-rustic-metal-mug-8158f80a28a24d4a8b8cfc6026a0dbf1; **Soviet Enamel Mug** by Rusty-exe (3,824, CC-BY): …/soviet-enamel-mug-15418a900807467495ea46f574effd20; CC0 scan "Pottery Vessel or Mug" by The Hunt Museum (180k, medieval): …/pottery-vessel-or-mug-f11b4220bda84ca19012727e26e284c1. Poly Haven has no mug; `tea_set_01` has cups |
| Potted plant | ★ **Potted Plant 04**: polyhaven.com/a/potted_plant_04 | James Ray Cock | CC0 | 6,097 polys, zebra haworthia in a ceramic pot, 8k. Light enough for the web | `potted_plant_01` / `_02` (Rico Cilliers, 96k / 70k, heavy); `planter_pot_clay` + `anthurium_botany_01` |
| Film camera | ★ **Camera 01**: polyhaven.com/a/Camera_01 | Rajil Jose Macatangay | CC0 | 26,987 polys, vintage rangefinder with leather strap, 8k | Sketchfab "Canon AT-1 Retro Camera" by AleixoAlonso (CC-BY, 17,984), but it carries the Canon trademark: …/models/9de66868d0f240e985da00c9480bfc82 |
| Binoculars | ★ **Binoculars**: polyhaven.com/a/binoculars | Derek Wight | CC0 | 19,248 polys, black metal + leatherette, 8k | `vintage_binocular` (Luke, 19,362, 4k) |
| Compass | ★ **Seadogs Compass**: polyhaven.com/a/seadogs_compass | Benny Weimer | CC0 | 11,645 polys, brass with hinged lid, 8k | – |
| Rock / stone | ★ **Stone 01**: polyhaven.com/a/stone_01 | Dario Barresi, Rico Cilliers | CC0 | 71,916 polys, reddish quartz stone, about 15 cm, 8k. Decimate or use the LOD | `moon_rock_02` (6,194, light); `rock_07` (27,830) |
| Pinecone | ★ **Pine Cone from Turkey**: sketchfab.com/3d-models/pine-cone-from-turkey-55372cc6491d438db509bd17b016c75c | Nik (@nikska) | CC-BY 4.0 | 50k faces, Metashape photogrammetry, 2020 | CC0: **Pine cone 2** by DiNArDa (@disc3d), 90k, research scan (DISC3D) of a ~1 cm cone, so rescale it: …/pine-cone-2-7982178a74c24bfcbfa51af8cc726494 |
| Carabiner | ★ **Climbing Carabiner**: sketchfab.com/3d-models/limbing-arabiner-729335154e874aa38550bc9dff23c734 | spaceexpert | CC-BY 4.0 | 14,700 faces, PBR, 2020 | "Climbing Carabiner" by clgreene86 (1,722, CC-BY): …/climbing-carabiner-0b7ea2052c8443cdb20b538c583711e9; "CC0 – Carabiner" by plaggy (780). ⚠ The plaggy description says CC0 but Sketchfab's license field says **CC-BY**, so credit it as CC-BY. Avoid kugraf's version (1.15M faces) |
| Headlamp | ★ **Headlamp**: sketchfab.com/3d-models/headlamp-752a00fbccb94d098889c3326bc23c65 | NameSsis | CC-BY 4.0 | 1,430 tris, PBR/ORM, game-ready, 2023. Tagged `noai`, which only bans AI training | "Duracell Headlamp" by Eric Wallbank (1,212, 2048 PBR, Substance, 2022), but it carries the Duracell trademark: …/duracell-headlamp-a830876258994658ad05e8b71d402972. Poly Haven has no headlamp; `small_plastic_torch` and `vintage_flashlight` are CC0 flashlights |
| Multimeter | ★ **Retro Multimeter**: polyhaven.com/a/retro_multimeter | elli moeller | CC0 | 13,356 polys, analog meter with probes, 4k | – |
| Circuit / dev board | ★ **Arduino Uno R3, Elegoo**: sketchfab.com/3d-models/arduino-uno-r3-elegoo-69d58a27ae814b429e39b2c19d648cdd | Lassi Kaukonen (@thesidekick) | CC-BY 4.0 | 57,540 faces. **Photogrammetry** of a used board (Sony A7Riv, Metashape), 2023. `noai` tag only bans training | CC0: Poly Haven `circuit_board` (Benny Weimer, 14,430, a retro motherboard, which reads as a PC part rather than a dev board); "Raspberry Pi 3" by JoSaCo (CC-BY, 6,851): …/models/2d308283fc0f4d27b81f17a2793c5c4d |
| Keys | ★ **Keys**: sketchfab.com/3d-models/keys-aaccd2b9848d4e9d938cdc9d5293c7b3 | imparity | CC-BY 4.0 | 3,688 faces, house/car key bundle, 2019 | "Old Key" by Meerschaum Digital (1,556, 4K PBR, vintage): …/old-key-dcf61f79745b47778ad10aa28199df50; "Key & Keychain" by tonken (6,752, rusty) |
| Glasses | ★ **Round Spectacles**: polyhaven.com/a/round_spectacles | Sean Buckley | CC0 | 11,810 polys, thin metal frame, 8k | – |
| Pens | ★ **Pen**: sketchfab.com/3d-models/pen-76d3050b6c2646278feaa28007d180cb | Chad (@cpenfold) | CC-BY 4.0 | 1,598 faces. Paper Mate Kilometrico at real scale, blue/red/black variants, full PBR, 2021 | "Boring blue ballpoint pen" by sbl (@shaul) (6,220): …/models/a9f4d19a7ee84db794a5e7528df6f142. Poly Haven `binder_notebook` already includes a pen |
| Pencils | ★ **Pens with Pencil holder – desk props**: sketchfab.com/models/1f33e40c27fe451e9efda612c69010ae | janexx | CC-BY 4.0 | 1,324 faces. Detail not verified, so check the style in the viewer | "Low Poly Pencils" by BlackCube (10,036, stylized); "CC0 – Pencil" by plaggy (124, CC-BY in the license field) |
| Notebook | ★ **Binder Notebook**: polyhaven.com/a/binder_notebook | DaDrood | CC0 | 18,077 polys, leather binder with pen, 8k | "Single spiral notepad" by Sousinho (CC-BY, 30,342, 2k): …/single-spiral-notepad-80299283fefc44649ae00bf4992b7ba2; Poly Haven `clipboard` (6,176) |
| Paper / folder / manila envelope | ★ **Document File Folder**: sketchfab.com/3d-models/document-file-folder-11390179bba7462484d344e2fe22c703 | Kami Rapacz (@kuroderuta) | CC-BY 4.0 | 1,505 faces, A4, separate pages, open/close animation, 2023 | Envelope: "Stamp Envelope" by kelvladmail (3,263, 2k): …/stamp-envelope-b2be990d9e93441d939631c49738f591; "Papers & Envelopes" by Michael V (@bossdeff) (460). **Best manila option:** a simple folded plane in Blender with ambientCG **Paper004/Paper006** (CC0) |
| Postcards / paper textures | ★ **Postcard Set 01**: polyhaven.com/a/postcard_set_01 | James Ray Cock, Jurita Burger | CC0 | 2,720 polys, weathered travel postcards, 8k | ambientCG **Paper003** (creased white, up to 8k), **Paper004** (brown packing), **Paper006** (beige), **Cardboard001**, all CC0 |
| Frisbee / flying disc | ★ **D1 Prodigy Disc Golf Disc**: sketchfab.com/3d-models/d1-prodigy-disc-golf-disc-86d96edff93743cea4a26655ffbcfc61 | Ethan McMullan (@Haggis201) | CC-BY 4.0 | 79,872 faces, so decimate it heavily. 2022 | "Disc Golf Frisbee" by smoketreestudios (240, untextured, 2016). A frisbee is also simple enough (a lathe profile) to model yourself in 10 minutes and texture with CC0 plastic |
| World map | ★ **NASA Blue Marble NG w/ Topography & Bathymetry**: science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry (e.g. visibleearth.nasa.gov/images/73801) | NASA Earth Observatory (Reto Stöckli) | Public domain | 5400×2700 (8 km/px) up to 21600×10800, JPG | **Natural Earth II / Shaded Relief** rasters (public domain): naturalearthdata.com/downloads/10m-raster-data/. These look more like a printed poster. Wrap either in Poly Haven `hanging_picture_frame_01..03` (CC0) |
| Model rocket | ★ **Saturn V**: science.nasa.gov/3d-resources/saturn-v/ | Michael D. Carbajal (NASA) | Public domain (NASA) | GLB, about 905 KB (about 34.8k polygons according to the data.gov listing). Scale it down as a desk display model | ⚠ Sketchfab "Model Rocket Estes A10 – 3096080" by jebuege (CC-BY, 5,252, 2024): no description, and the number looks like a re-uploaded Thingiverse thing ID, so provenance is unclear. ⚠ "Soaring Flame (Estes E-Class Rocket)" by Lorenzo-Richmond (2024): marketing-style description and stop-word tags ("the", "and", "a") look AI-assisted. Avoid both. Smithsonian NASM holds "Rocket, Flying Model" objects, but no CC0 3D scans were found |
| Trophy | ★ **Golden Trophy**: sketchfab.com/3d-models/golden-trophy-79389eecca164e27a75d362fbbecfe3b | Incg5764 | CC-BY 4.0 | 7,408 faces, 2k PBR + AO, Blender, 2022 | "Antique Trophy Goblets" by Mad_Lobster_Workshop (28,248, silver, vintage tone that fits Poly Haven): …/antique-trophy-goblets-07b46238d3d34842af48ad817f38f341; "Trophy" by Urielgc (8,062, 2024) |

**Bonus CC0 Poly Haven props in the same style** (fillers for clutter): `vintage_stapler`, `pocket_watch`, `magnifying_glass_01`, `digital_wrist_watch`, `measuring_tape_01`, `portable_cassette_player`, `vintage_radio_transceiver`, `alarm_clock_01`, `standing_picture_frame_01/02`, `classic_laptop`, `ceramic_vase_01..04`, `lambis_shell`, `vintage_lighter`, `screwdriver`, `pliers`, `small_plastic_torch`. Poly Haven **HDRIs** (CC0) work for environment lighting and reflections.

**AI/provenance review of the picks:** every ★ pick has a named human author. They are either studio-reviewed (Poly Haven), photogrammetry with capture details (Arduino, pinecone), or uploads with Substance/Blender workflow notes made before the 2024 surge in AI 3D generators. Flagged items: the Estes rockets (above) and plaggy's "CC0" titles that conflict with the CC-BY license field. The **Sketchfab `noai` tag is not a red flag.** It is the creator opting out of AI training.

**Trademarks:** brand logos (Paper Mate, Arduino/Elegoo, Duracell, Canon, Faber-Castell, NASA meatball/"USA" on the Saturn V) raise trademark questions, not copyright ones. Showing a real object incidentally is generally fine. Don't use the logos as your own branding, and repaint them if you're unsure.

**Web budget tip:** download the 1k or 2k glTF variants. Run them through `gltf-transform` (`simplify`, `meshopt` or `draco`, and `ktx2`/`webp` textures). Decimate the 50k–100k scans (stone, pinecone, Arduino, disc) to about 5–15k. Decimating and recompressing counts as an *adaptation*, which is fine under CC0 and CC-BY, but note it in the credits ("decimated, textures recompressed").

---

## Part 3: Practical notes

### Credits-page format (TASL)
CC's recommended practice is **Title, Author, Source, License**, each one linked. CC-BY 4.0 §3(a) also requires you to **indicate modifications** and allows attribution "in any reasonable manner… e.g. by providing a URI or hyperlink" to a page with the required information. A dedicated `/credits` page linked from the scene UI or footer satisfies this. CC-BY **3.0** (Poly Pizza / Google Poly) also requires the **title**.

Template (HTML or MDX):

```
"Climbing Carabiner" (https://sketchfab.com/3d-models/...-729335154e874aa38550bc9dff23c734)
by spaceexpert (https://sketchfab.com/spaceexpert)
is licensed under CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/).
Changes: decimated to 6k tris, textures resized to 1k and converted to KTX2.
```

For CC0 and public domain, credit anyway (courtesy, and because you said every model will be cited):
`"Desk Lamp Arm 01" by Yann Kervran & Kuutti Siitonen, Poly Haven — CC0 1.0.`
`"Saturn V" by Michael D. Carbajal / NASA — public domain (NASA media guidelines; no endorsement implied).`

Group the page by object. Include each asset's license link and a short "modifications" line, plus the line "Textures: ambientCG.com (CC0)" where they are used.

### Is CC-BY-NC OK for a personal portfolio? Recommendation: **avoid it.**
- The CC 4.0 definition: NonCommercial = "not primarily intended for or directed towards **commercial advantage or monetary compensation**."
- A job-seeking or freelance portfolio is self-promotion **aimed at getting paid work**, so it is a grey area. Many licensors would call it commercial advantage. The test is about the *use*, not whether you charge visitors. The site appears to have a **booking** feature (recent commit "race condition on bookings"). If that is for consultations or paid work, the site's commercial character gets stronger.
- Some university and Canadian copyright guidance calls portfolios non-commercial, but that guidance concerns *local copyright exceptions*, not CC license interpretation.
- **ND** (NoDerivatives): decimating or retexturing for the web is arguably an adaptation, so avoid it.
- **SA** (ShareAlike): usable, but the *adapted model* must be released under BY-SA. That doesn't cover your site code. Avoid it unless the model is irreplaceable.
- **Sketchfab/Fab Standard**, even when free: avoid. They forbid raw redistribution, and your public repo plus fetchable GLB is exactly that.

### Other gotchas
1. **The public GitHub repo is itself redistribution.** It's fine for CC0 and CC-BY (keep a `public/models/CREDITS.md` or a manifest next to the files). It's fatal for Textures.com, Fab/Sketchfab Standard, BlenderKit RF, CGTrader and TurboSquid.
2. **Sketchfab license field beats the title or description.** If they conflict (e.g. plaggy's "CC0 – …" models are licensed CC-BY), follow the stricter one, or ask the author.
3. **Smithsonian:** only items explicitly labelled **CC0**. "Usage conditions apply" means non-commercial only.
4. **NASA:** the models are public domain, but the insignia and logotype are protected (14 CFR 1221), and no endorsement may be implied.
5. **Re-uploads and laundering:** a Sketchfab model with a numeric ID in its name (like "…– 3096080"), or a rip of a game or film asset, may not be the uploader's to license. Skip those.
6. **AI-detection heuristics** (Sketchfab's filter is self-reported): uploaded after 2024; tags or descriptions mentioning Meshy, Tripo, Rodin, Hunyuan3D, Luma Genie, CSM or "image-to-3D"; dense uniform triangle soup with a single baked, blurry diffuse map and no separate normal/roughness maps; melted fine detail (text, knurling); generic LLM-style descriptions or stop-word tags. Turn on Sketchfab's **"Human Created"** filter and Fab's **"hide Created With AI"** content preference, but don't rely on them.
7. **Ownership changes** (Sketchfab to KitBash in Aug 2026): save the license as it stood at download time.

### Provenance manifest (one entry per asset)
Keep `assets/manifest.json` (or YAML) in the repo, and generate `/credits` from it at build time so the two can't drift apart:

```json
{
  "id": "carabiner",
  "file": "public/models/carabiner.glb",
  "title": "Climbing Carabiner",
  "author": "spaceexpert",
  "author_url": "https://sketchfab.com/spaceexpert",
  "source": "Sketchfab",
  "source_url": "https://sketchfab.com/3d-models/limbing-arabiner-729335154e874aa38550bc9dff23c734",
  "source_uid": "729335154e874aa38550bc9dff23c734",
  "license": "CC-BY-4.0",
  "license_url": "https://creativecommons.org/licenses/by/4.0/",
  "retrieved": "2026-10-19",
  "license_snapshot": "https://web.archive.org/web/2026.../sketchfab.com/3d-models/...",
  "original_download": { "format": "glTF (autoconverted)", "texture_res": "2k", "sha256": "..." },
  "modifications": ["decimated 14.7k -> 6k tris", "textures 2k -> 1k KTX2", "rescaled to 10 cm"],
  "human_made_evidence": "Uploaded 2020, PBR, author portfolio of hand-modelled gear; no CreatedWithAI tag",
  "ai_flag": false,
  "trademarks": []
}
```

Practices:
- Save the Wayback Machine snapshot of the asset page (or a PDF or screenshot) at download time. Store the original zip's **sha256**.
- Also write credit into the GLB itself. glTF 2.0 has `asset.copyright`, and `asset.extras` can hold source, license and author, so the attribution travels with the fetchable file. One way: `gltf-transform` with a small script, or a Blender export with custom properties.
- Use SPDX IDs (`CC0-1.0`, `CC-BY-4.0`, `CC-BY-3.0`) so a CI check can **fail the build if any asset's license is not in the allow-list** `[CC0-1.0, CC-BY-4.0, CC-BY-3.0, PD-USGov, PD]`, or if a manifest entry is missing for a file in `public/models`.
- Textures applied in Blender (ambientCG, Poly Haven) get their own manifest entries, linked from the model entries that use them.

---

### Sources consulted (main)
- Poly Haven license: https://polyhaven.com/license · AI stance: https://blog.polyhaven.com/?p=2377 · API: https://api.polyhaven.com
- ambientCG license: https://docs.ambientcg.com/license/ · API: https://ambientcg.com/api/v2/full_json
- Kenney: https://kenney.nl/support · Quaternius: https://quaternius.com/faq.html
- Poly Pizza ToS: https://poly.pizza/docs/tos · upload rules: https://poly.pizza/docs/uploading
- Sketchfab NoAI/CreatedWithAI: https://sketchfab.com/blogs/community/introducing-the-noai-createdwithai-tags/ , https://sketchfab.com/blogs/community/restricting-generative-ai-use-of-free-models · Store license FAQ: https://help.sketchfab.com/en/articles/16152225-store-license-usage-faq · Ownership: https://en.wikipedia.org/wiki/Sketchfab · Migration: https://sketchfab.com/blogs/community/fab-publishing-portal-open-for-sketchfab-migration
- Fab licenses: https://dev.epicgames.com/documentation/en-us/fab/licenses-and-pricing-in-fab · AI on Fab: https://80.lv/articles/epic-games-adresses-ai-generated-content-plaguing-fab
- BlenderKit licenses: https://www.blendkit.com/docs/licenses/ and /licensing-faq/
- Textures.com license FAQ: https://www.textures.com/faq-license
- TurboSquid RF FAQ: https://www.turbosquid.com/help/en/articles/9937423-royalty-free-license-faq · CGTrader: https://licenseorg.com/guide/3d-assets/cgtrader
- Smithsonian 3D: https://3d.si.edu/collections/openaccesshighlights · https://www.si.edu/spotlight/openaccesshighlights
- NASA 3D: https://science.nasa.gov/3d-resources/ · https://github.com/nasa/NASA-3D-Resources · Guidelines: https://www.nasa.gov/nasa-brand-center/images-and-media/
- Blue Marble NG: https://science.nasa.gov/earth/earth-observatory/blue-marble-next-generation/base-topography-bathymetry · Natural Earth terms: https://www.naturalearthdata.com/about/terms-of-use/
- CC BY-NC 4.0 legal code: https://creativecommons.org/licenses/by-nc/4.0/legalcode.en · Attribution practices: https://wiki.creativecommons.org/wiki/Recommended_practices_for_attribution
