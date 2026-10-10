local package alterations

node_modules\rbxts-transformer-flamework\out\transformer.js
```.filter(typescript_1.default.isDiagnosticWithLocation)```

to
```.filter(function (diag) { return diag.file !== undefined && diag.start !== undefined; })```