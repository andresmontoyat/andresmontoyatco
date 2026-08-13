import { chromium } from 'playwright'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join, basename, extname } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

const escapeHtml = (s) => s
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')

const inline = (s) => escapeHtml(s)
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/(^|[\s(])\*([^*]+)\*/g, '$1<em>$2</em>')

const isTableRow = (line) => line.trim().startsWith('|')
const isDivider = (line) => /^\s*\|[\s|:-]+\|\s*$/.test(line)
const cells = (line) => line.trim().replace(/^\|/, '').replace(/\|$/, '').split('|').map((c) => c.trim())

function renderTable(rows) {
  const [head, ...body] = rows
  const th = cells(head).map((c) => `<th>${inline(c)}</th>`).join('')
  const trs = body.map((r) => `<tr>${cells(r).map((c) => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')
  return `<table><thead><tr>${th}</tr></thead><tbody>${trs}</tbody></table>`
}

function markdownToHtml(md) {
  const lines = md.split('\n')
  const out = []
  let list = null
  let quote = null

  const closeList = () => { if (list) { out.push(`<ul>${list.join('')}</ul>`); list = null } }
  const closeQuote = () => { if (quote) { out.push(`<blockquote>${quote.join(' ')}</blockquote>`); quote = null } }

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]

    if (isTableRow(line) && isDivider(lines[i + 1] ?? '')) {
      closeList(); closeQuote()
      const rows = [line]
      i += 1
      while (isTableRow(lines[i + 1] ?? '')) { i += 1; rows.push(lines[i]) }
      out.push(renderTable(rows))
      continue
    }

    const heading = line.match(/^(#{1,4})\s+(.*)$/)
    if (heading) {
      closeList(); closeQuote()
      const level = heading[1].length
      out.push(`<h${level}>${inline(heading[2])}</h${level}>`)
      continue
    }

    if (/^\s*---\s*$/.test(line)) { closeList(); closeQuote(); out.push('<hr />'); continue }

    const bullet = line.match(/^\s*[-*]\s+(.*)$/)
    if (bullet) { closeQuote(); list = list ?? []; list.push(`<li>${inline(bullet[1])}</li>`); continue }

    const quoted = line.match(/^>\s?(.*)$/)
    if (quoted) { closeList(); quote = quote ?? []; quote.push(inline(quoted[1])); continue }

    if (!line.trim()) { closeList(); closeQuote(); continue }

    closeList(); closeQuote()
    out.push(`<p>${inline(line.trim())}</p>`)
  }

  closeList(); closeQuote()
  return out.join('\n')
}

const styles = `
  :root { --ink: #14161a; --muted: #5a6270; --line: #dfe3ea; --accent: #0b6bcb; --chip: #f4f6fa; }
  * { box-sizing: border-box; }
  body { font-family: 'Inter', -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif;
         color: var(--ink); font-size: 10.5pt; line-height: 1.55; margin: 0; }
  h1 { font-size: 20pt; letter-spacing: -0.02em; margin: 0 0 4pt; }
  h2 { font-size: 12.5pt; margin: 18pt 0 6pt; padding-bottom: 3pt;
       border-bottom: 1.5px solid var(--accent); color: var(--accent);
       break-after: avoid; page-break-after: avoid; }
  h3 { font-size: 10.5pt; margin: 11pt 0 4pt; text-transform: uppercase;
       letter-spacing: 0.06em; color: var(--muted);
       break-after: avoid; page-break-after: avoid; }
  p { margin: 0 0 6pt; text-align: justify; }
  ul { margin: 0 0 8pt; padding-left: 15pt; }
  li { margin-bottom: 3.5pt; text-align: justify; }
  strong { color: #000; font-weight: 650; }
  code { font-family: 'JetBrains Mono', Menlo, monospace; font-size: 8.8pt;
         background: var(--chip); padding: 0.5pt 3pt; border-radius: 3px; }
  hr { border: 0; border-top: 1px solid var(--line); margin: 14pt 0 0; }
  blockquote { margin: 0 0 8pt; padding: 6pt 10pt; background: var(--chip);
               border-left: 3px solid var(--accent); color: var(--muted); }
  blockquote p { margin: 0; }
  table { width: 100%; border-collapse: collapse; margin: 4pt 0 10pt;
          font-size: 9.6pt; break-inside: avoid; page-break-inside: avoid; }
  th { text-align: left; background: var(--chip); color: var(--muted);
       text-transform: uppercase; letter-spacing: 0.05em; font-size: 8.4pt;
       padding: 5pt 7pt; border-bottom: 1px solid var(--line); }
  td { padding: 5pt 7pt; border-bottom: 1px solid var(--line); vertical-align: top; }
  .doc-header { border-bottom: 2px solid var(--ink); padding-bottom: 8pt; margin-bottom: 4pt; }
  .doc-header p { color: var(--muted); margin: 0; text-align: left; font-size: 9.6pt; }
  section { break-inside: auto; }
`

function wrapHeader(html) {
  return html.replace(
    /^<h1>([\s\S]*?)<\/h1>\n([\s\S]*?)<hr \/>/,
    '<div class="doc-header"><h1>$1</h1>$2</div>'
  )
}

async function main() {
  const input = process.argv[2]
  if (!input) {
    console.error('Usage: node scripts/md-to-pdf.mjs <file.md> [output.pdf]')
    process.exit(1)
  }

  const srcPath = join(root, input)
  const outPath = join(root, process.argv[3] ?? `${basename(input, extname(input))}.pdf`)
  const md = readFileSync(srcPath, 'utf8')
  const body = wrapHeader(markdownToHtml(md))

  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400&display=swap" />
    <style>${styles}</style></head><body><section>${body}</section></body></html>`

  const browser = await chromium.launch()
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: 'networkidle' })
  await page.pdf({
    path: outPath,
    format: 'A4',
    printBackground: true,
    margin: { top: '16mm', bottom: '14mm', left: '16mm', right: '16mm' },
    displayHeaderFooter: true,
    headerTemplate: '<div></div>',
    footerTemplate: `<div style="width:100%;font-size:7.5pt;color:#8a92a0;
      font-family:Inter,sans-serif;padding:0 16mm;display:flex;justify-content:space-between;">
      <span>Carlos Andrés Montoya Tobón · andresmontoyat.co</span>
      <span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>`,
  })
  await browser.close()

  console.log(`PDF generated: ${outPath}`)
}

main()
