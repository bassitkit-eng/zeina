import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const scanDirs = ['app', 'components', 'lib', 'styles']
const textExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.css', '.md', '.mjs'])

// Common mojibake markers seen when UTF-8 text is decoded as Latin-1/Windows-1252.
const suspicious = /[\u00D8\u00D9\u00C3\u00E2\uFFFD]/

const offenders = []

function walk(dir) {
  if (!fs.existsSync(dir)) return
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue
      walk(fullPath)
      continue
    }

    const ext = path.extname(entry.name).toLowerCase()
    if (!textExtensions.has(ext)) continue

    const content = fs.readFileSync(fullPath, 'utf8')
    const lines = content.split(/\r?\n/)

    for (let i = 0; i < lines.length; i += 1) {
      if (suspicious.test(lines[i])) {
        offenders.push({ file: path.relative(root, fullPath), line: i + 1, text: lines[i].trim() })
      }
    }
  }
}

for (const dir of scanDirs) {
  walk(path.join(root, dir))
}

if (offenders.length > 0) {
  console.error('Found possible mojibake text. Please fix encoding in these lines:')
  for (const item of offenders) {
    console.error(`- ${item.file}:${item.line} -> ${item.text}`)
  }
  process.exit(1)
}

console.log('Encoding check passed: no mojibake markers found.')
