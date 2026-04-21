export const formatPrice = (price) => {
  if (price == null) return '0 ل.س'
  return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP', minimumFractionDigits: 0 })
    .format(price).replace('SYP', 'ل.س').trim()
}

export const formatStarsPrice = (stars) => {
  if (!stars) return '0 ⭐'
  return `⭐ ${stars.toLocaleString('ar')} نجمة`
}

export const formatDate = (dateString) => {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('ar-SY', {
    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  }).format(date)
}

export const getStatusText = (status) => {
  const map = {
    pending: 'قيد الانتظار', searching: 'جاري البحث', accepted: 'تم القبول',
    arrived: 'السائق وصل', picked_up: 'في الطريق', completed: 'مكتملة', cancelled: 'ملغاة'
  }
  return map[status] || status
}
