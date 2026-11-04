// lib/linkRules.js
// One place for the app's rules about links and phone numbers in text.
//
//  • Paid accounts (Premium, Featured, Pro, Elite — and the admin) can use clickable links, either as a
//    plain web address or as "descriptive text" written [Text to show](https://address).
//  • Free accounts (Free vendors, Basic organizers) can't use links or phone numbers in any text field —
//    they are erased automatically and never saved.
//  • Nobody can send links or phone numbers to a free account in messages either (the admin and a buyer /
//    seller with a recent purchase between them are the exceptions).
//  • On plans with a monthly contact limit, every link sent in a message counts as 1 extra contact.

export const PAID_TIERS = ["premium", "featured", "pro", "elite"];
export const PURCHASE_CONTACT_DAYS = 30; // how long a purchase lets the buyer and seller share contact info

export const isPaidAccount = (p) => !!p && (!!p.is_admin || PAID_TIERS.includes(p.account_type));

const MD_LINK_SRC = "\\[([^\\]]*)\\]\\(\\s*((?:https?:\\/\\/|mailto:|www\\.)[^)\\s]+)\\s*\\)";
const BARE_URL_SRC = "(?:https?:\\/\\/|www\\.)[^\\s<>()\\[\\]]+";
const DOMAIN_SRC = "\\b(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\\.)+(?:com|net|org|io|co|us|app|shop|store|me|biz|info|ly|gl|be|link|site|online|xyz|live|tv|ca|uk|edu|gov)\\b(?:\\/[^\\s<>()\\[\\]]*)?";
const PHONE_SRC = "(?:\\+?\\d{1,3}[\\s.-]?)?(?:\\(\\d{3}\\)|\\d{3})[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b";

// Every link in the text, in order: [{ start, end, label, url }]
export function findLinks(text) {
  const t = text || "";
  const found = [];
  const taken = [];
  const free = (s, e) => !taken.some(([a, b]) => s < b && e > a);
  const add = (s, e, label, url) => { if (free(s, e)) { taken.push([s, e]); found.push({ start: s, end: e, label, url }); } };
  let m;
  const md = new RegExp(MD_LINK_SRC, "gi");
  while ((m = md.exec(t))) add(m.index, m.index + m[0].length, m[1], m[2]);
  const bare = new RegExp(BARE_URL_SRC, "gi");
  while ((m = bare.exec(t))) {
    const raw = m[0].replace(/[.,;:!?'"]+$/, "");
    add(m.index, m.index + raw.length, raw, raw);
  }
  const dom = new RegExp(DOMAIN_SRC, "gi");
  while ((m = dom.exec(t))) {
    if (t[m.index - 1] === "@") continue; // that's an email address, not a web link
    const raw = m[0].replace(/[.,;:!?'"]+$/, "");
    add(m.index, m.index + raw.length, raw, raw);
  }
  return found.sort((a, b) => a.start - b.start);
}

export const hasLink = (text) => findLinks(text).length > 0;
export const countLinks = (text) => findLinks(text).length;

export function findPhones(text) {
  const t = text || "";
  const out = [];
  const re = new RegExp(PHONE_SRC, "g");
  let m;
  while ((m = re.exec(t))) out.push({ start: m.index, end: m.index + m[0].length });
  return out;
}
export const hasPhone = (text) => findPhones(text).length > 0;

function removeRanges(text, ranges) {
  let out = text;
  [...ranges].sort((a, b) => b.start - a.start).forEach((r) => { out = out.slice(0, r.start) + out.slice(r.end); });
  return out.replace(/[ \t]{2,}/g, " ");
}
export const stripLinks = (text) => removeRanges(text || "", findLinks(text));
export const stripPhones = (text) => removeRanges(text || "", findPhones(text));
export const stripLinksAndPhones = (text) => stripPhones(stripLinks(text));

// [Text](https://address)  ->  Text      (used for previews and plain-text spots)
export const markdownToPlain = (text) => (text || "").replace(new RegExp(MD_LINK_SRC, "gi"), "$1");

// Make an address safe + complete. Returns "" if it isn't a normal web / email address.
export function safeHref(url) {
  let u = (url || "").trim();
  if (!u) return "";
  if (/^mailto:/i.test(u)) return u;
  if (!/^https?:\/\//i.test(u)) u = "https://" + u.replace(/^\/+/, "");
  try {
    const parsed = new URL(u);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed.href : "";
  } catch (e) { return ""; }
}

// What the "Add link" button writes into the text.
export function buildMarkdownLink(label, url) {
  const href = safeHref(url);
  if (!href) return "";
  const cleanLabel = (label || "").replace(/[\[\]]/g, "").trim() || href.replace(/^https?:\/\//i, "").replace(/\/$/, "");
  return `[${cleanLabel}](${href.replace(/\)/g, "%29")})`;
}

// Cut text into plain pieces and clickable-link pieces for display.
export function toSegments(text, allowLinks) {
  const t = text || "";
  if (!allowLinks) return [{ type: "text", text: stripLinksAndPhones(t) }];
  const links = findLinks(t);
  const segs = [];
  let pos = 0;
  links.forEach((l) => {
    const href = safeHref(l.url);
    if (!href) return;
    if (l.start > pos) segs.push({ type: "text", text: t.slice(pos, l.start) });
    segs.push({ type: "link", text: l.label || l.url, url: href });
    pos = l.end;
  });
  if (pos < t.length) segs.push({ type: "text", text: t.slice(pos) });
  return segs.length ? segs : [{ type: "text", text: t }];
}

// Who may exchange links / phone numbers in a message?
export function canShareContactInfo(sender, recipient, purchaseOk) {
  if (sender && sender.is_admin) return true;
  if (purchaseOk) return true;
  return isPaidAccount(sender) && isPaidAccount(recipient);
}

// Clean every text value in an object for a free account (used just before saving).
export function cleanFields(obj, keys, isPaid) {
  if (isPaid) return obj;
  const out = { ...obj };
  keys.forEach((k) => { if (typeof out[k] === "string") out[k] = stripLinksAndPhones(out[k]); });
  return out;
}
