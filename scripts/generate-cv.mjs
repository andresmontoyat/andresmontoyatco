import { chromium } from 'playwright'
import { readFileSync, mkdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const read = (p) => JSON.parse(readFileSync(join(root, 'src/data', p), 'utf8'))
const exp = read('experience.json')
const skills = read('skills.json')
const about = read('about.json')
const contact = read('contact.json')

const pick = (f, lang) => (typeof f === 'string' ? f : f?.[lang] ?? f?.en ?? '')
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const card = (id) => contact.cards.find((c) => c.id === id)

const STR = {
  en: { title: 'Solutions Architect & Senior Backend Engineer', summary: 'Professional Summary', experience: 'Experience', skills: 'Technical Skills' },
  es: { title: 'Arquitecto de Soluciones e Ingeniero Backend Senior', summary: 'Perfil Profesional', experience: 'Experiencia', skills: 'Habilidades Técnicas' },
}

function buildHtml(lang) {
  const s = STR[lang]
  const email = card('email').value
  const phone = card('phone').value
  const gh = card('github')
  const li = card('linkedin')
  const loc = card('location').value
  const summary = about.paragraphs.slice(0, 2).map((p) => esc(pick(p, lang))).join(' ')

  const roles = exp.entries
    .filter((e) => e.visible !== false)
    .map((e) => {
      const bullets = pick(e.bullets, lang).map((b) => `<li>${esc(b)}</li>`).join('')
      const tech = (e.tech || []).map(esc).join(' · ')
      return `<div class="role">
        <div class="role-head">
          <span class="role-title">${esc(pick(e.title, lang))}</span>
          <span class="role-date">${esc(pick(e.date, lang))}</span>
        </div>
        <div class="role-sub">${esc(e.company)} · ${esc(pick(e.location, lang))}</div>
        <ul>${bullets}</ul>
        ${tech ? `<div class="tech">${tech}</div>` : ''}
      </div>`
    })
    .join('')

  const skillBlocks = skills.categories
    .map((c) => {
      const items = c.chips.map((ch) => esc(ch.label)).join(' · ')
      return `<div class="skill-row"><span class="skill-cat">${esc(pick(c.title, lang))}</span><span class="skill-items">${items}</span></div>`
    })
    .join('')

  return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #1a1a1a; font-size: 10.5px; line-height: 1.4; margin: 0; }
    h1 { font-size: 22px; margin: 0 0 2px; letter-spacing: .2px; }
    .role-title, h2 { color: #0b1020; }
    .subtitle { font-size: 12px; color: #00708a; font-weight: bold; margin-bottom: 6px; }
    .contact { font-size: 9.5px; color: #333; margin-bottom: 14px; }
    .contact a { color: #333; text-decoration: none; }
    h2 { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; border-bottom: 1.5px solid #00708a; padding-bottom: 3px; margin: 16px 0 8px; }
    .summary { text-align: justify; margin-bottom: 4px; }
    .role { margin-bottom: 11px; page-break-inside: avoid; }
    .role-head { display: flex; justify-content: space-between; align-items: baseline; }
    .role-title { font-weight: bold; font-size: 11.5px; }
    .role-date { font-size: 9.5px; color: #555; white-space: nowrap; padding-left: 10px; }
    .role-sub { font-size: 10px; color: #00708a; font-weight: bold; margin: 1px 0 3px; }
    ul { margin: 3px 0 4px; padding-left: 16px; }
    li { margin-bottom: 2px; }
    .tech { font-size: 9px; color: #666; font-style: italic; }
    .skill-row { margin-bottom: 4px; display: flex; }
    .skill-cat { font-weight: bold; min-width: 150px; }
    .skill-items { color: #333; }
  </style></head><body>
    <h1>Carlos Andrés Montoya Tobón</h1>
    <div class="subtitle">${s.title}</div>
    <div class="contact">${esc(loc)} &nbsp;·&nbsp; ${esc(email)} &nbsp;·&nbsp; ${esc(phone)} &nbsp;·&nbsp; github.com/${esc(gh.value)} &nbsp;·&nbsp; linkedin.com/in/${esc(li.value)}</div>
    <h2>${s.summary}</h2>
    <div class="summary">${summary}</div>
    <h2>${s.experience}</h2>
    ${roles}
    <h2>${s.skills}</h2>
    ${skillBlocks}
  </body></html>`
}

const browser = await chromium.launch()
mkdirSync(join(root, 'cv'), { recursive: true })
for (const lang of ['en', 'es']) {
  const page = await browser.newPage()
  await page.setContent(buildHtml(lang), { waitUntil: 'networkidle' })
  const out = join(root, 'cv', `CarlosMontoya_CV_${lang.toUpperCase()}.pdf`)
  await page.pdf({ path: out, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '12mm', left: '14mm', right: '14mm' } })
  console.log('wrote', out)
  await page.close()
}
await browser.close()
