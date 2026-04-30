export function resetMobileViewport() {
  const activeElement = document.activeElement
  if (activeElement instanceof HTMLElement) {
    activeElement.blur()
  }

  document.body.style.overflow = ''

  window.requestAnimationFrame(() => {
    window.scrollTo(window.scrollX, window.scrollY)
  })
}
