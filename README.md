# POLISH™ MARINA

Polish™ 互動船艇與海面展示。

網站入口：`index.html`。透過 GitHub Pages 從 `main` 分支根目錄發布。

船模以 gzip 分段檔案提供，瀏覽器合併後解壓；第一艘船載入完成後，會在背景準備其餘船型。請保留所有 `.part-01`、`.part-02` 檔案。

## 操作

- 拖曳旋轉，Shift＋拖曳平移，滾輪或雙指縮放。
- 羅盤調整航向；左右拉桿調整迎面浪與吃水。
- 工具列船型圖示可選擇帆船、豪華遊艇與 XO 270FC。
- 遊艇甲板俯視模式自動展開伸縮弦梯，離開該視角自動收起。
- 支援白天、夕陽、夜間、水下視角、航行控制與飛鳥。

## 原始碼與素材

`index.html` 包含介面、Three.js 場景與著色器，可直接編輯；Three.js 授權見 `LICENSE-three.txt`。
船模與品牌素材由專案擁有人提供，各自保有原授權。

本專案為互動概念展示，非工程或航海模擬器。


## Boat URLs

- `sail/`: open the sailboat directly.
- `yacht/`: open the luxury yacht directly.
- `xo270/`: open XO 270FC directly.

The boat switch updates the address to the selected boat. All three routes have static entry pages so they work on static hosting and on reload. Assets are shared from the application folder. After editing `index.html`, run `python3 sync_routes.py` to refresh all entry pages before publishing.


## Hull-driven foam

Foam uses the same sampled hull volume as the dry-cabin mask. Each load rebuilds the waterline endpoints, stern width and length-based effect scale. The bow/side band uses distance to sampled contour segments; the stern plume shares its bubble grain and progressively loses density downstream. Unrecognized GLBs fall back to opaque geometry for hull section extraction. Models still need the existing upright orientation and normalization expected by the GLB loader.

Run `node tests/hull-flow.mjs` to check unnamed hull extraction, pointed bows and fourfold scale invariance.

Inactive boats are prepared off scene: geometry/materials, texture upload, hull sections and sailboat deck openings are cached. No inactive boat is attached to the display scene or wake uniforms. Cache preparation restores world matrices before reuse. Boat-switch flights retain the source distance limits until arrival and allocate distinct berths, including a yacht-first startup.


## Multi-boat lazy preparation

`boatCatalog` is the registration point for every vessel. `registerBoat` accepts an id, label, GLB source and optional preparation callback/kind. Once the first vessel is fully warmed, one idle-time queue prepares the remaining registered vessels sequentially. Each entry stores a shared preparation promise, cached materials/textures, hull and deck water data, a fixed berth, and an invisible root in an isolated staging scene. Inactive roots never publish cabin masks or wake fields into the visible ocean. Repeated selection reuses cached data and berth coordinates. Imported GLBs are registered automatically and are included in the vessel catalog.

`node tests/boat-berths.mjs` checks both startup choices and stable, separated positions for 32 registrations.

## Current presentation

All three boats use the shared vessel selector, background loading, hull-shaped wake and heading camera. Dragging the compass temporarily frames the whole horizontal bearing dial in parallel projection; release restores the original perspective. The vessel stays at its original draft. After a heading change while cruising, wake history clears, pauses for one second and grows downstream over five seconds.

Default wave levels: sail 50, YATCH 66, XO 270FC 80. XO 270FC uses a twofold model scale and -0.22 default trim. Fonts and model assets are served locally.


Adaptive quality (2026-11-18): HD unlocks when the active boat is ready, without waiting for background boats or underwater preparation. Camera/heading movement switches immediately to LD and restores HD on the next stationary frame (including wheel motion and inertial damping, measured per frame without a timer); manual LD persists. Water fades into HD over 200ms with stable reflection/refraction target sizes. A 90-frame HD window, after 1.2s warm-up, falls back to LD if its 80th-percentile frame interval exceeds 42ms; users can explicitly retry HD. Both modes preserve boat resolution (up to DPR 1.5 desktop / 1.75 mobile, with a 2.4M pixel ceiling). LD renders only the ocean into a half-size target capped at 0.35M pixels, then applies a Gaussian filter without blurring boats. LD retains a 30 FPS ceiling and skips above-water scene reflection/refraction passes. HD retains detailed water and physical boat materials. Underwater effects prepare during quiet time; the underwater button displays 載入中 until ready. Matching water captures are reused within a frame to avoid duplicate work from physical-glass transmission rendering. Background hull/profile calculations share synchronous and scheduled generators so output geometry stays identical.

Performance evidence and limitations: `performance-findings-20261118.md`. The Lighthouse reports and diagnostic HTML/profiles are local investigation artifacts, not app release assets.


Model delivery/precomputation (2026-11-18): `asset-loader.mjs`, generated `asset-manifest.mjs`, and `asset-host.json` provide verified persistent model caching, commit-pinned optional jsDelivr routing, cold-CDN origin hedging and origin fallback. Built-in vessels consume versioned precomputed water sidecars with runtime calculation fallback. Models and materials are unchanged. See `CLOUD-ASSETS.md` for configuration, build/verification and release files.
