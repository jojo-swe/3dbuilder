# HDR environment maps

Served as static files by Vite so the 3D preview's lighting works offline and doesn't depend on a CDN at runtime.

| File | Used by | Source | License |
|------|---------|--------|---------|
| `potsdamer_platz_1k.hdr` | `<Environment>` in `src/ui/viewport/Viewport3D.tsx` (the look of drei's `preset="city"`) | [pmndrs/drei-assets @ 456060a](https://github.com/pmndrs/drei-assets/blob/456060a26bbeb8fdf79326f224b6d99b8bcce736/hdri/potsdamer_platz_1k.hdr), the same commit drei 10.x fetches the `city` preset from. Originally from [Poly Haven](https://polyhaven.com/a/potsdamer_platz) (formerly HDRI Haven). | CC0 (all Poly Haven assets) |

SHA-256 of `potsdamer_platz_1k.hdr`: `7afe4c2f9700ee78c7477c53fa355463d7dda1fdede401432d6b5f9ff0a95696`
