await dv.view("TesseraScript/tessera.bootstrap");
await dv.view("TesseraScript/core/dom");
await dv.view("TesseraScript/core/file");
await dv.view("TesseraScript/core/css");
await dv.view("TesseraScript/components/card/index");
await dv.view("TesseraScript/components/progress/index");
await dv.view("TesseraScript/components/heatmap/index");
await dv.view("TesseraScript/components/heatmap-v2/index");

card = Tessera.require("components/card");
progress = Tessera.require("components/progress");
heatmap = Tessera.require("components/heatmap");
heatmapV2 = Tessera.require("components/heatmap-v2");