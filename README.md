# 潮境 · Marine Showcase

Polish™ 互動船艇與海面展示。

網站入口：`index.html`。透過 GitHub Pages 從 `main` 分支根目錄發布。

船模以 gzip 分段檔案提供，瀏覽器合併後解壓；預設帆船載入完成後，在背景準備第二艘遊艇。請保留所有 `.part-01`、`.part-02` 檔案。

## 操作

- 拖曳旋轉，Shift＋拖曳平移，滾輪或雙指縮放。
- 羅盤調整航向；左右拉桿調整迎面浪與吃水。
- 右上角切換帆船與豪華遊艇。
- 遊艇甲板俯視模式自動展開伸縮弦梯，離開該視角自動收起。
- 支援白天、夕陽、夜間、水下視角、航行控制與飛鳥。

## 原始碼與素材

`index.html` 包含介面、Three.js 場景與著色器，可直接編輯；Three.js 授權見 `LICENSE-three.txt`。
船模與品牌素材由專案擁有人提供，各自保有原授權。

本專案為互動概念展示，非工程或航海模擬器。


## Boat URLs

- `sail/`: open the sailboat directly.
- `yacht/`: open the luxury yacht directly.

The boat switch updates the address to the selected boat. Both routes have static entry pages so they work on static hosting and on reload. Assets are shared from the application folder. After editing `index.html`, run `python3 sync_routes.py` to refresh both entry pages before publishing.


## Hull-driven foam

Foam uses the same sampled hull volume as the dry-cabin mask. Each load rebuilds the waterline endpoints, stern width and length-based effect scale. The bow/side band uses distance to sampled contour segments; the stern plume shares its bubble grain and progressively loses density downstream. Unrecognized GLBs fall back to opaque geometry for hull section extraction. Models still need the existing upright orientation and normalization expected by the GLB loader.

Run `node tests/hull-flow.mjs` to check unnamed hull extraction, pointed bows and fourfold scale invariance.

Inactive boats are prepared off scene: geometry/materials, texture upload, hull sections and sailboat deck openings are cached. No inactive boat is attached to the display scene or wake uniforms. Cache preparation restores world matrices before reuse. Boat-switch flights retain the source distance limits until arrival and allocate distinct berths, including a yacht-first startup.


## Multi-boat lazy preparation

`boatCatalog` is the registration point for every vessel. `registerBoat` accepts an id, label, GLB source and optional preparation callback/kind. Once the first vessel is fully warmed, one idle-time queue prepares the remaining registered vessels sequentially. Each entry stores a shared preparation promise, cached materials/textures, hull and deck water data, a fixed berth, and an invisible root in an isolated staging scene. Inactive roots never publish cabin masks or wake fields into the visible ocean. Repeated selection reuses cached data and berth coordinates. Imported GLBs are registered automatically and are included in boat cycling.

`node tests/boat-berths.mjs` checks both startup choices and stable, separated positions for 32 registrations.
