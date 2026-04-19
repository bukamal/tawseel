export const formatPrice = (price) => {
  if (price == null) return '0 ل.س'
  return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP' }).format(price).replace('SYP', 'ل.س')
}

export const formatStarsPrice = (stars) => {
  if (!stars) return '0 ⭐'
  return `⭐ ${stars} نجمة`
}

export const formatPhone = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10 && cleaned.startsWith('09')) return `${cleaned.slice(0,4)} ${cleaned.slice(4,7)} ${cleaned.slice(7)}`
  return phone
}

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SY', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(date)
}

export const formatShortDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SY', { year: 'numeric', month: 'numeric', day: 'numeric' }).format(date)
}

export const getVehicleIcon = (type) => {
  const icons = { economy: '🚗', comfort: '🚙', business: '🚘', van: '🚐', motorcycle: '🏍️' }
  return icons[type] || '🚗'
}

export const getVehicleName = (type) => {
  const names = { economy: 'اقتصادي', comfort: 'مريح', business: 'أعمال', van: 'فان', motorcycle: 'دباب' }
  return names[type] || type
}

export const getStatusText = (status) => {
  const statuses = {
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
