export const initTelegram = () => {
  const tg = window.Telegram?.WebApp
  if (!tg) return null
  
  tg.ready()
  tg.expand()
  
  return {
    tg,
    user: tg.initDataUnsafe?.user,
    telegramId: tg.initDataUnsafe?.user?.id,
    initData: tg.initData // هذا هو المهم لإرساله في الهيدر
  }
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
