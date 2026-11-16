// pages/payments-policy.js
import LegalLayout from "../components/LegalLayout";

const SECTIONS = [
  {
    "h": "How payments work",
    "p": [
      "Money is exchanged between buyers and sellers. {{brand}} is not a bank or payment provider for sales between users, and we are not a party to a purchase or booking."
    ]
  },
  {
    "h": "1. Card or Google Pay checkout",
    "ul": [
      "Card payments are processed securely by Stripe. We do not store your full card number.",
      "The seller is responsible for fulfilling the order and for refunds and returns, following their own stated policy and applicable law.",
      "Contact the seller first. If a seller does not respond, contact {{email}} and include your order details."
    ]
  },
  {
    "h": "2. Paying a seller directly (CashApp, Venmo, etc.)",
    "ul": [
      "Some sellers accept payment directly using handles shown on their shop. These payments are between you and the seller, are not processed or protected by {{brand}}, and usually cannot be reversed.",
      "Only pay sellers you trust, confirm what you are buying, and keep your payment receipt.",
      "After you pay, the seller can mark the sale as paid and upload proof. That gives you access to leave a review, subject to our review of the proof."
    ]
  },
  {
    "h": "3. Refunds and disputes between users",
    "ul": [
      "Refunds, exchanges and cancellations are decided by the seller or organizer and are governed by their policy and the law.",
      "Sellers and organizers must describe items, services and events honestly and honor their stated policies.",
      "We can help mediate and may remove listings or accounts that repeatedly cause unresolved disputes, but we cannot guarantee a refund."
    ]
  },
  {
    "h": "4. Plans and subscriptions",
    "ul": [
      "Paid vendor and organizer plans renew until cancelled and are billed by Stripe.",
      "You can cancel or downgrade at any time. Fees already paid for the current period are non-refundable unless the law requires otherwise or we state otherwise.",
      "If your plan ends, features of higher plans stop working."
    ]
  },
  {
    "h": "5. Taxes",
    "p": [
      "Sellers and organizers are responsible for collecting and paying any taxes that apply to their sales and events. Prices shown are set by the seller."
    ]
  },
  {
    "h": "6. Contact",
    "p": [
      "Payment questions: {{email}}  ·  {{companyName}}, {{address}}  ·  {{phone}}"
    ]
  }
];

export default function Page() {
  return <LegalLayout title={"Payments & Refunds Policy"} intro={"How payments, refunds and disputes work on {{brand}}. [DRAFT \u2014 to be reviewed by a licensed attorney before launch.]"} sections={SECTIONS} />;
}
