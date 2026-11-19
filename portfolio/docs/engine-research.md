# Engine choice for "The Desk" (bamarler.com redesign)

Research date: 2026-10-19. Scope: a bounded 3D room (desk, shelves, wall map, about 50–150 small photoreal Poly Haven props), a few camera views, pick-up-and-spin inspection with background blur, and a "dossier" of paper sheets whose text has to look like ink but stay crisp, selectable, searchable, accessible and indexed. Content comes from Supabase, and the site is Next.js 16 / React 19.2.

A note on sources. Some of the figures below (Godot 4.7 and Unity 6.6 release details, some build sizes) come from aggregator and guide sites such as cinevva.com and summerengine.com, not from vendor release notes. They are flagged "(secondary)". Vendor docs, WebKit, Chrome and Awwwards case studies are primary.

---

## 1. The deciding constraint: the dossier text

Whatever draws the room, the dossier text has to be real DOM text. Only real DOM text gets selection, find-in-page, screen readers, and SEO.

- Googlebot runs JavaScript but does not render WebGL. A canvas has no indexable text, so canvas-only content looks like an empty page unless you ship SSR/SSG HTML alongside it ([utsubo SEO guide](https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide), [Google: JS SEO](https://developers.google.com/search/docs/guides/rendering), [three.js forum](https://discourse.threejs.org/t/seo-for-three-js-sites/10064), [PlayCanvas forum](https://forum.playcanvas.com/t/experience-with-html-text-rendering-and-seo/11643)).
- Game-engine UI text is drawn into the canvas, so it is not selectable and not indexed. Godot 4.5 added AccessKit screen-reader support, but it is experimental and covers only Control nodes. Nobody has confirmed it works in web exports ([Godot 4.5 a11y](https://caniplaythat.com/?p=15209), [Godot forum: web accessibility](https://forum.godotengine.org/t/web-accessibility/130874)).
- **HTML-in-Canvas** (`layoutsubtree`, `drawElementImage`, `texElementImage2D`, `copyElementImageToTexture`) is the API that would let real DOM text become a WebGL/WebGPU texture while keeping hit-testing and accessibility in sync. Today it is only a Chrome/Edge origin trial, extended through Chrome 160, with no Safari or Firefox commitment ([Chrome blog](https://developer.chrome.com/blog/html-in-canvas-ot-changes), [Edge OT](https://developer.microsoft.com/en-us/microsoft-edge/origin-trials/trials/a297467e-0030-4c4c-8739-48e130026c03)). Treat it as a progressive enhancement at most.

**So every option ends up as a hybrid.** The canvas draws the room. The dossier is a DOM layer: server-rendered HTML sitting over the canvas, or CSS-3D-transformed to line up with the paper mesh, or swapped in when the folder is "open". The ink look comes from CSS (a handwriting or typewriter webfont, `mix-blend-mode: multiply` over a paper texture, a light SVG displacement filter). The engine decision is then about how easily each engine syncs a DOM layer with its camera and objects, and how much it costs to download.

---

## 2. What the famous 3D sites actually use

| Site | Stack | Source |
|---|---|---|
| Bruno Simon folio 2025 | three.js with WebGPURenderer + TSL, **Rapier (Rust→wasm) physics**, Vite, Blender. Draco/quantization, KTX2 (ETC1S + UASTC), instancing. DoF and water blur turned off on mobile | [Awwwards case study](https://www.awwwards.com/brunos-portfolio-case-study.html), [GitHub](https://github.com/brunosimon/folio-2025) |
| Igloo Inc (Awwwards SOTY) | three.js, Svelte, GSAP, Vite, three-mesh-bvh, Houdini/Blender, custom VDB exporter. UI also rendered in WebGL for glitch-text effects | [Awwwards case study](https://awwwards.com/igloo-inc-case-study.html), [three.js forum](https://discourse.threejs.org/t/landing-site-igloo-inc/67249) |
| Lusion | three.js (plus Houdini, Redshift, webpack) | [Awwwards case study](https://awwwards.com/case-study-for-lusion-by-lusion-winner-of-site-of-the-month-may.html) |
| Room portfolios (Jesse Zhou and many others) | three.js / R3F + GSAP | [three.js forum showcases](https://discourse.threejs.org/t/portfolio-3d-desktop-room/20736), [another](https://discourse.threejs.org/t/showcase-3d-portfolio-website-built-with-three-js-and-react-three-fiber/87470) |
| Figma (not a portfolio, but the best C++→wasm canvas app) | C++ core → wasm, WebGL/WebGPU canvas, **React/TS for all UI around it** | [Figma blog](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/), [Evan Wallace](https://madebyevan.com/figma/webassembly-cut-figmas-load-time-by-3x) |

Pattern: every award-level portfolio uses three.js. Wasm shows up only for specific heavy modules (Rapier physics), never for the renderer. Figma, the main C++/wasm success story, still uses DOM/React for everything text-like.

**Game-engine and C++ portfolios found:** Godot portfolios exist, but as itch.io games, not as primary websites: [reecemungus Interactive Portfolio](https://reecemungus.itch.io/interactiveportfolio), [Sarthak Gambhir interactive résumé](https://astrabound.itch.io/interactive-resume-sarthak-gambhir). There is also a Unity WebGL one, [Kevin Brady Interactive Portfolio 2025](https://surftheglitch.itch.io/portfolio), which is "PC; mobile coming soon". The Unity forum's standard advice is to build the site in a web framework and embed the Unity build ([Unity discussions](https://discussions.unity.com/t/responsive-website-in-form-of-a-portfolio-using-webgl/832382)). **I found no notable 3D portfolio *website* built on a custom C++/wasm renderer.**

---

## 3. Option A: JS web 3D engines

### three.js + React Three Fiber (current plan)
- **Size:** three.js core is about 600 KB min / **about 150 KB gzip**, and tree-shaking barely shrinks it ([three.js forum](https://discourse.threejs.org/t/three-js-file-size-when-importing-via-npm-and-bundling-with-webpack/8904)). With R3F, drei and postprocessing, expect a few hundred KB gzip of JS. That is 20–60x smaller than any game-engine runtime.
- **WebGPU:** WebGPURenderer has been production-ready since about r171, with automatic WebGL2 fallback. TSL compiles to WGSL or GLSL ([three.js manual](https://threejs.org/manual/en/webgpurenderer.html), [utsubo migration guide](https://www.utsubo.com/blog/webgpu-threejs-migration-guide)). Safari 26 ships WebGPU on macOS, iOS, iPadOS and visionOS ([WebKit: Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)).
- **glTF:** GLTFLoader supports KTX2/Basis (KTX2Loader), meshopt (EXT_meshopt_compression), Draco, and the KHR material extensions Poly Haven uses ([GLTFLoader docs](https://threejs.org/docs/pages/GLTFLoader.html)). gltf-transform + KTX-Software is the same pipeline Bruno Simon uses.
- **DoF:** `@react-three/postprocessing` DepthOfField (`focusDistance`, `focalLength`, `bokehScale`) on WebGL. A TSL DoF node exists for WebGPU ([codrops BatchedMesh/WebGPU demo](https://tympanus.net/codrops/2024/10/30/interactive-3d-with-three-js-batchedmesh-and-webgpurenderer/)). Note that pmndrs postprocessing targets WebGLRenderer. If you move to WebGPURenderer, use three's own TSL postprocessing instead.
- **DOM interop (the decisive advantage):** drei `<Html>` (with `transform` and `occlude`), CSS3DRenderer, and R3F living in the same React tree as the DOM overlay. The dossier can be an ordinary server-rendered React component that reads the same zustand store as the 3D scene. Hidden button proxies for each pickable are plain DOM.
- **Next.js / Supabase:** R3F v9 is for React 19, so it fits Next 15/16. Supabase reads move to Server Components and pass props straight down. No bridge layer.
- **Iteration:** HMR in seconds, plus browser devtools, r3f-perf and leva.
- **Mobile:** small JS heap, no wasm memory cliff. Bruno's approach (lower presets on mobile, no DoF) carries over directly.

### Babylon.js
A full engine with an excellent inspector and native WebGPU. But it is heavier: about 800 KB to 1.9 MB for a basic tree-shaken scene, because it ships both WebGL and WebGPU shaders ([Babylon forum](https://forum.babylonjs.com/t/babylon-js-bundle-size/23477), [another](https://forum.babylonjs.com/t/what-are-good-tools-for-minimizing-bundle-size/56041)). React integration (react-babylonjs) is much less used than R3F. For this project it brings no feature you need over three.js.

### PlayCanvas
Lightweight runtime, tree-shakable ESM, glTF with Draco/meshopt, and a strong visual editor ([PlayCanvas engine](https://playcanvas.com/products/engine), [forum: meshopt](https://forum.playcanvas.com/t/tricks-to-decrease-morph-target-sizes/18628/9?u=chris)). Its value is the editor workflow. Its React story (`@playcanvas/react`) is young. It is a reasonable choice, but switching would cost you the R3F ecosystem (drei, camera-controls) for no clear gain.

### Threlte
The Svelte equivalent of R3F (Threlte 8 / Svelte 5, built-in Rapier) ([Threlte](https://cdn.jsdelivr.net/npm/@threlte/core@8.5.16/README.md)). It is good, but it means leaving Next/React, which the rest of the site (bookings, Supabase, Resend) is built on. Igloo shows Svelte + three.js can win awards, but the gain is not worth a rewrite.

### Needle Engine
A component and editor layer **on top of three.js**: author in Unity or Blender, export glTF. Modules such as physics wasm and postprocessing load on demand. Needle Cloud applies Draco/KTX2/progressive loading ([Needle: why](https://engine.needle.tools/docs/why), [export docs](https://engine.needle.tools/docs/export)). It is worth it only if you want to lay out the room in Unity or Blender instead of code. It has commercial licensing tiers. Your "objects as data in a typed scene file" plan already covers the same need.

---

## 4. Option B: custom C++ → wasm (raylib / sokol / bgfx / SDL3 + WebGL2 or WebGPU)

**Sizes.** These are the strongest point for this option.
- Your own slingshot game (SDL2 + WebGL2, `-O2`) is **810 KB wasm + 227 KB JS + 3.5 KB data** uncompressed (`portfolio/public/wasm/`). Brotli roughly halves that ([sola-raylib web notes](https://raw.githubusercontent.com/brettchalupa/sola-raylib/main/book/src/web.md)).
- Emscripten's own hello_webgl2 test is about 10 KB wasm / 6.6 KB gzip, so sokol-class apps can stay in the low hundreds of KB ([sokol-samples](https://github.com/dhilliard/sokol-samples)). raylib's Asyncify adds about 100 KB.
- A sokol or raylib renderer can match or beat three.js on download, but only by leaving out everything you would then have to write yourself.

**WebGPU from C++.** Emdawnwebgpu (Dawn's `webgpu.h` for Emscripten) is usable via `--use-port=emdawnwebgpu`. Core `webgpu.h` is stable, but `webgpu_cpp.h` and the Dawn-specific parts are explicitly not stable ([Dawn README](https://dawn.googlesource.com/dawn/+/HEAD/src/emdawnwebgpu/pkg/README.md)). You would also need a WebGL2 fallback path yourself. Figma had to build a shader-translation layer to support both ([Figma blog](https://www.figma.com/blog/figma-rendering-powered-by-webgpu/)).

**What you would have to build.** These all come free in three.js:
- **glTF:** raylib uses cgltf, which parses JSON and buffers but does **not** decode meshopt, Draco or KTX2/Basis. You would integrate the meshoptimizer decoder and the Basis Universal transcoder (another few hundred KB of wasm) yourself, and choose ASTC, ETC2 or BC per device.
- **PBR:** a full metal-rough shader with IBL (Poly Haven HDRIs), normal/ORM maps, shadows and tone mapping, written and debugged by you. raylib's PBR is an example, not an engine feature.
- **DoF**, camera fly-to with easing, inertial spin, raycast picking, on-demand rendering, resize/DPR handling, and context-loss recovery.
- **DOM sync:** every frame, export the dossier's model-view-projection from C++ to JS (`EM_JS` / embind) so a CSS-3D layer can follow it. Hidden accessible button proxies must be kept in sync with wasm state across the bridge.

**Threads.** You don't need them. If you did, SharedArrayBuffer needs COOP `same-origin` + COEP `require-corp`. Safari has supported those since 15.2 ([WebKit 15.2](https://webkit.org/blog/12140/new-webkit-features-in-safari-15-2/)), but cross-origin isolation breaks third-party embeds the site may use (Turnstile, Google Calendar booking, Supabase storage images without CORP) ([cross-origin isolation notes](https://wavelength.lightning.engineering/web/get-started/cross-origin-isolation/)).

**iOS memory.** WebKit bug 269777 (a duplicate of a "MegaBug" on wasm memory and Gigacage fragmentation) reports only about 300 MB reliably available to wasm after reloads on iOS, sometimes far less. Practical advice is to keep Safari wasm content under 300–500 MB and to set initial memory, not grow it ([WebKit 269777](https://bugs.webkit.org/show_bug.cgi?id=269777), [Unity discussions](https://discussions.unity.com/t/webgl-memory-increment-issue-and-crash-on-ios/894771)). With 150 props, decoded textures can blow through this if you hold image data in the wasm heap. JS/three.js uploads to the GPU and lets the browser manage memory.

**Iteration.** Each change means an emcc rebuild plus a reload, debugging through DWARF in Chrome DevTools, and no hot reload of scene state. That is fine for a game. It is slow for the many small design tweaks a portfolio's look needs.

**Next/Supabase.** Data has to be fetched in JS and marshalled into wasm (JSON string → C++ parser), or the wasm module calls fetch through Emscripten. It works, but it is another serialization boundary, and SSR can only ever render the DOM parts.

---

## 5. Option C: game engines with web export

| Engine | Web runtime size | Renderer on web | iOS Safari | Text/DOM/SEO | Fit |
|---|---|---|---|---|---|
| **Godot 4.x** | Empty project about 5 MB Brotli / about 9 MB gzip. Stripped custom template 2.7 MB (4.4) to 5.4 MB (4.5) with 3D disabled, so it's larger with 3D kept ([cinevva](https://app.cinevva.com/guides/godot-vs-unity-web-games), [popcar size guide](https://popcar.bearblog.dev/how-to-minify-godots-build-size/), (secondary)) | Compatibility renderer, WebGL2 only. Forward+ / Mobile are not available on web. 4.7 (June 2026) adds wasm64 but still no official WebGPU (secondary: [cinevva 4.7](https://app.cinevva.com/news/2026-06-19-godot-4-7-released)) | 4.3 single-threaded export fixed the long-standing macOS/iOS problems and needs no COOP/COEP ([Godot 4.3 web progress report](https://godotengine.org/article/progress-report-web-export-in-4-3/)) | Canvas text. AccessKit is experimental and unconfirmed on web | Poor: weaker PBR on WebGL2 Compatibility, multi-MB cold start, DOM bridge via JavaScriptBridge |
| **Unity 6 (Web)** | URP 3D template about 10.7 MB Brotli. Stripped "minimal" about 7 MB runtime, with the Unity-recommended target about 8 MB initial ([Unity web optimization](https://docs.unity3d.com/6000.1/Documentation/Manual/web-optimization.html), [cinevva](https://app.cinevva.com/guides/godot-vs-unity-web-games)) | WebGL2 default. WebGPU fully supported since 6.6 (Sept 2026), opt-in with fallback ([AlternativeTo](https://alternativeto.net/news/2026/9/unity-6-6-adds-webgpu-build-analysis-and-coreclr-prep/), (secondary)) | Officially iOS Safari 15+ ([Unity browser compatibility](https://docs.unity3d.com/Manual/webgl-browsercompatibility.html)). The iOS wasm memory ceiling is the classic Unity-on-iPhone crash | Canvas text. JS interop via .jslib | Poor: heaviest, slowest cold start, Unity editor licensing, separate build pipeline |
| **Unreal** | n/a | **No HTML5 target.** Removed in 4.24 and moved to a community extension. UE5 has no official HTML5. Epic points to Pixel Streaming ([UE forum](https://forums.unrealengine.com/t/html5-not-in-4-26/477510), [UE-HTML5 community fork](https://www.github.com/ufna/UE-HTML5), [The New Stack](https://thenewstack.io/a-new-tool-for-unreal-engine-developers-to-export-to-the-web/)) | Pixel Streaming needs a GPU server per visitor | n/a | Not viable |
| **Bevy (Rust)** | Varies widely: about 1–2 MB is possible with heavy opt. A 3D lighting example reported at 37 MB unoptimized ([Bevy discussion #2476](https://gh.nn.ci/bevyengine/bevy/discussions/2476), [r/bevy](https://redlib.hbubli.cc/r/bevy/comments/1ieacpi/bevy_large_binary_size/ma6f6qg/?context=3)) | wgpu: WebGPU or WebGL2 ([Bevy + WebGPU](https://bevy.org/news/bevy-webgpu/)) | Works. Same wasm memory caveats | Canvas. Interop via wasm-bindgen | Interesting tech, but a new language and ECS for no product gain |
| **Defold** | About 1.06–1.14 MB gzip empty ([Defold comparisons](https://app.cinevva.com/guides/phaser-vs-defold), (secondary)) | WebGL. Primarily 2D, 3D is basic | Good | Canvas | Wrong tool for photoreal 3D |

Cold start: game-engine wasm must download, compile and instantiate before the first frame. Even 5–10 MB Brotli is multiple seconds on mobile 4G before any asset loads. three.js can show the server-rendered DOM page (dossier and all) at once and stream the room in progressively.

---

## 6. Hybrids worth considering

1. **three.js/R3F rendering + DOM dossier + targeted wasm modules (recommended).** Wasm already shows up "for free": the Basis transcoder (KTX2Loader), the meshopt decoder, and the Draco decoder are all wasm. If you want real C++ in the product, write a focused module: an inertial spin/settle solver, a paper-sheet cloth or bend sim for flipping dossier pages, or a small physics nudge for props. Compile it with Emscripten (`-sMODULARIZE -sEXPORT_ES6`) and call it from R3F's `useFrame`. This mirrors Bruno Simon's three.js + Rapier wasm split.
2. **C++/wasm renderer core + DOM overlay (the Figma model).** This is technically sound and is how Figma works. But Figma has a team that built a renderer, a shader cross-compiler and a JS bridge. For a portfolio you would rebuild about 80% of three.js (glTF extensions, PBR+IBL, KTX2, DoF, picking, camera tweening) to get a slightly smaller download and the satisfaction of owning it.
3. **Keep the C++ showcase separate.** The slingshot game already shows C++→wasm skill. A desk prop (an arcade cabinet or Game Boy-like object) could launch the existing wasm game in a DOM overlay when picked up. It becomes a story beat in the room instead of a constraint on the whole site.

---

## 7. Recommendation

**Stay with three.js + React Three Fiber inside Next.js 16, as already planned. Make the dossier a server-rendered DOM layer. Use C++/wasm only for a self-contained module or for the embedded slingshot game.**

Reasons, roughly in order of weight:
1. **The text requirement forces a DOM layer anyway.** R3F is the only option where the 3D scene and the DOM overlay share one component tree, one state store and one SSR pass. Every other option adds a JS↔engine bridge just to keep a paper sheet's screen position in sync.
2. **Cold start and mobile.** About 150 KB gzip three.js plus a few hundred KB of R3F/drei is far below Godot's about 5 MB, Unity's about 7–11 MB, or a hand-written C++ engine with the Basis/meshopt decoders included. It also avoids the iOS wasm-heap ceiling (about 300 MB reliable).
3. **Poly Haven pipeline parity.** KTX2/Basis, meshopt, KHR material extensions, HDRI IBL and DoF all work out of the box. This is the exact pipeline Bruno Simon's 2025 folio documents.
4. **Industry evidence.** Bruno Simon 2025, Igloo Inc and Lusion all run on three.js. I found no notable portfolio website on a custom C++/wasm renderer. Godot and Unity "portfolios" live on itch.io as games.
5. **Iteration speed** with HMR and devtools, for a project that is mostly art direction.
6. **WebGPU is now universal** (Safari 26), and three.js WebGPURenderer + TSL gets you there with WebGL2 fallback. A C++ engine would have to maintain both backends itself.

Engine-level notes for the plan:
- Start on WebGLRenderer + `@react-three/postprocessing` DoF (most mature, works with drei). Consider WebGPURenderer + TSL DoF later if you need it. Don't mix pmndrs postprocessing with WebGPURenderer.
- Render on demand (`frameloop="demand"`), which suits a bounded room. Bake lighting (Stage 5) so mobile can drop DoF for the blurred scrim, as the plan already says.
- Dossier: SSR the sheets as semantic HTML (`<article>`, headings) from Supabase in a Server Component. When the folder opens, show them as an overlay or as `<Html transform>` aligned to the paper mesh. A canvas texture of the same text can serve as the "closed folder" look. Watch HTML-in-Canvas as a future enhancement for Chrome only.

### What the C++ route would gain and lose

**Gains:** full control of the frame loop and memory. A possibly smaller core binary (sokol-class). A strong "I wrote my own engine" story. Deterministic performance, no GC pauses. Skills that transfer to graphics and engine roles.

**Losses:**
- You would build glTF extension decoding (meshopt, KTX2/Basis), PBR+IBL, shadows, DoF, picking, camera tweening, resize/DPR and context-loss handling yourself.
- Two rendering backends (WebGL2 + WebGPU via the unstable emdawnwebgpu C++ API), or WebGL2 only.
- A JS↔wasm bridge for the DOM dossier, accessibility proxies, and Supabase data.
- Slower iteration (rebuild + reload).
- iOS wasm memory risk with many textures.
- No SSR of anything 3D.
- Most of the effort goes into engine plumbing visitors never see, not into the room's look and content, which is what the portfolio is judged on.

The middle path gets most of the "C++" credit for very little risk: a C++/wasm simulation module plus the existing slingshot game embedded as a playable prop.
