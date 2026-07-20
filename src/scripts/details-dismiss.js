// Progressive-enhancement layer (D-06) for <details class="details-dismiss">:
// adds Escape-to-close and outside-click-to-close. Base open/close via
// clicking <summary> works with zero JS — this script is additive only.
// Generic by design (selector-based, zero section-specific identifiers)
// so other sections can reuse it unmodified.
function initDismiss(root = document) {
  root.querySelectorAll('details.details-dismiss').forEach((el) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && el.open) {
        el.open = false
        el.querySelector('summary')?.focus()
      }
    })
    document.addEventListener('click', (e) => {
      if (el.open && !el.contains(e.target)) el.open = false
    })
  })
}

initDismiss()

export { initDismiss }
