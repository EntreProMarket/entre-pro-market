// pages/privacy.js
import LegalLayout from "../components/LegalLayout";

const SECTIONS = [
  {
    "h": "1. Who we are",
    "p": [
      "{{brand}} is operated by {{companyName}} (\"we\"). This policy explains what information we collect, how we use and share it, and the choices you have. Contact: {{legalEmail}}."
    ]
  },
  {
    "h": "2. Information we collect",
    "ul": [
      "Account information: name or business name, email address, password (stored securely by our authentication provider), account type and plan.",
      "Profile content you choose to post: logo, photos, videos, descriptions, links, location, tags, products, events and payment handles (such as CashApp or Venmo names) that you ask us to show buyers.",
      "Messages you send and receive on the Service, and reports you file.",
      "Order and payment records: what was bought, from whom, amounts and status. Card details are handled by Stripe; we do not store full card numbers.",
      "Uploaded files such as images, videos and proof-of-payment screenshots.",
      "Usage and device information: pages viewed, profile views, approximate time and device/browser type, and error logs.",
      "Information you send us through contact forms, email signups or support requests."
    ]
  },
  {
    "h": "3. How we use information",
    "ul": [
      "To provide and run the Service: accounts, profiles, marketplace listings, messaging, orders and plan features.",
      "To keep the Service safe: preventing fraud, spam, scams and abuse, enforcing our Terms, and reviewing reports and proofs of payment.",
      "To communicate with you about your account, purchases, security and updates, and (if you opt in) news and promotions.",
      "To improve and personalize the Service and understand how it is used.",
      "To comply with legal obligations."
    ]
  },
  {
    "h": "4. What is public and what is private",
    "p": [
      "Your profile, shop products, events, portfolio and anything else you publish is visible to other users and visitors, and may be found through search engines. Do not post information you want to keep private.",
      "Messages are visible only to the people in the conversation, and to our administrators and service providers when needed to run, secure or moderate the Service or to follow the law."
    ]
  },
  {
    "h": "5. How we share information",
    "p": [
      "We do not sell your personal information. We share it only:"
    ],
    "ul": [
      "With service providers that help us run the Service, for example database, authentication and file hosting, website hosting, payment processing (Stripe), email delivery and error monitoring. They may only use it to provide services to us.",
      "With other users, as described in section 4.",
      "When required by law, legal process, or to protect the rights, safety and property of users, the public or us.",
      "In connection with a business sale, merger or financing, with notice where required."
    ]
  },
  {
    "h": "6. Cookies, local storage and similar technology",
    "p": [
      "We use browser storage to keep you logged in, remember preferences, and save unfinished text as drafts on your device. Drafts are cleared when you log out or a different account logs in. You are automatically logged out after 30 minutes of inactivity. You can clear browser storage at any time in your browser settings."
    ]
  },
  {
    "h": "7. How long we keep information",
    "p": [
      "We keep information for as long as your account is active and as needed to provide the Service, resolve disputes, prevent fraud and meet legal, tax and accounting duties. When you delete your account we delete or de-identify your personal information, except what we must keep by law or for legitimate security and dispute purposes."
    ]
  },
  {
    "h": "8. Security",
    "p": [
      "We use reasonable technical and organizational measures to protect information, including access controls on our database. No system is perfectly secure, so we cannot guarantee absolute security. Use a strong, unique password."
    ]
  },
  {
    "h": "9. Your choices and rights",
    "ul": [
      "You can view and edit your profile and content in your account at any time.",
      "You can ask us to access, correct, export or delete your personal information by emailing {{legalEmail}}.",
      "You can opt out of marketing emails using the link in them.",
      "Depending on where you live (for example California), you may have additional rights, such as knowing what we collect, correcting or deleting it, and not being discriminated against for using these rights. We do not sell personal information or share it for cross-context behavioral advertising."
    ]
  },
  {
    "h": "10. Children",
    "p": [
      "The Service is for people 18 and older. We do not knowingly collect information from anyone under 18. If you believe a child has given us information, contact us and we will delete it."
    ]
  },
  {
    "h": "11. International users",
    "p": [
      "We operate in the United States. If you use the Service from another country, your information will be processed in the United States, where privacy laws may differ from yours."
    ]
  },
  {
    "h": "12. Changes to this policy",
    "p": [
      "We may update this policy. We will post the new version with a new effective date and notify you of material changes in the app or by email."
    ]
  },
  {
    "h": "13. Contact us",
    "ul": [
      "{{companyName}}, {{address}}",
      "Privacy questions and requests: {{legalEmail}}",
      "General support: {{email}}  ·  Phone: {{phone}}"
    ]
  }
];

export default function Page() {
  return <LegalLayout title={"Privacy Policy"} intro={"This policy explains what information {{brand}} collects and how it is used. [DRAFT \u2014 to be reviewed by a licensed attorney before launch.]"} sections={SECTIONS} />;
}
