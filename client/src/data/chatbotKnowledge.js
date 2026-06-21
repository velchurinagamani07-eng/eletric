export const defaultChatbotKnowledge = {
  businessInfo: {
    name: 'Home Electric Services',
    owner: 'M Dileep Kumar',
    phone: '+91 9493745479',
    whatsapp: '919493745479',
    location: 'Tuni, Andhra Pradesh',
    hours: '8:00 AM - 8:00 PM, all days',
    warranty: '1 month warranty on all completed electrical repairs',
  },
  faqs: [
    {
      keywords: ['warranty', 'guarantee'],
      answer: "We offer 1 month warranty on all completed electrical repairs. If the same issue occurs again within this period, we'll fix it free of charge.",
    },
    {
      keywords: ['price', 'cost', 'charge', 'fee'],
      answer: 'Our prices start from Rs. 149 for basic repairs. You can see exact pricing for any service on its detail page.',
    },
    {
      keywords: ['timing', 'time', 'hours', 'open', 'available'],
      answer: "We're available from 8:00 AM to 8:00 PM, all 7 days a week. Same-day service is available if booked before 2 PM.",
    },
    {
      keywords: ['location', 'area', 'where', 'serve', 'city'],
      answer: 'We currently provide electrical services in Tuni, Andhra Pradesh and nearby areas. Enter your pincode at checkout to confirm serviceability.',
    },
    {
      keywords: ['payment', 'pay', 'upi', 'cash', 'card'],
      answer: 'We accept UPI, cards, net banking through Razorpay where enabled, and Cash on Service for eligible bookings.',
    },
    {
      keywords: ['cancel', 'cancellation', 'refund'],
      answer: "You can cancel or reschedule a booking up to 2 hours before the scheduled time from My Bookings. Refunds are usually processed within 3-5 business days.",
    },
    {
      keywords: ['worker', 'electrician', 'technician', 'staff'],
      answer: "All electricians are verified and trained. You'll see the assigned worker's name and contact details once your booking is confirmed.",
    },
    {
      keywords: ['coupon', 'discount', 'offer'],
      answer: 'Check My Coupons for active offers. We also create reward coupons after completed paid services.',
    },
    {
      keywords: ['book', 'booking', 'schedule', 'appointment'],
      answer: 'Booking is easy: choose a service, pick date and time, add your address, and confirm payment details.',
    },
    {
      keywords: ['track', 'status', 'where is my worker'],
      answer: "You can track booking status from My Bookings. You'll see updates like Confirmed, Worker Assigned, On The Way, and Completed.",
    },
    {
      keywords: ['wiring', 'house wiring'],
      answer: 'We offer complete house wiring starting at Rs. 2,499 for 1BHK, including switch installation and safety checks with 1 month warranty.',
    },
    {
      keywords: ['fan', 'ceiling fan'],
      answer: 'Fan installation starts at Rs. 199 and fan repair starts at Rs. 149. Both include testing and 1 month warranty.',
    },
    {
      keywords: ['ac', 'air conditioner', 'air conditioning'],
      answer: 'AC installation starts at Rs. 599 for 1-1.5 Ton. We also handle AC servicing, gas filling, and repairs.',
    },
    {
      keywords: ['inverter', 'battery'],
      answer: 'Inverter installation starts at Rs. 399 and repair starts at Rs. 299. We also handle battery water filling and replacement.',
    },
    {
      keywords: ['cctv', 'camera', 'security'],
      answer: 'CCTV installation for 2 cameras starts at Rs. 1,999. We handle DVR or NVR setup and remote viewing configuration too.',
    },
  ],
  greeting: "Hi! I'm HEBot. I can answer questions about services, pricing, warranty, or help you book. What would you like to know?",
  fallback: "I'm not sure about that one. I can connect you with our team on WhatsApp or by phone.",
}
