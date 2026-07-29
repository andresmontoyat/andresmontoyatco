export function dialogLines(site, lang) {
  const L = [`${site.title[lang]}  ·  ${site.co}`, site.date[lang]]
  if (site.metric) L.push(`★ ${site.metric.v ? `${site.metric.v}  ` : ''}${site.metric[lang]}`)
  L.push(`‹tech› ${site.tech.slice(0, 5).join(' · ')}`)
  return L
}

export function createDialog() {
  let state = 'closed'
  let site = null
  let typed = 0
  const full = () => dialogLines(site, 'en').join('\n').length
  return {
    get state() { return state },
    open(s) { site = s; typed = 0; state = 'typing' },
    tick(dtChars = 1.6) {
      if (state !== 'typing') return
      typed += dtChars
      if (typed >= full()) { typed = full(); state = 'waiting' }
    },
    advance() {
      if (state === 'typing') { typed = full(); state = 'waiting' }
      else if (state === 'waiting') { state = 'closed'; site = null }
    },
    visibleText(lang) { return dialogLines(site, lang).join('\n').slice(0, Math.floor(typed)) },
    isOpen() { return state !== 'closed' },
  }
}
