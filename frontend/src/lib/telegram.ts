export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
}

export interface TelegramWebApp {
  ready: () => void
  expand: () => void
  close: () => void
  showAlert: (message: string) => void
  showConfirm: (message: string, callback: (confirmed: boolean) => void) => void
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void
  }
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    query_id?: string
    start_param?: string
  }
}

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export const initTelegram = () => {
  const tg = window.Telegram?.WebApp
  if (!tg) return null

  tg.ready()
  tg.expand()

  const params = new URLSearchParams(window.location.search)
  return {
    tg,
    user: tg.initDataUnsafe.user,
    telegramId: tg.initDataUnsafe.user?.id ?? params.get('tg_id'),
    chatId: params.get('chat_id'),
    initData: tg.initData
  }
}

export const hapticFeedback = (type: 'light' | 'medium' | 'heavy' = 'light') => {
  window.Telegram?.WebApp?.HapticFeedback?.impactOccurred(type)
}

export const showAlert = (message: string) => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showAlert(message)
  } else {
    alert(message)
  }
}

export const showConfirm = (message: string, callback: (confirmed: boolean) => void) => {
  if (window.Telegram?.WebApp) {
    window.Telegram.WebApp.showConfirm(message, callback)
  } else {
    callback(confirm(message))
  }
}
