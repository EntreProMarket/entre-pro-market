// pages/community-guidelines.js
import LegalLayout from "../components/LegalLayout";

const SECTIONS = [
  {
    "h": "Our community",
    "p": [
      "{{brand}} exists so vendors and event organizers can find each other and do real business. These guidelines keep it useful and safe. Breaking them can lead to removed content, limited features, or a suspended account."
    ]
  },
  {
    "h": "1. Be honest and professional",
    "ul": [
      "Use your real business name and accurate descriptions, photos and prices.",
      "One account per business. No duplicate, look-alike or impersonating accounts or handles.",
      "Only post things you have the right to post."
    ]
  },
  {
    "h": "2. No spam, scams or pressure",
    "ul": [
      "Don't send bulk, repetitive or unwanted messages, or messages that pressure someone to pay.",
      "Don't ask for payment up front for things you can't deliver, and don't post fake events, products or reviews.",
      "Never ask someone to move to another site or app to avoid the rules of {{brand}}."
    ]
  },
  {
    "h": "3. Links, emails and phone numbers",
    "ul": [
      "Links, email addresses and phone numbers are only allowed in messages between two paid accounts, and in shop product descriptions on paid plans.",
      "Everywhere else they are erased automatically. They cannot be sent to or from Free accounts.",
      "Each link in a message counts toward a plan's monthly contact limit.",
      "After a purchase, the buyer and seller can share contact details about that order for {{purchaseDays}} days."
    ]
  },
  {
    "h": "4. Respect each other",
    "ul": [
      "No harassment, bullying, threats, hate speech or discrimination.",
      "No sexually explicit, violent or graphic content.",
      "Keep disagreements about orders respectful and use the report button instead of retaliating."
    ]
  },
  {
    "h": "5. Sell and host safely and legally",
    "ul": [
      "Follow the laws that apply to what you sell or host, including licenses, permits, taxes, age limits (like alcohol) and product safety.",
      "No illegal, counterfeit, stolen or dangerous items or services."
    ]
  },
  {
    "h": "6. Reporting and enforcement",
    "p": [
      "Use the report button on a message or profile. We review reports and may remove content, limit features, suspend or permanently remove accounts. Serious violations may be reported to the authorities. Decisions are at our discretion. Questions: {{email}}."
    ]
  }
];

export default function Page() {
  return <LegalLayout title="Community Guidelines" intro=null sections={SECTIONS} />;
}
