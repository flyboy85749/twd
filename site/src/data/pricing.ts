// Adapted from cwd-workspace/pricing-packages.md, reworded for general small businesses.
// A feature value of `true` renders as "Included", `false` as "Not included", a string as-is.

export type Tier = {
  id: string;
  name: string;
  bestFor: string;
  price: number;
  monthly: string;
  delivery: string;
};

export type PriceLine = {
  id: string;
  title: string;
  summary: string;
  tiers: [Tier, Tier, Tier];
  features: { label: string; values: [string | boolean, string | boolean, string | boolean] }[];
  monthlyNote: string;
};

export const priceLines: PriceLine[] = [
  {
    id: 'web',
    title: 'Websites',
    summary: 'Small business sites built on clean, fast foundations you own outright.',
    tiers: [
      { id: 'web-starter', name: 'Starter', bestFor: 'New and single-location businesses', price: 799, monthly: '$49/mo, optional', delivery: '1–2 weeks' },
      { id: 'web-standard', name: 'Standard', bestFor: 'Established businesses that want to grow', price: 1799, monthly: '$79/mo, optional', delivery: '2–4 weeks' },
      { id: 'web-premium', name: 'Premium', bestFor: 'Multi-location or custom-feature businesses', price: 3499, monthly: '$149/mo, optional', delivery: '4–6 weeks' },
    ],
    features: [
      { label: 'Pages', values: ['Up to 5', 'Up to 10', 'Unlimited'] },
      { label: 'Design', values: ['Proven layout, branded to you', 'Semi-custom, from your branding', 'Fully custom'] },
      { label: 'Works on phones and tablets', values: [true, true, true] },
      { label: 'Contact form', values: [true, true, true] },
      { label: 'Services or menu page', values: [true, true, true] },
      { label: 'Photo gallery', values: [true, true, true] },
      { label: 'Google Maps and SEO basics', values: [true, true, true] },
      { label: 'Online payments or booking (Stripe, Square, Calendly)', values: [false, true, true] },
      { label: 'Team page', values: [false, true, true] },
      { label: 'Blog or news section', values: [false, true, true] },
      { label: 'Custom features (customer portal, quotes, scheduling)', values: [false, false, true] },
      { label: 'Revision rounds', values: ['2', '3', 'Unlimited during build'] },
    ],
    monthlyNote:
      'Monthly care covers updates, security patches, uptime monitoring, and up to an hour of content edits each month.',
  },
  {
    id: 'chatbot',
    title: 'AI chatbots',
    summary: 'A chat assistant trained on your own business info that answers customers while you work.',
    tiers: [
      { id: 'chatbot-starter', name: 'Starter', bestFor: '“Are you open? Do you serve my area?” questions', price: 499, monthly: '$49/mo', delivery: '3–5 days' },
      { id: 'chatbot-standard', name: 'Standard', bestFor: 'Detailed FAQs and routing questions to the right person', price: 999, monthly: '$79/mo', delivery: '1–2 weeks' },
      { id: 'chatbot-premium', name: 'Premium', bestFor: 'Many topics plus CRM and email integration', price: 1999, monthly: '$149/mo', delivery: '2–3 weeks' },
    ],
    features: [
      { label: 'Knowledge base', values: ['Up to 20 questions', 'Up to 75 questions', 'Unlimited, from your documents'] },
      { label: 'Custom tone and personality', values: ['Basic', true, true] },
      { label: 'Hands off to you by email', values: [false, true, true] },
      { label: 'Usage dashboard', values: [false, true, true] },
      { label: 'CRM and email integration (HubSpot, Mailchimp)', values: [false, false, true] },
      { label: 'Multiple languages, including Spanish', values: [false, false, true] },
      { label: 'Retraining rounds', values: ['1', '2', 'Unlimited during build'] },
    ],
    monthlyNote:
      'Monthly hosting covers AI usage costs, model updates, uptime monitoring, and up to two knowledge base additions each month.',
  },
  {
    id: 'automation',
    title: 'Automation',
    summary: 'n8n workflows that take repetitive follow-up off your plate.',
    tiers: [
      { id: 'automation-starter', name: 'Starter', bestFor: 'One or two manual tasks to automate', price: 299, monthly: '$29/mo, optional', delivery: '3–5 days' },
      { id: 'automation-standard', name: 'Standard', bestFor: 'Several workflows that need to work together', price: 699, monthly: '$59/mo, optional', delivery: '1–2 weeks' },
      { id: 'automation-premium', name: 'Premium', bestFor: 'A full automation setup across your tools', price: 1499, monthly: '$99/mo, optional', delivery: '2–4 weeks' },
    ],
    features: [
      { label: 'Workflows', values: ['1–2', '3–5', '6 or more'] },
      { label: 'Examples', values: ['New-lead text and email reply, review requests', 'Booking confirmations, quote follow-ups, newsletter sign-ups', 'Everything in Standard, plus custom integrations'] },
      { label: 'Connects to', values: ['Gmail or Outlook', 'Email plus CRM or booking (HubSpot, Jobber, Google Calendar)', 'Email, CRM, payments, and custom APIs'] },
      { label: 'Written documentation', values: [true, true, true] },
      { label: 'Training session', values: [false, '1-hour Zoom walkthrough', '2-hour Zoom plus recorded video'] },
    ],
    monthlyNote:
      'Monthly care covers workflow monitoring, error alerts, platform updates, and up to an hour of adjustments each month.',
  },
];

export const bundles = [
  { name: 'Business Launch', includes: 'Standard website + Starter chatbot', savings: 'Save $200' },
  { name: 'Full Digital Business', includes: 'Standard website + Standard chatbot + Standard automation', savings: 'Save $500' },
  { name: 'Custom', includes: 'Any combination of Premium packages', savings: 'Custom quote' },
];

export const terms = [
  'A 50% deposit starts the project, and the other 50% is due at launch.',
  'Monthly plans bill on the 1st. Cancel anytime with 30 days’ notice.',
  'Every project includes a 30-day warranty. Bugs found in that time are fixed free.',
  'Rush delivery (about 50% faster) is available for 25% more, when the schedule allows.',
  'Startups and local nonprofits can ask about discounted pricing.',
];

export const usd = (n: number) => '$' + n.toLocaleString('en-US');

export const allTiers = priceLines.flatMap((l) => l.tiers.map((t) => ({ ...t, line: l.title })));
