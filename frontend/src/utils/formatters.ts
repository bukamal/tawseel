export const formatPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined) return '0 ل.س'
  return new Intl.NumberFormat('ar-SY', {
    style: 'currency',
    currency: 'SYP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price).replace('SYP', 'ل.س').trim()
}

export const formatStarsPrice = (stars: number | null | undefined): string => {
  if (!stars) return '0 ⭐'
  return `⭐ ${stars.toLocaleString('ar')} نجمة`
}

export const formatPhone = (phone: string): string => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10 && cleaned.startsWith('09')) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  return phone
}

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SY', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

export const formatShortDate = (dateString: string): string => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SY', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  }).format(date)
}

export const getVehicleIcon = (type: string): string => {
  const icons: Record<string, string> = {
    economy: '🚗', comfort: '🚙', business: '🚘', van: '🚐', motorcycle: '🏍️'
  }
  return icons[type] || '🚗'
}

export const getVehicleName = (type: string): string => {
  const names: Record<string, string> = {
    economy: 'اقتصادي', comfort: 'مريح', business: 'أعمال', van: 'فان', motorcycle: 'دباب'
  }
  return names[type] || type
}

export const getStatusText = (status: string): string => {
  const statuses: Record<string, string> = {
    pending: 'قيد الانتظار',
    pending_payment: 'بانتظار الدفع',
    searching: 'جاري البحث',
    accepted: 'تم القبول',
    arrived: 'السائق وصل',
    picked_up: 'في الطريق',
    in_progress: 'في الطريق',
    completed: 'مكتملة',
    cancelled: 'ملغاة'
  }
  return statuses[status] || status
}
