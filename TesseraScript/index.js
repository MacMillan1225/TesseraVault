Tessera.define("index", function (require, module, exports) {
  const progressbar = require("components/progressbar");
  const card = require("components/card");
  const heatmap = require("components/heatmap");
  const example = require("components/example");

  module.exports = {
    progressbar: progressbar.progressbar || progressbar,
    card: card.card || card,
    heatmap: heatmap.heatmap || heatmap,
    example: example.example || example,
  };
});
