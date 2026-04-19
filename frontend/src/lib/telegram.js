export const initTelegram = () => {
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp
    tg.ready()
    tg.expand()
    return tg
  }
  return null
}

export const hapticFeedback = (type = 'light') => {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type)
}

export const showAlert = (message) => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(message)
  } else {
    alert(message)
  }
}

export const showConfirm = (message, callback) => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showConfirm(message, callback)
  } else {
    callback(confirm(message))
  }
}
