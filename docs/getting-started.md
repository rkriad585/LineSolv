# Getting Started

## What is LineSolv?

LineSolv is a cross-platform desktop natural-language calculator that understands plain English alongside standard math notation. Type something like `$20 in euro - 5% discount` or `what is twenty five plus three` and get an instant result — no equals button, no learning curve. It combines a powerful Go-based arithmetic engine with a clean, distraction-free notepad interface, supporting unit conversion, currency exchange, variables, function graphing, and a plugin system for extensibility.

## Installation

Download the latest release for your platform from the [releases page](https://github.com/rkriad585/LineSolv/releases).

### Linux

**Debian / Ubuntu (.deb)**

```bash
sudo dpkg -i linesolv-*.deb
linesolv
```

**Standalone binary**

```bash
chmod +x LineSolv
./LineSolv
```

Requirements: WebKit2GTK 4.1+ and GTK3 (`libwebkit2gtk-4.1-dev libgtk-3-dev` on Debian/Ubuntu).

### macOS

Mount the `.dmg` and drag LineSolv into Applications. You may need to right-click -> Open to bypass Gatekeeper on first launch.

### Windows

Run the NSIS installer (`.exe`). LineSolv will be available from the Start menu after installation.

## First Launch

When you open LineSolv for the first time you'll see a splash screen with the LineSolv logo and a loading progress bar. Once initialization completes, a blank notepad appears — a clean, dark-themed notepad with a blinking cursor. The right side shows a results column. There are no toolbars, menus, or buttons cluttering the workspace. Everything is keyboard-driven.

The title bar is draggable (double-click to maximize). Panels and settings are accessible via keyboard shortcuts — press `?` to see them all. Documentation and Settings can also be reached from the `...` dropdown menu in the title bar (`Ctrl/Cmd + J` for Docs, `` Ctrl/Cmd + ` `` for Settings).

## Your First Calculation

Type any math expression and the result appears instantly in the results column to the right.

Try:

```
2 + 2
```

You should see `4` appear next to the line. No equals button needed.

A few more:

```
2 ^ 10
(3 + 7) * 2
5!
```

## Natural Language

LineSolv understands plain English. Instead of symbols, just type words:

```
twenty five plus three
```

Result: `28`

You can also use conversational prefixes:

```
what is the square root of 144
calculate 15% of 200
hey there what is 6 times 7
```

## Unit Conversion

Convert between units with `in`, `to`, or `from`:

```
10 inches in cm
1 kg in lb
100 c to f
2h30m in minutes
```

Currency is supported too — rates are fetched live and cached:

```
$100 + €20
$20 in euro - 5% discount
```

## Variables

Assign variables and reference them later:

```
x = 42
x * 2
```

Result: `84`

You can chain them:

```
y = x + 8
y / 2
```

Use context references to build on the previous result:

```
42
of that * 2
then + 10
```

## Percentages

LineSolv has first-class percentage support:

```
10% of 200
```

Result: `20`

More examples:

```
100 + 15%
200 after 10% discount
10 is what percent of 50
```

Purchase math with tax and discounts:

```
5 items at $20 each with a 15% discount and 8% sales tax
```

## What's Next?

- [User Guide](user-guide.md) — Full reference for all input patterns, functions, and features
- [Plugins](plugins.md) — Browse, install, and create plugins
- [FAQ](faq.md) — Troubleshooting and frequently asked questions
- [Configuration](configuration.md) — Customize themes, fonts, shortcuts, and data storage
- [Themes](themes.md) — Change or create color themes
