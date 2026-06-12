import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { settings } from '../data/catalog'

const money = (value) => `Rs. ${Number(value || 0).toLocaleString('en-IN')}`
const amber = [245, 158, 11]
const navy = [15, 39, 68]
const lightGray = [248, 250, 252]

function brandedHeader(doc, title, subtitle = '') {
  doc.setFillColor(...amber)
  doc.rect(0, 0, 210, 28, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(18)
  doc.setFont('helvetica', 'bold')
  doc.text(settings.companyName, 14, 13)
  doc.setFontSize(9)
  doc.setFont('helvetica', 'normal')
  doc.text('Expert Electricians in Tuni, Andhra Pradesh', 14, 20)
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

export function generateReceiptPDF(booking, productOrders = []) {
  const doc = new jsPDF()
  const receiptId = booking.bookingId || booking.id
  const paidStatus = booking.paymentStatus === 'success' || booking.status === 'paid' ? 'PAID' : String(booking.paymentStatus || booking.status || 'pending').toUpperCase()
  brandedHeader(doc, 'Service Receipt', receiptId)

  doc.setTextColor(...navy)
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.text(`Status: ${paidStatus}`, 14, 39)

  autoTable(doc, {
    startY: 46,
    head: [['Receipt Number', 'Issue Date', 'Payment Method', 'Transaction ID']],
    body: [
      [receiptId, String(booking.createdAt || new Date().toISOString()).slice(0, 10), booking.paymentMethod || 'Razorpay / Cash', booking.paymentId || 'Pending'],
    ],
    headStyles: { fillColor: navy, textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: lightGray },
  })

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 8,
    head: [['Customer Details', 'Service Details']],
    body: [
      [
        `${booking.customer || booking.userName || 'Customer'}\n${booking.mobile || '-'}\n${booking.email || '-'}\n${booking.address ? Object.values(booking.address).filter(Boolean).join(', ') : '-'}`,
        `${booking.serviceName}\nWorker: ${booking.workerName || 'To be assigned'}\nSchedule: ${booking.date || '-'} | ${booking.timeSlot || '-'}\nWarranty: 3 months`,
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
  doc.text('3 Months Warranty Included', 20, y + 9)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Claim contact: +91 ${settings.phone}`, 20, y + 16)
  doc.setTextColor(71, 85, 105)
  doc.text('Scan receipt URL from web receipt to verify.', 145, y + 13)

  brandedFooter(doc)
  doc.save(`receipt-${receiptId}.pdf`)
}

export function generateBookingsPDF(bookings, filename = 'bookings-report.pdf') {
  const doc = new jsPDF()
  brandedHeader(doc, 'Bookings Report', new Date().toISOString().slice(0, 10))
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

export function generateIncomeReportPDF(rows) {
  const doc = new jsPDF()
  const total = rows.reduce((sum, row) => sum + row.revenue, 0)
  brandedHeader(doc, 'Daily Income Report', `Total: ${money(total)}`)
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
