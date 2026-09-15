// Test-only subprocess preload: it models the supported runtime without adding
// an application option, environment bypass, or shipped runtime behavior.
Object.defineProperty(process.versions,'node',{value:'24.0.0',configurable:true});
