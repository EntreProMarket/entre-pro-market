// pages/terms.js
import LegalLayout from "../components/LegalLayout";

const SECTIONS = [
  {
    "h": "1. Agreement to these Terms",
    "p": [
      "These Terms of Service (the \"Terms\") are a binding agreement between you and {{companyName}}, a {{entityType}} (\"we\", \"us\", \"our\"), the operator of {{brand}} at {{siteUrl}} and any related apps and services (the \"Service\").",
      "By creating an account, using the Service, or clicking \"I agree\", you accept these Terms, our Privacy Policy, our Community Guidelines and our Payments & Refunds Policy. If you do not agree, do not use the Service."
    ]
  },
  {
    "h": "2. Who can use {{brand}}",
    "ul": [
      "You must be at least 18 years old and able to form a binding contract.",
      "You must give accurate information and keep it up to date.",
      "You may create one account per business or organization. Creating duplicate, look-alike or misleading accounts or handles is not allowed.",
      "You are responsible for keeping your password secure and for everything done through your account. Tell us right away if you think your account was accessed without permission."
    ]
  },
  {
    "h": "3. What the Service is",
    "p": [
      "{{brand}} is an online marketplace and networking platform that connects vendors, makers and service providers with event organizers, and lets visitors discover vendors, events and products.",
      "We are a platform only. We are not a party to any deal, sale, booking or agreement between users, and we do not employ, endorse, vet or guarantee any vendor, organizer, product, service or event. You deal with other users at your own risk."
    ]
  },
  {
    "h": "4. Accounts, plans and fees",
    "p": [
      "The Service offers a Free vendor account, paid vendor plans (Premium and Featured) and organizer plans (Basic, Pro and Elite). The features, limits and prices of each plan are shown on our plan pages and may change.",
      "Paid plans renew until cancelled. Card payments for plans are processed by Stripe. You can cancel or downgrade at any time; unless the law requires otherwise, fees already paid are not refunded for the current billing period.",
      "Promotional, trial or free-access periods can be granted, changed or ended by us at any time. When a promotion ends or an account is moved to a lower plan, the features of that plan stop working, and content that is no longer allowed on the lower plan may be hidden or removed.",
      "We may change plan features, limits and prices. If a change materially affects a paid plan, we will give notice before it applies to you."
    ]
  },
  {
    "h": "5. Messaging, contact limits, links and phone numbers",
    "p": [
      "To protect users and the platform, the following rules apply and are enforced automatically:"
    ],
    "ul": [
      "Some plans have a monthly contact limit. Each message you send uses 1 contact, and each link inside a message uses 1 additional contact.",
      "Web links, email addresses and phone numbers are only allowed in messages between two paid accounts, and in shop product descriptions on paid plans. Elsewhere they are removed automatically and are not saved or sent.",
      "Links, email addresses and phone numbers cannot be sent to or from a Free account. The exception is a buyer and seller who have a recent paid order with each other, who may share contact details for that order for a limited time (currently {{purchaseDays}} days).",
      "You may not try to get around these rules, for example by writing out a phone number or address in a disguised way to take a conversation off the platform in order to avoid plan limits."
    ]
  },
  {
    "h": "6. Your content",
    "p": [
      "You keep ownership of the text, photos, videos, logos and other material you post (\"Your Content\"). You give us a worldwide, non-exclusive, royalty-free license to host, store, display, reproduce, resize, crop and distribute Your Content on and in connection with the Service and in our promotion of the Service.",
      "You promise that you own or have permission to use Your Content, that it is accurate and not misleading, and that it does not break the law or anyone else's rights. You are fully responsible for Your Content.",
      "We may review, remove or restrict any content or account at our discretion, including content reported by other users."
    ]
  },
  {
    "h": "7. Prohibited conduct",
    "p": [
      "You agree not to:"
    ],
    "ul": [
      "Break any law or sell anything illegal, counterfeit, stolen, unsafe or that you are not permitted to sell.",
      "Post false, misleading, harassing, hateful, sexually explicit, violent or infringing content.",
      "Send spam, scams, phishing or unwanted promotions, or pressure other users.",
      "Impersonate a person or business, or create look-alike accounts, names or handles.",
      "Use bots, scrapers or other automated means to collect data, or copy the Service.",
      "Probe, attack, overload or try to gain unauthorized access to the Service, other accounts or our systems, or change your own plan or admin status other than through the Service.",
      "Use the Service to take payments or deals off the platform in a way that avoids plan limits or these Terms."
    ]
  },
  {
    "h": "8. Buying and selling",
    "p": [
      "Sales and bookings are between the buyer and the seller. Some sales are paid by card through Stripe. Others are paid directly between users (for example CashApp or Venmo). We do not hold, guarantee or insure payments sent directly between users, and we cannot reverse them.",
      "Sellers and organizers are solely responsible for their products, services and events, including accuracy of descriptions and prices, delivery, refunds, taxes, licenses and permits, product safety, age restrictions (for example alcohol), insurance and compliance with all laws.",
      "Buyers should confirm details with the seller before paying and should use protected payment methods when available. See our Payments & Refunds Policy."
    ]
  },
  {
    "h": "9. Reviews and reports",
    "p": [
      "Reviews on shop products require a verified purchase. For sales marked as paid by the seller outside card checkout, we may review the proof of payment, and a review may be removed if the proof is rejected.",
      "You can report content or users. We may investigate and take action but are not obligated to act on every report."
    ]
  },
  {
    "h": "10. Our property and copyright",
    "p": [
      "The Service, including its design, software, logos and brand, belongs to us or our licensors and is protected by law. You may not copy or reuse it without our written permission.",
      "If you believe content on the Service infringes your copyright, send a notice with your contact details, a description of the work and the infringing material, a statement of good faith belief, and a statement under penalty of perjury that you are the owner or authorized, to our copyright contact: {{dmcaEmail}}."
    ]
  },
  {
    "h": "11. Third-party services and links",
    "p": [
      "The Service relies on third parties (for example Stripe for card payments and cloud hosting providers). Links to other websites are provided by users and are not controlled or endorsed by us. We are not responsible for third-party services, websites, or content."
    ]
  },
  {
    "h": "12. Disclaimers",
    "p": [
      "The Service is provided \"as is\" and \"as available\" without warranties of any kind, express or implied, including merchantability, fitness for a particular purpose and non-infringement. We do not promise the Service will be uninterrupted, error-free or secure, or that users, products, services or events are accurate, safe or legal."
    ]
  },
  {
    "h": "13. Limitation of liability",
    "p": [
      "To the fullest extent allowed by law, we are not liable for indirect, incidental, special, consequential or punitive damages, or for lost profits, revenue, data or goodwill, or for any dispute between users.",
      "Our total liability for any claim relating to the Service is limited to the greater of (a) the amount you paid us in the 12 months before the claim or (b) $100. Some places do not allow these limits, so they may not fully apply to you."
    ]
  },
  {
    "h": "14. Indemnification",
    "p": [
      "You agree to defend and indemnify us and our owners, officers, employees and agents against claims, damages, losses and costs (including reasonable attorneys' fees) arising from Your Content, your use of the Service, your dealings with other users, or your breach of these Terms or the law."
    ]
  },
  {
    "h": "15. Suspension and termination",
    "p": [
      "You may stop using the Service and request deletion of your account at any time. We may suspend or end your access immediately, with or without notice, if we believe you broke these Terms, created risk or harm, or for legal reasons. Sections that by their nature should survive termination will continue to apply."
    ]
  },
  {
    "h": "16. Governing law and disputes",
    "p": [
      "These Terms are governed by the laws of the State of {{governingState}}, without regard to conflict-of-law rules. Any dispute that cannot be resolved informally will be brought in the state or federal courts located in {{governingCounty}}, and you consent to that jurisdiction, unless your local law gives you the right to bring a claim elsewhere.",
      "[ATTORNEY NOTE: Decide with your lawyer whether to add binding arbitration and a class-action waiver here.]"
    ]
  },
  {
    "h": "17. Changes to these Terms",
    "p": [
      "We may update these Terms. We will post the new version with a new effective date, and for material changes we will notify you in the app or by email. Continuing to use the Service after a change means you accept it."
    ]
  },
  {
    "h": "18. Contact us (legal business contact)",
    "ul": [
      "Business: {{companyName}} ({{entityType}})",
      "Mailing address: {{address}}",
      "General and support email: {{email}}",
      "Legal notices email: {{legalEmail}}",
      "Phone: {{phone}}",
      "Copyright (DMCA) notices: {{dmcaEmail}}"
    ]
  }
];

export default function Page() {
  return <LegalLayout title={"Terms of Service"} intro={"Please read these Terms carefully. They explain your rights and responsibilities when you use {{brand}}. [DRAFT \u2014 to be reviewed by a licensed attorney before launch.]"} sections={SECTIONS} />;
}
