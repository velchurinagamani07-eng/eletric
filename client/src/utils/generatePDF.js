import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { settings } from '../data/catalog'
import { UPI_ID, isPaidStatus, paymentStatusLabel } from './upiPayment'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
const amber = [245, 158, 11]
const navy = [15, 39, 68]
const lightGray = [248, 250, 252]
let logoDataUrlPromise = null

function formatDate(value) {
  if (!value) return '-'
  if (typeof value.toDate === 'function') return value.toDate().toISOString().slice(0, 10)
  if (typeof value.toMillis === 'function') return new Date(value.toMillis()).toISOString().slice(0, 10)
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  const parsed = Date.parse(value)
  return Number.isNaN(parsed) ? String(value).slice(0, 10) : new Date(parsed).toISOString().slice(0, 10)
}

function logoFormat(dataUrl = '') {
  if (dataUrl.startsWith('data:image/png')) return 'PNG'
  if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) return 'JPEG'
  if (dataUrl.startsWith('data:image/webp')) return 'WEBP'
  return 'WEBP'
}

function loadLogoDataUrl() {
  if (logoDataUrlPromise) return logoDataUrlPromise
  logoDataUrlPromise = fetch('/logo.webp')
    .then((response) => {
      if (!response.ok) throw new Error('Logo not found')
      return response.blob()
    })
    .then((blob) => new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(blob)
    }))
    .catch(() => '')
  return logoDataUrlPromise
}

function drawFallbackLogo(doc) {
  doc.setFillColor(255, 255, 255)
  doc.roundedRect(14, 6, 14, 14, 2, 2, 'F')
  doc.setTextColor(...amber)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'bold')
  doc.text('DP', 21, 15, { align: 'center' })
}

async function brandedHeader(doc, title, subtitle = '') {
  doc.setFillColor(...amber)
  doc.rect(0, 0, 210, 28, 'F')
  const logoDataUrl = await loadLogoDataUrl()
  if (logoDataUrl) {
    try {
      doc.setFillColor(255, 255, 255)
      doc.roundedRect(14, 5, 16, 16, 2, 2, 'F')
      doc.addImage(logoDataUrl, logoFormat(logoDataUrl), 15.5, 6.5, 13, 13)
    } catch {
      drawFallbackLogo(doc)
    }
  } else {
    drawFallbackLogo(doc)
  }
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.companyName, 34, 13)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Expert Electricians in Tuni, Andhra Pradesh', 34, 20)
  doc.setFontSize(12)
  doc.setFont('helvetica', 'bold')
  doc.text(title.toUpperCase(), 196, 13, { align: 'right' })
  if (subtitle) {
    doc.setFontSize(9)
    doc.text(subtitle, 196, 20, { align: 'right' })
  }
}

function brandedFooter(doc) {
  const pageCount = doc.internal.getNumberOfPages()
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page)
    doc.setFillColor(248, 250, 252)
    doc.rect(0, 281, 210, 16, 'F')
    doc.setTextColor(71, 85, 105)
    doc.setFontSize(8)
    doc.text(`${settings.companyName} | +91 ${settings.phone}`, 14, 288)
    doc.text(`Page ${page} of ${pageCount}`, 196, 288, { align: 'right' })
  }
}

export async function generateReceiptPDF(booking, productOrders = []) {
  const doc = new jsPDF()
  const receiptId = booking.bookingId || booking.id
  const paymentStatus = booking.paymentStatus || booking.status || 'pending'
  const paidStatus = isPaidStatus(paymentStatus) ? 'PAID' : paymentStatusLabel(paymentStatus).toUpperCase()
  const paymentDate = formatDate(booking.paidAt || booking.approvedAt || booking.paymentDate || booking.createdAt)
  await brandedHeader(doc, 'Service Receipt', receiptId)

  doc.setTextColor(...navy)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Status: ${paidStatus}`, 14, 39)

  autoTable(doc, {
    startY: 46,
    head: [['Receipt Number', 'Payment Date', 'Payment Method', 'Payment Reference']],
    body: [
      [receiptId, paymentDate, booking.paymentMethod || 'UPI', booking.paymentId || 'Paid by screenshot'],
    ],
    headStyles: { fillColor: navy, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: lightGray },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 6,
    body: [
      ['UPI ID', booking.upiId || UPI_ID],
      ['QR Reference', `UPI payment collected for booking ${receiptId}`],
    ],
    styles: { fontSize: 9 },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 38 }, 1: { textColor: navy } },
    alternateRowStyles: { fillColor: lightGray },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Customer Details', 'Service Details']],
    body: [
      [
        `${booking.customer || booking.userName || 'Customer'}\n${booking.mobile || '-'}\n${booking.email || '-'}\n${booking.address ? Object.values(booking.address).filter(Boolean).join(', ') : '-'}`,
        `${booking.serviceName}\nWorker: ${booking.workerName || 'To be assigned'}\nSchedule: ${booking.date || '-'} | ${booking.timeSlot || '-'}\nWarranty: 1 Month`,
      ],
    ],
    headStyles: { fillColor: navy, textColor: [255, 255, 255] },
    bodyStyles: { cellPadding: 4, minCellHeight: 28 },
  })

  const serviceRows = (booking.services?.length ? booking.services : [{
    name: booking.serviceName,
    addons: booking.addons || [],
    qty: 1,
    rate: booking.amount + (booking.discountAmount || 0),
    subtotal: booking.amount + (booking.discountAmount || 0),
  }]).map((service) => [
    service.name || '-',
    service.addons?.join?.(', ') || '-',
    service.qty || 1,
    money(service.rate),
    money(service.subtotal || service.rate),
  ])

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Service', 'Add-ons', 'Qty', 'Rate', 'Amount']],
    body: serviceRows,
    headStyles: { fillColor: amber, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: lightGray },
  })

  if (productOrders.length > 0) {
    doc.setTextColor(...navy)
    doc.setFontSize(11)
    doc.setFont('helvetica', 'bold')
    doc.text('Products Ordered', 14, doc.lastAutoTable.finalY + 10)
    autoTable(doc, {
      startY: doc.lastAutoTable.finalY + 14,
      head: [['Product', 'Brand', 'Qty', 'Rate', 'Amount']],
      body: productOrders.map((product) => [
        product.name || '-',
        product.brand || '-',
        product.quantity || 1,
        money(product.price),
        money(Number(product.price || 0) * Number(product.quantity || 1)),
      ]),
      headStyles: { fillColor: navy, textColor: [255, 255, 255] },
      alternateRowStyles: { fillColor: lightGray },
    })
  }

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    body: [
      ['Coupon Discount', `-${money(booking.discountAmount || 0)}`],
      ['Wallet Credit', money(0)],
      ['GST 18 percent', money(0)],
      ['Total', money(booking.totalAmount ?? booking.amount)],
    ],
    styles: { halign: 'right' },
    columnStyles: { 0: { fontStyle: 'bold' }, 1: { fontStyle: 'bold' } },
    didParseCell: (data) => {
      if (data.row.index === 3) data.cell.styles.textColor = amber
      if (data.row.index === 0 || data.row.index === 1) data.cell.styles.textColor = [22, 101, 52]
    },
  })

  const y = doc.lastAutoTable.finalY + 10
  doc.setDrawColor(...amber)
  doc.setFillColor(255, 251, 235)
  doc.roundedRect(14, y, 118, 24, 2, 2, 'FD')
  doc.setTextColor(...navy)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text('1 Month Warranty Included', 20, y + 9)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Claim contact: +91 ${settings.phone}`, 20, y + 16)
  doc.setTextColor(71, 85, 105)
  doc.text('Scan receipt URL from web receipt to verify.', 145, y + 13)

  brandedFooter(doc)
  doc.save(`receipt-${receiptId}.pdf`)
}

export async function generateBookingsPDF(bookings, filename = 'bookings-report.pdf') {
  const doc = new jsPDF()
  await brandedHeader(doc, 'Bookings Report', new Date().toISOString().slice(0, 10))
  autoTable(doc, {
    startY: 40,
    head: [['Booking', 'Customer', 'Service', 'Date', 'Status', 'Amount']],
    body: bookings.map((booking) => [
      booking.bookingId || booking.id,
      booking.customer || '-',
      booking.serviceName,
      booking.date,
      booking.status,
      money(booking.amount),
    ]),
    headStyles: { fillColor: navy, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: lightGray },
  })
  brandedFooter(doc)
  doc.save(filename)
}

export async function generateIncomeReportPDF(rows) {
  const doc = new jsPDF()
  const total = rows.reduce((sum, row) => sum + row.revenue, 0)
  await brandedHeader(doc, 'Daily Income Report', `Total: ${money(total)}`)
  doc.setTextColor(...navy)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(`Total income: ${money(total)}`, 14, 39)
  autoTable(doc, {
    startY: 46,
    head: [['Month', 'Bookings', 'Revenue']],
    body: rows.map((row) => [row.month, row.bookings, money(row.revenue)]),
    headStyles: { fillColor: navy, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: lightGray },
  })
  brandedFooter(doc)
  doc.save('income-report.pdf')
}

export async function generatePaymentVerificationsPDF(rows) {
  const doc = new jsPDF()
  await brandedHeader(doc, 'Payment Records', new Date().toISOString().slice(0, 10))
  autoTable(doc, {
    startY: 40,
    head: [['Booking', 'Customer', 'Amount', 'Reference', 'Status', 'Service']],
    body: rows.map((payment) => [
      payment.bookingId || '-',
      payment.customerName || payment.booking?.customer || '-',
      money(payment.amount),
      payment.paymentId || payment.id || '-',
      paymentStatusLabel(payment.paymentStatus),
      payment.booking?.serviceName || '-',
    ]),
    headStyles: { fillColor: navy, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: lightGray },
    styles: { fontSize: 8 },
  })
  brandedFooter(doc)
  doc.save('payment-verifications.pdf')
}
