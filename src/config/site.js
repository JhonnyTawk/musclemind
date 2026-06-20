// ============================================================
// MuscleMind — public site content
// ------------------------------------------------------------
// EDIT THIS FILE to update everything shown on the public
// homepage: clinic name, About text, testimonials, contact
// details, address/map and the WhatsApp number that booking
// requests are sent to. Nothing else needs to change.
// ============================================================

export const SITE = {
  // ---- Clinic identity ----
  clinicName: 'MuscleMind Physiotherapy',
  tagline: 'Personalized physiotherapy for lasting recovery',
  // Short sentence under the hero headline.
  heroSubtitle:
    'One-on-one assessment, hands-on treatment, and a home program built around your goals — so you recover with confidence and stay that way.',

  // ---- About Us ----
  about: {
    // Replace with your name and credentials.
    practitionerName: 'Chada Tawk',                 // TODO: your full name
    practitionerTitle: 'Physiotherapist',       // TODO: your title / credentials
    // 2–3 short paragraphs. Plain text; blank lines separate paragraphs.
    body: [
      'MuscleMind is a solo physiotherapy practice focused on getting you back to the things you love — without rushing the process or treating you like a number.',
      'Every plan starts with a thorough assessment, then combines hands-on treatment with a clear, personalized home exercise program you can actually follow. You get one practitioner who knows your history from start to finish.',
      'Whether you are recovering from surgery, managing a nagging injury, or returning to sport, the goal is the same: measurable progress and a recovery that lasts.',
    ],
    // Optional short list of focus areas shown as chips.
    focusAreas: [
      'Post-surgical rehab',
      'Sports injuries',
      'ACL recovery',
      'Back & neck pain',
      'Posture & movement',
    ],
  },

  // ---- Testimonials ----
  // Replace with real patient testimonials (with permission).
  testimonials: [
    {
      name: 'Lara H.',
      context: 'ACL recovery',
      quote:
        'I went from barely walking to back on the football pitch. The home program was clear and I always knew exactly what to do next.',
    },
    {
      name: 'Samir K.',
      context: 'Chronic low back pain',
      quote:
        'After years of on-and-off pain, this is the first time I felt someone actually listened and built a plan around my day-to-day life.',
    },
    {
      name: 'Maya T.',
      context: 'Shoulder rehab',
      quote:
        'Professional, patient, and genuinely encouraging. I could see my progress week by week and that kept me motivated.',
    },
  ],

  // ---- Contact details ----
  contact: {
    email: 'chada@musclemind.clinic',           // TODO: your email
    // Phone shown to visitors (human-readable).
    phoneDisplay: '+961 70 241 802',            // TODO: your phone
    // WhatsApp number in INTERNATIONAL format, digits only (no +, spaces or dashes).
    // Booking requests and contact messages open a pre-filled WhatsApp to this number.
    whatsappNumber: '96170241802',              // TODO: your WhatsApp number
    instagram: '',                              // optional, e.g. 'https://instagram.com/...'
  },

  // ---- Find Us ----
  findUs: {
    // Full address shown on the page.
    address: 'Mar youhana Bsahrri, bsharri Sqaure, Lebanon',  // TODO: your real address
    // The map auto-centers on this query. Use your address or a Google Maps
    // "plus code"/place name. No API key required.
    mapQuery: 'Mar youhana Bsahrri, bsharri Sqaure, Lebanon', // TODO: your real address
    // Human-friendly opening hours shown next to the map.
    hours: [
      { days: 'Monday – Friday', time: '9:00 – 18:00' },
      { days: 'Saturday', time: '9:00 – 13:00' },
      { days: 'Sunday', time: 'Closed' },
    ],
  },

  // ---- Booking ----
  booking: {
    // Time slots offered in the booking form. Edit freely.
    slots: ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'],
    // Session types the visitor can choose from.
    sessionTypes: [
      'Initial assessment',
      'Follow-up session',
      'Sports / ACL rehab',
      'Other (tell us below)',
    ],
  },
}

// Build a wa.me deep-link with a pre-filled message to the clinic WhatsApp.
export function whatsappLink(message) {
  const num = SITE.contact.whatsappNumber.replace(/[^\d]/g, '')
  return `https://wa.me/${num}?text=${encodeURIComponent(message)}`
}

// Google Maps embed URL for the Find Us section (no API key needed).
export function mapEmbedUrl() {
  return `https://www.google.com/maps?q=${encodeURIComponent(SITE.findUs.mapQuery)}&output=embed`
}
