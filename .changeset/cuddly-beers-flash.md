---
"@watergis/maplibre-gl-export": minor
"@watergis/mapbox-gl-export": minor
---

feat: add attribution to the bottom-right of an exported image. `attributionStyle` property is added into options. The default attribution style is 

```js
{
  attributionStyle: {
    textSize: 16,
    textHaloColor: '#FFFFFF',
    textHaloWidth: 0.8,
    textColor: '#000000',
    fallbackTextFont: ['Open Sans Regular']
  }
}
```

This plugin will try to get attribution from HTMLElement by class name of 'maplibregl-ctrl-attrib-inner' or 'mapboxgl-ctrl-attrib-inner' first. If elements are not available, it will try to make attribution text from 'attribution' property of map style source. 

If `glyphs` property is not set to map style, attribution will not be added since the plugin will add attribution as a symbol layer of maplibre/mapbox. 

In terms of text-font, the plugin will use the same font of the first layer which has text-font property in its layer style. If a text-font is not available from style object, fallbackTextFont will be used instead.
