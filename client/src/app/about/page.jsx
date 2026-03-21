import Link from "next/link";

export const metadata = {
  title: "About Us | Neplance",
  description:
    "Learn about Neplance, our mission, and how we connect clients and freelancers.",
};

export default function AboutPage() {
  return (
    <main className="section">
      <div className="container about-page-wrap">
        <section className="about-hero card-static">
          <span className="badge badge-success">ABOUT NEPLANCE</span>
          <h1>Built to connect Nepalese talent with global opportunities</h1>
          <p>
            Neplance is a freelancing marketplace focused on trust, quality, and
            transparent collaboration. We help clients find skilled
            professionals and help freelancers grow sustainable careers.
          </p>
          <div className="about-hero-cta">
            <Link href="/signup" className="btn btn-primary">
              Join Neplance
            </Link>
            <Link href="/contact" className="btn btn-secondary">
              Contact Us
            </Link>
          </div>
        </section>

        <section className="grid grid-cols-3 about-stat-grid">
          <article className="card-static about-stat-card">
            <h3>10K+</h3>
            <p>Active freelancers across Nepal and beyond</p>
          </article>
          <article className="card-static about-stat-card">
            <h3>5K+</h3>
            <p>Projects delivered with client-first quality</p>
          </article>
          <article className="card-static about-stat-card">
            <h3>98%</h3>
            <p>Reported client satisfaction on completed work</p>
          </article>
        </section>

        <section className="grid grid-cols-2 about-story-grid">
          <article className="card-static about-story-card">
            <h2>Our mission</h2>
            <p>
              Empower every freelancer to find meaningful work and every client
              to build confidently with verified, high-quality talent.
            </p>
          </article>
          <article className="card-static about-story-card">
            <h2>Our vision</h2>
            <p>
              Become the most trusted work marketplace for Nepal, where remote
              collaboration feels simple, secure, and rewarding for everyone.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
