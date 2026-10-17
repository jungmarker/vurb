/*
 * Vurb.me site config — edit the name, prices and links here.
 * Every price and link on the site is read from this object.
 * Any checkout link set to "#" shows "Coming soon" instead of a checkout.
 */
window.VURB_CONFIG = {
  name: "Vurb.me", // product name, rendered into every [data-name] element
  currency: "$",

  prices: {
    free: 0,
    proMonthly: 4.99, // per month, billed monthly
    proYearly: 39, // per year (shown as proYearly / 12 per month; % saved is computed)
    growthMonthly: 12, // per user per month, billed monthly
    growthYearly: 9, // per user per month, billed yearly
  },

  freeWordsPerWeek: 2000,
  growthMinSeats: 3,

  checkout: {
    proMonthly: "#",
    proYearly: "#",
    growth: "#", // "Start team trial"
    enterprise: "mailto:sales@vurb.me", // "Talk to sales"
  },

  downloads: {
    mac: "https://github.com/jungmarker/vurb/releases/latest",
    windows: "https://github.com/jungmarker/vurb/releases/latest",
    linux: "https://github.com/jungmarker/vurb/releases/latest",
  },

  links: {
    github: "https://github.com/jungmarker/vurb/releases",
  },

  refundDays: 30,
  proDeviceLimit: 3,
};
