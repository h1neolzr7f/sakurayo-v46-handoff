(function () {
  "use strict";
  var manifest = [
    { "path": "content/packs/official-example/pack.js" },
    { "path": "content/packs/official-exploration/pack.js" },
    { "path": "content/packs/official-feedback/pack.js" },
    { "path": "content/packs/official-modkit-addon/pack.js" },
    { "path": "content/packs/broken-fixture/pack.js", "when": { "queryParam": "brokenExtension", "equals": "1" } }
  ];
  window.SAKURAYO_EXTENSION_MANIFEST = Object.freeze(manifest.map(function (entry) { return Object.freeze(Object.assign({}, entry)); }));
  window.SakurayoContent.loadManifest(manifest);
})();
