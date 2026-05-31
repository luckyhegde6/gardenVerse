#!/usr/bin/env node
import { spawnSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const args = process.argv.slice(2);
const help = args.includes('--help') || args.includes('-h');

if (help || args.length === 0) {
  console.log(`
Usage: node scripts/markitdown.mjs <file-path> [options]

Convert any file to Markdown using Microsoft MarkItDown (Python).

Options:
  --stdout       Output markdown to stdout (default)
  --out <path>   Save markdown to a file
  --json         Output JSON with metadata
  -h, --help     Show this help

Examples:
  node scripts/markitdown.mjs screenshot.png
  node scripts/markitdown.mjs logfile.txt --out analysis.md
  node scripts/markitdown.mjs image.jpg --json
`);
  process.exit(0);
}

const filePath = resolve(args[0]);
const outIndex = args.indexOf('--out');
const outputPath = outIndex !== -1 ? resolve(args[outIndex + 1]) : null;
const asJson = args.includes('--json');

if (!existsSync(filePath)) {
  console.error(`Error: file not found: ${filePath}`);
  process.exit(1);
}

const pythonScript = `
import sys, json
from markitdown import MarkItDown
try:
    md = MarkItDown()
    result = md.convert(r"""${filePath.replace(/\\/g, '\\\\')}""")
    sys.stdout.reconfigure(encoding='utf-8')
    data = {'title': result.title or '', 'text': result.text_content}
    print(json.dumps(data, ensure_ascii=False))
except Exception as e:
    print(json.dumps({'error': str(e)}, ensure_ascii=False))
    sys.exit(1)
`;

const proc = spawnSync('python', ['-c', pythonScript], {
  encoding: 'utf-8',
  maxBuffer: 50 * 1024 * 1024,
});

if (proc.error) {
  console.error(`Error spawning python: ${proc.error.message}`);
  process.exit(1);
}

try {
  const data = JSON.parse(proc.stdout);
  if (data.error) {
    console.error(`MarkItDown error: ${data.error}`);
    process.exit(1);
  }

  if (outputPath) {
    const fs = await import('fs');
    fs.writeFileSync(outputPath, data.text, 'utf-8');
    console.log(`Written to ${outputPath}`);
  } else if (asJson) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    console.log(data.text);
  }
} catch {
  console.log(proc.stdout || proc.stderr);
}
