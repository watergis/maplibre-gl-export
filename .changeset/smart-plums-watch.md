---
"@watergis/mapbox-gl-export": patch
---

fix: move `mapbox-gl` from `dependencies` to `peerDependencies` (`^3.0.0`).

The map used for exporting has to be created with the same `mapbox-gl` as the application. As a regular dependency, a second copy of `mapbox-gl` could be installed when the version of the application did not satisfy the range of the plugin, which made exporting fail with errors such as `Unknown expression "pitch"` (#250) and left `mapboxgl.accessToken` unset for the exported map.
