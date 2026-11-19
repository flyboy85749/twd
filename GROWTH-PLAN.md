# Tucson Web Development: what to add to win real customers

The rebuilt site has a strong base: clear pricing, a fast Astro build, LocalBusiness schema, a working contact form, free-audit offers, and a sitemap. What it lacks now is **proof** (that real local businesses hired you and got results) and **reach** (ways for the right people to find it). The list below is ranked by how much each item should help, compared with how much work it takes.

---

## Priority 1: Proof (do these first)

### 1. Get 2–3 real local case studies
Right now the Work page is mostly concept, pre-launch, or personal projects (Sonoran HVAC is a demo; Bark Dating and iChef are pre-launch; The Freed Mouse is a personal blog). A contractor or restaurant owner scrolling it will ask, "Has he done this for a business like mine?"

- Offer 2–3 Tucson businesses a steep discount, or a free Starter site or automation, in exchange for a written case study, a review, and permission to use their name and logo.
- Good targets: a trades business (HVAC, plumbing, roofing), a restaurant or food truck, and a salon or wellness business. They match your homepage pitch.
- Write each one up as **problem, what you built, result**, with a number if you can get one: "Quote requests went from 3 to 11 a month," "Missed-call text-back recovered 6 leads in the first month."
- Add a `results` field to the `work` content collection and show it on `WorkCard`.

### 2. Real reviews, with full names and businesses
The site has two testimonials, signed "Cathy L." and "Dennis S." Initials without a business name read as unverifiable.

- Ask past clients for **Google reviews** (these also help your local search ranking).
- Update `src/data/testimonials.ts` to include business name, role, and a photo or logo where allowed.
- Add `Review`/`AggregateRating` schema once you have 5 or more real Google reviews. Don't mark up reviews that aren't also public.

### 3. Put your face on the site
"Someone you can actually meet" is your best differentiator, but there is no photo of you anywhere. Add:

- A friendly, professional headshot on the About page and in the homepage "local" section.
- Optionally, a 60-second video intro ("Hi, I'm Bill…") on the About or Contact page.

### 4. Use your own products on your own site
You sell chatbots and missed-call text-back, but the site doesn't use either. This is the easiest proof you can get.

- Add your own AI chatbot to the site, trained on your pricing and services, with a small label: "This assistant is the Starter chatbot package."
- Set up missed-call text-back on your 520 number and say so on the Contact page: "Call and I miss it? You'll get a text within a minute. That's the same system I set up for clients."
- Make the contact form trigger your own instant auto-reply email and text. Mention it: "Submit this and watch how fast the reply comes."

---

## Priority 2: Make it easy to say yes

### 5. Online booking for the free call
Add a Calendly or Cal.com link ("Book a 30-minute call") next to "Start your project." Many owners would rather pick a time than write a message.

### 6. Make the free audit concrete
"Free website audit" is vague. Spell out what they get:

- "A 1-page report plus a 10-minute screen-recorded video covering speed, mobile, Google visibility, and the three changes that would bring in the most calls."
- Add a short form on its own page (`/audit/`) that only asks for a URL, a name, and an email. This page is also your best cold-outreach link (see #13).

### 7. A risk-reversal promise
Add a plain guarantee to the pricing page and homepage, for example: "If you're not happy with the first design draft, you can walk away and I'll refund your deposit." Pick something you can actually honor.

### 8. FAQ page with schema
Answer what owners actually ask: Do I own the site? What if I already have a domain? Can you fix my existing WordPress site? Do you do Spanish? What happens if you get hit by a bus? Add `FAQPage` schema. This also feeds AI search answers.

### 9. Add analytics and conversion tracking
There is no analytics on the site, so you won't know what's working.

- Add a privacy-friendly tool (Plausible, Fathom, or Cloudflare Web Analytics) and update the privacy policy.
- Track: contact form submissions (`/thanks/` views), phone link clicks, audit requests, and booking clicks.
- Add a "How did you hear about me?" dropdown to the contact form.

---

## Priority 3: Get found in Tucson

### 10. Google Business Profile (the single biggest local lever)
- Claim and fully complete the profile: category "Website designer," service area (Tucson, Oro Valley, Marana, Vail, Sahuarita), hours, services with prices, and photos.
- Post weekly (a project, a tip, a blog link).
- Ask every client for a review. Aim for 10 or more.
- Note: your address is listed on the site. If it's a home address, set the profile to "service-area business" and hide the address, and consider removing the street from the schema and footer too.

### 11. Industry and area landing pages
Create focused pages that match what people search:

- **By industry:** "Websites for Tucson contractors," "…for restaurants," "…for salons," "…for HVAC companies." Each one should cover the specific features that industry needs (click-to-call, menus, booking), with a matching case study.
- **By area:** Oro Valley, Marana, and Vail pages. Only make these if each page has genuinely local content, not copy-paste with the town name swapped.

### 12. Citations and directories
List the business with consistent name, address, and phone on: Yelp, Bing Places, Apple Business Connect, BBB, Nextdoor Business, the Tucson Metro Chamber, Clutch, and UpCity. These help both Google and AI assistants find you.

### 13. More blog posts, aimed at buyers
Three posts is a good start. Aim for two a month, each answering a question an owner types into Google before hiring someone:

- "How much does a website cost in Tucson?" (done)
- "Wix vs. Squarespace vs. a custom site for a small business"
- "Do I need a chatbot? An honest answer for Tucson small businesses"
- "How a missed-call text-back works (and what it costs)"
- "Five things every contractor website needs"
- "How to move your site off GoDaddy without losing your Google ranking"

End each post with a link to the free audit.

---

## Priority 4: Go get customers (off the site)

The website converts visitors, but early on most customers come from outreach and relationships.

14. **Audit-first outreach.** Find Tucson businesses with slow, broken, or non-mobile sites (or none). Record a short Loom video of their site with two or three fixes and send it with a link to `/audit/`. Personalized and useful beats a generic pitch.
15. **Referral partners.** Bookkeepers, insurance agents, sign and print shops, commercial photographers, and marketing consultants all talk to small business owners who need websites. Offer a referral fee (for example, 10%).
16. **Client referral reward.** Give existing clients a free month of care or a $100 credit for each referral that signs.
17. **Local networking.** Tucson Metro Chamber, BNI chapters, Startup Tucson, SBDC workshops, and Pima County small business events. Offer to give a free talk: "How to get more calls from your website."
18. **Nonprofit work.** Your pricing already mentions nonprofit discounts. One or two discounted nonprofit sites bring goodwill, a portfolio piece, and board members who own businesses.
19. **Win back old clients.** You've been doing this since 2007. Email past clients about the new chatbot and automation services. They already trust you.

---

## Smaller fixes worth doing

- **Spanish.** A large share of Tucson businesses serve Spanish-speaking customers. A short Spanish-language services page (or a "Hablo español" note, if true) could set you apart.
- **Pricing page:** add a "most popular" badge on the Standard tier and a short line about payment options.
- **Contact page:** show a reply-time promise near the top, and offer a text option ("Text me at…").
- **Social proof bar:** small strip of client logos under the hero, once you have them.
- **Email newsletter / lead magnet:** a free "Google Business Profile checklist" PDF (you already have the blog post) in exchange for an email address, followed by a short automated email series. This is also a live demo of your automation service.
- **Sister site link:** keep it, but make sure both sites have distinct audiences so they don't compete for the same searches.

---

## Suggested order for the next 30 days

| Week | Focus |
|------|-------|
| 1 | Headshot on site, Google Business Profile complete, analytics installed, booking link added |
| 2 | Chatbot and missed-call text-back live on your own site; `/audit/` page launched |
| 3 | Land 2–3 discounted pilot clients for case studies; ask past clients for Google reviews |
| 4 | First industry landing page (contractors), two new blog posts, start audit-first outreach (5 per week) |

**The short version:** the site already looks credible. What turns it into a customer magnet is real local proof (case studies, reviews, your face, your own tools running on it) plus steady outreach while that proof builds up.
