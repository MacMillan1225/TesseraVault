Tessera.define("index", function (require, module, exports) {
  const progress = require("components/progress");
  const card = require("components/card");
  const heatmap = require("components/heatmap");

  module.exports = {
    progress: progress.progress || progress,
    card: card.card || card,
    heatmap: heatmap.heatmap || heatmap,
  };
});
