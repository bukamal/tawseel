export const initTelegram = () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready()
    tg.expand()
    return tg
  }
  return null
}

export const hapticFeedback = (type) => {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type)
}
