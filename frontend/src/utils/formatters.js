export const formatPrice = (price) => {
  if (price == null) return '0 ل.س'
  return new Intl.NumberFormat('ar-SY', { style: 'currency', currency: 'SYP' }).format(price).replace('SYP', 'ل.س')
}
export const formatStarsPrice = (stars) => stars ? `⭐ ${stars} نجمة` : '0 ⭐'
