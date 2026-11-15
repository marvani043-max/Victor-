import { site } from "./site";

// Every answer here restates the published Peak Side shipping & returns policy
// or a product-page fit note. Nothing is assumed beyond those sources.
export const FAQ: { q: string; a: string }[] = [
  {
    q: "How long until my order ships?",
    a: `Orders are typically processed within ${site.policies.processing}. Once your order ships you'll get an email with tracking. Delivery time after that depends on your location and the shipping method you choose at checkout.`,
  },
  {
    q: "Is there free shipping?",
    a: `Yes. Use code ${site.promo.code} at checkout for free shipping.`,
  },
  {
    q: "Can I return or exchange something?",
    a: `Yes, within ${site.policies.returnWindow} of delivery. Items need to be unworn, unwashed, in original condition and with the original tags attached. Sale and final-sale items can't be returned or exchanged.`,
  },
  {
    q: "Who pays for return shipping?",
    a: "Return shipping is paid by the customer, unless the item arrived damaged or defective, or we sent the wrong item.",
  },
  {
    q: "My item arrived damaged or it's the wrong one. What do I do?",
    a: `Email us within ${site.policies.damageWindow} of delivery with your order number and photos of the item, and we'll sort it out.`,
  },
  {
    q: "My package says delivered but I can't find it.",
    a: "Please contact the shipping carrier first. If you still need help after that, email us with your order number.",
  },
  {
    q: "How do the crop tops and boxy tees fit?",
    a: "The off-shoulder crop tops run roomy, so we recommend sizing down. The boxy Summer Edition tees are the same design as the regular tees with a boxier cut, so stay true to size.",
  },
  {
    q: "Can I pay in instalments?",
    a: "Yes. PayPal Pay in 4 (four interest-free payments) is available at checkout.",
  },
  {
    q: "How do I start a return or exchange?",
    a: `Email ${site.email} with your order number and what you'd like to do. Refunds go back to your original payment method once your return is received and approved.`,
  },
];
