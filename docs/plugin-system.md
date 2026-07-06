# Plugin System

LineSolv supports extending the calculator with custom units, functions, and variables through JavaScript plugins.

## Runtime

Plugins run in a [Goja](https://github.com/dop251/goja) JavaScript VM — a pure-Go implementation of ECMAScript 5.1+. Each plugin script is wrapped in an IIFE to prevent variable redeclaration conflicts between plugins:

```js
(function() {
  // plugin source here
})()
```

## Plugin Location

Plugins are loaded from two directories at startup:
- `plugins/` — single-file plugins
- `plugins/CommunityExtensions/` — community extensions (subdirectories with `.js` files)

The loader recurses into subdirectories automatically.

## Plugin API

Plugins interact with the engine through the global `numi` object.

### `numi.addUnit(options)`

Register a new unit for conversion.

| Option | Type | Description |
|---|---|---|
| `id` | string | Canonical unit name (used in output) |
| `phrases` | string | Comma-separated aliases for this unit |
| `format` | string | Display format string (currently informational) |
| `ratio` | number | Conversion factor to SI (or base) unit |

```js
numi.addUnit({
  id: 'fl_oz',
  phrases: 'fl oz,fl_oz,fluid ounce,fluid ounces,fluid_ounce',
  format: 'fl oz',
  ratio: 0.0295735
});
```

After registration: `10 fl oz in ml` → `295.735 ml`

### `numi.addFunction(options, callback)`

Register a custom function callable in expressions.

| Option | Type | Description |
|---|---|---|
| `id` | string | Function name (lowercase, used in expressions) |
| `description` | string | Human-readable description |

The callback receives an array of argument objects with `{double: value}` shape and must return a number or `{double: value}`.

```js
numi.addFunction({
  id: 'choose',
  description: 'Combinations: n choose k'
}, function(args) {
  var n = args[0].double;
  var k = args[1].double;
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  k = Math.min(k, n - k);
  var result = 1;
  for (var i = 1; i <= k; i++) {
    result = result * (n - k + i) / i;
  }
  return {double: result};
});
```

After registration: `choose(5, 3)` → `10`

### `numi.setVariable(name, value)`

Set a variable in the calculator engine.

```js
numi.setVariable('pi', 3.141592653589793);
```

## Included Plugins

LineSolv ships with 16 community extension plugins covering:

| Plugin | Description |
|---|---|
| BasicCombinatorics | `choose`, `permute`, `fact` functions |
| BitcoinSatoshis | Bitcoin/satoshi unit conversion |
| ChangeMoneyCAD | Canadian currency breakdown |
| CryptoChanger | Cryptocurrency units |
| Currency | Extended currency conversions |
| DateAndTime | Date/time arithmetic |
| EmissionsCalculator | Carbon emissions conversions |
| Energy | Energy unit conversion |
| Euros | Euro currency formatting |
| GeneralConverter | Miscellaneous unit conversions |
| Gematria | Hebrew gematria calculator |
| GradeCalculator | Academic grade calculations |
| HomeBrewing | Home brewing measurements |
| IntrinsicStock | Stock valuation formulas |
| RealEstate | Real estate calculations |
| TimeCalculator | Time duration math |

## Adding a Plugin

1. Create a `.js` file in `plugins/` (or a subdirectory)
2. Use `numi.addUnit()`, `numi.addFunction()`, or `numi.setVariable()` as needed
3. Rebuild: `wails build -tags "webkit2_41"`

## Limitations

- Goja is ES5.1 — no `let`/`const` outside IIFE (wrapped automatically)
- No `require()` or `import` — each plugin is self-contained
- No DOM access or network I/O
