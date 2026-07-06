# Numi — Overview & Technology Stack

## Project Overview

Numi is a natural-language calculator app for macOS, Windows, and Linux, created by **Dmitry Nikolaev**. Rather than requiring rigid formula syntax, it lets users describe calculations conversationally, e.g. `$20 in euro - 5% discount` or `today + 2 weeks`.

This repository (`neostore/numi`) contains the **community plugin collection** and **Alfred workflow integration** for Numi. The actual Numi application binaries live in their own repositories and distribution channels.

**Context within neostore:** This is one of four projects under the `neostore/` umbrella:

| Subproject | Description |
|---|---|
| `neocode/` | Node.js/TypeScript project (likely e-commerce backend) |
| `neoite/` | Python-based Wi-Fi auditing toolkit |
| `numi/` | Numi community plugins & Alfred integration |
| `pce/` | MicroPython/CLI project |

---

## Technology Stack

### 1. Numi Desktop (macOS)

| Aspect | Details |
|---|---|
| **Language** | Swift (primary), Objective-C (legacy) |
| **UI Framework** | AppKit (native macOS) |
| **Packaging** | `.dmg` via `node-appdmg` |
| **Architecture** | Universal binary (Apple Silicon + Intel) |
| **Size** | ~45 MB |
| **SDK** | macOS native SDK |
| **Signing** | Code-signed for macOS Gatekeeper |
| **Distribution** | Direct download from numi.app, SetApp, Mac App Store |
| **Latest Release** | Numi 3.32 for macOS (April 2023) |

The macOS app embeds a **JavaScriptCore (JSC)** runtime to evaluate plugin scripts. This is the same engine that powers Safari's JavaScript execution.

### 2. Numi Desktop (Windows)

| Aspect | Details |
|---|---|
| **Framework** | Electron (Chromium + Node.js) |
| **Language** | JavaScript/TypeScript + Electron API |
| **Packaging** | `.exe` installer via `electron-builder` |
| **Distribution** | Direct download from numi.app |
| **Latest Release** | Numi v0.1.15 for Windows |

### 3. numi-cli (Terminal / CLI)

| Aspect | Details |
|---|---|
| **Language** | **Go** (Golang) |
| **Cross-platform** | macOS, Linux, Windows |
| **Installation** | Shell script (`curl -sSL https://s.numi.app/cli \| sh`), Homebrew (`brew install nikolaeu/numi/numi-cli`) |
| **Latest Release** | numi-cli v0.18.0 (February 2026) |
| **Features** | Unit conversion, arithmetic, variables, timezones, localization |
| **Not Yet Implemented** | Plugins/extension support (desktop only), CSS conversion |

The CLI shares the same **parsing and calculation engine** as the desktop version but is a standalone Go binary.

### 4. Plugin System (This Repository)

| Aspect | Details |
|---|---|
| **Runtime** | Apple JavaScriptCore (JSContext) |
| **Language** | JavaScript (ES5/ES6) |
| **Module System** | None — flat global scope via `numi` object |
| **API Surface** | `numi.addUnit()`, `numi.addFunction()`, `numi.setVariable()`, `log()` |
| **Package Manager** | None — manual file copy to extension folder |
| **Extension Path** | `~/Library/Application Support/com.dmitrynikolaev.numi/extensions/` |

#### Plugin API Reference

**`numi.addUnit(config)`**
```javascript
numi.addUnit({
    "id": "unitId",     // unique internal identifier
    "phrases": "alias1, alias2, alias3",  // comma-separated natural language triggers
    "baseUnitId": "m",  // reference to an existing base unit (optional for base units)
    "format": "Display", // display string for results
    "ratio": 0.0000295735, // conversion factor to the base unit
});
```

**`numi.addFunction(config, callback)`**
```javascript
numi.addFunction({
    "id": "funcId",     // unique internal identifier
    "phrases": "alias1, alias2"  // comma-separated natural language triggers
}, function(values) {
    // values is an array of { double: number, unitId?: string }
    return { "double": result, "unitId": "optionalUnit" };
});
```

**`numi.setVariable(name, value)`**
```javascript
numi.setVariable("xxx", { "double": 5, "unitId": "USD" });
numi.setVariable("yyy", 122);  // plain number also accepted
```

#### Available Base Units

| Unit | ID |
|---|---|
| Meter | `m` |
| Second | `second` |
| Percentage | `percent` |
| Square Meter | `m2` |
| Cubic Meter | `m3` |
| Bit | `bit` |
| Byte | `byte` |
| Radian | `radian` |
| Gram | `gram` |
| US Dollars | `USD` |

#### Current Plugins (16 Community Extensions)

| Plugin | Type | What It Adds |
|---|---|---|
| BasicCombinatorics | Function | `choose(n;r)`, `permute(n;r)` — nCr and nPr |
| BitcoinSatoshis | Unit | `sats` = 0.00000001 BTC |
| ChangeMoneyCAD | Unit | Canadian coin units (Nickel, Dime, Quarter, Loonie, Toonie) |
| clamp | Function | `clamp(value;min;max)` |
| DataRates | Unit | Data rate units (bps, Bps, kbps, Mbps, Gbps, Tbps, kibps, etc.) |
| Electrical-conversion | Unit | Power units (mW, W, kW, MW, GW) |
| EnginePower | Unit | Horsepower (hp) ↔ kilowatt (kw) |
| LogarithmTotalCalculator | Function | `log(base;value)` — arbitrary-base logarithm |
| MinMax | Function | `nmin(...)`, `nmax(...)` |
| NettTotalCalculator | Function | `nett(gross;vatRate)` — net from gross |
| PercentChange | Function | `pc(initial;final)` — percentage change |
| Pressure | Unit | Bar, Pa, kPa, MPa, atm, mmHg, psi, etc. |
| ScreenUnits | Unit + Function | `px`, `rem`, `toRem(pixels;base)` |
| Speed | Unit | km/h, mph, m/s, ft/s, knots |
| StandardDeviation | Function | `stddev(...)` / `sd(...)` |
| VectorCalculator | Function | `vec(x;y;z)`, `dot(u;v)`, `angle(u;v)` |

### 5. Alfred Workflow Integration

| Aspect | Details |
|---|---|
| **Language** | JXA (JavaScript for Automation) |
| **Dependencies** | None — uses macOS built-in `curl` |
| **Protocol** | HTTP to `localhost:15055` |
| **Trigger** | Keyword `n`, hotkey `=`, external trigger `numi` |
| **Compatibility** | Alfred 3 & 4 |
| **Bundle ID** | `com.nikolaeu.numi` |
| **Version** | 1.1.0 |

The Alfred workflow acts as a bridge: it sends the user's query to the running Numi app (or `numi-cli`) via a local HTTP endpoint and formats the JSON response as Alfred items.

### 6. Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    neostore/numi (this repo)                 │
│                                                             │
│  ┌───────────────────────┐   ┌───────────────────────────┐  │
│  │   plugins/            │   │   alfred/                  │  │
│  │   ├── sample.js       │   │   ├── index.js (JXA)       │  │
│  │   └── CommunityExt/   │   │   ├── info.plist           │  │
│  │       └── 16 plugins  │   │   └── packal/              │  │
│  └───────────────────────┘   └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Numi Application Runtime                    │
│                                                             │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ macOS    │  │ Windows      │  │ CLI (Go)             │  │
│  │ (Swift)  │  │ (Electron)   │  │                      │  │
│  │ JSCore   │  │ JS Engine    │  │ Shared Calc Engine   │  │
│  └──────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## Repository Structure

```
numi/
├── .gitignore                    # Excludes .DS_Store and .alfredworkflow
├── Readme.md                     # Project overview & installation
├── changelog.md                  # Version history (3.18 → 3.32)
├── license.txt                   # MIT License (2018, Dmitry Nikolaev)
├── alfred/                       # Alfred workflow integration
│   ├── index.js                  # JXA bridge script
│   ├── info.plist                # Alfred workflow definition
│   └── packal/                   # Packal packaging metadata
│       ├── com.nikolaeu.numi.pub # RSA public key
│       └── package.xml           # Packal manifest
└── plugins/                      # Community extension plugins
    ├── sample.js                 # Reference plugin (fluid ounce)
    └── CommunityExtensions/      # 16 community-submitted plugins
        ├── BasicCombinatorics/
        ├── BitcoinSatoshis/      # (file, not directory — outlier)
        ├── ChangeMoneyCAD/
        ├── DataRates/
        ├── Electrical-conversion/
        ├── EnginePower/
        ├── LogarithmTotalCalculator/
        ├── MinMax/
        ├── NettTotalCalculator/
        ├── PercentChange/
        ├── Pressure/
        ├── ScreenUnits/
        ├── Speed/
        ├── StandardDeviation/
        ├── VectorCalculator/
        └── clamp/
```

---

## Development & Build System

This repository has **zero dependencies, no build tools, no package manager, and no test framework**. All JavaScript files are plain ES5/ES6 that run as-is in the Numi JavaScriptCore runtime.

---

## Key Observations

1. **Multi-platform, multi-language**: The Numi ecosystem spans Swift (macOS desktop), Electron/JS (Windows desktop), Go (CLI), and plain JavaScript (plugins).
2. **Plugin model is intentionally constrained**: Only `addUnit`, `addFunction`, and `setVariable` are exposed. The wiki notes that more API surface is planned.
3. **No type safety**: Plugins use plain JavaScript without TypeScript, linting, or type checking.
4. **CLI is ahead of plugins**: The Go CLI (v0.18.0, 2026) has evolved significantly, while the macOS desktop app (3.32, 2023) has stalled. Plugin support is still not available in the CLI.
5. **Semicolons as argument separators**: Numi's function syntax uses `;` (not `,`) — e.g., `clamp(15;3;7)`.
6. **Minor bug**: `Pressure.js` registers `megapascal` twice with identical config.
7. **MIT Licensed**: All code is freely reusable.

---

## References

- [Numi Official Site](https://numi.app)
- [GitHub: nikolaeu/numi](https://github.com/nikolaeu/numi) — 6.5k stars, 251 forks, MIT license
- [Numi Wiki — Plugins](https://github.com/nikolaeu/numi/wiki/Plugins)
- [Numi for Windows (Electron)](https://cdn.numi.app/electron/latest/numi-setup.exe)
- [numi-cli releases](https://github.com/nikolaeu/numi/releases) (Go binary)
