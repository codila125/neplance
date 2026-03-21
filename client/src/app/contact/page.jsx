export const metadata = {
  title: "Contact Us | Neplance",
  description:
    "Get in touch with the Neplance team for support, partnerships, and general inquiries.",
};

const contactItems = [
  {
    label: "WhatsApp",
    value: "+977 98123 45678",
    href: "https://wa.me/9779812345678",
    note: "Mon-Sat, 9:00 AM - 6:00 PM NPT",
  },
  {
    label: "Support Email",
    value: "support@neplance.com",
    href: "mailto:support@neplance.com",
    note: "General account and platform support",
  },
  {
    label: "Partnership Email",
    value: "partnerships@neplance.com",
    href: "mailto:partnerships@neplance.com",
    note: "Collaboration and business partnerships",
  },
  {
    label: "Phone",
    value: "+977 01 4789123",
    href: "tel:+977014789123",
    note: "Office line for urgent queries",
  },
  {
    label: "LinkedIn",
    value: "linkedin.com/company/neplance",
    href: "https://linkedin.com/company/neplance",
    note: "Follow announcements and updates",
  },
  {
    label: "Office",
    value: "Baneshwor, Kathmandu, Nepal",
    href: "https://maps.google.com/?q=Baneshwor,Kathmandu,Nepal",
    note: "By appointment only",
  },
];

export default function ContactPage() {
  return (
    <main className="section">
      <div className="container contact-page-wrap">
        <section className="contact-hero card-static">
          <span className="badge badge-success">CONTACT NEPLANCE</span>
          <h1>We are here to help you</h1>
          <p>
            Reach out to our team for support, business partnerships, or any
            question about hiring and freelancing on Neplance.
          </p>
        </section>

        <section className="grid grid-cols-2 contact-grid">
          {contactItems.map((item) => (
            <article className="card-static contact-card" key={item.label}>
              <div className="contact-card-label">{item.label}</div>
              <a href={item.href} className="contact-card-value">
                {item.value}
              </a>
              <p className="contact-card-note">{item.note}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
