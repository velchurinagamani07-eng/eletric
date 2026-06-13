export const currency = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`

export const fullAddress = (address = {}) =>
  [address.flat, address.street, address.landmark, address.city, address.pincode]
    .filter(Boolean)
    .join(', ')

export const nextBookingId = () => `DP-${String(Date.now()).slice(-6)}`

export const todayISO = () => new Date().toISOString().slice(0, 10)
