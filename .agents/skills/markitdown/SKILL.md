---
name: markitdown
description: Convert any file (screenshots, logs, PDFs, HTML, Office docs) to Markdown for LLM analysis using Microsoft MarkItDown. Use when analyzing screenshots, parsing logs, extracting content from files, or preparing data for LLM context.
version: 1.0.0
license: MIT
---

# MarkItDown — File-to-Markdown Converter

**Use this skill when you need to convert files (screenshots, logs, HTML, PDFs, Office documents) to Markdown for analysis.**

## Prerequisites

- Python 3.10+ (3.14.0 available)
- `markitdown` pip package installed (`pip install markitdown`)
- Node.js wrapper at `scripts/markitdown.mjs`

## Usage

```bash
node scripts/markitdown.mjs <file-path> [options]
```

### Options

| Option | Description |
|--------|-------------|
| `--stdout` | Output markdown to stdout (default) |
| `--out <path>` | Save markdown to a file |
| `--json` | Output JSON with `{title, text}` metadata |
| `-h, --help` | Show help |

### Examples

**Convert an HTML page:**
```bash
node scripts/markitdown.mjs e2e/workflows-data/index.html
```

**Convert a screenshot to a markdown analysis file:**
```bash
node scripts/markitdown.mjs e2e/screenshots/gamification/02-gamification-overview.png --out analysis/gamification-page.md
```

**Get JSON metadata from a log file:**
```bash
node scripts/markitdown.mjs backend.log --json
```

## Supported File Types

- **Images** — PNG, JPG, JPEG, GIF, BMP, SVG, WebP, TIFF
- **Documents** — PDF, DOCX, PPTX, XLSX
- **Web** — HTML, Markdown
- **Code** — Plain text, JSON, XML, YAML, CSV
- **Other** — ZIP archives (extracts contents)

## Use Cases in GardenVerse

1. **E2E Screenshot Analysis** — Convert screenshots from `e2e/screenshots/` to Markdown for LLM-driven UI review
2. **Log Analysis** — Convert backend/app logs to structured Markdown for debugging
3. **Workflow Data Review** — Convert HTML workflow pages to Markdown for quick inspection
4. **Documentation Extraction** — Convert PDF/Office docs to Markdown for inclusion in context

## Notes

- Image OCR capability depends on the underlying OS/machine setup (may return empty text on screenshots without embedded text)
- HTML/Office doc conversion is high quality and preserves structure
- Maximum output buffer: 50MB
