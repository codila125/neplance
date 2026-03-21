export const HeroSection = () => (
  <div className="hero">
    <div className="hero-backdrop" />
    <div className="hero-content container">
      <h1 className="hero-title text-black">
        How the world <span className="highlight">works</span>
      </h1>
      <p className="hero-subtitle">
        Connect with world-class talent or find your next opportunity on the
        leading work marketplace designed for Nepal and beyond.
      </p>
      <div className="hero-cta">
        <a href="#hire-talent" className="btn btn-primary btn-lg">
          Hire a Freelancer
        </a>
        <a href="#find-opportunities" className="btn btn-secondary btn-lg">
          Find Work
        </a>
      </div>
      <div className="hero-stats">
        <div className="hero-stat">
          <span className="hero-stat-value">10K+</span>
          <span className="hero-stat-label">Active Freelancers</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">5K+</span>
          <span className="hero-stat-label">Projects Completed</span>
        </div>
        <div className="hero-stat">
          <span className="hero-stat-value">98%</span>
          <span className="hero-stat-label">Client Satisfaction</span>
        </div>
      </div>
    </div>
  </div>
);

// How It Works Section
export const HowItWorksSection = () => {
  const steps = [
    {
      number: "1",
      title: "Post your job",
      description: "Tell us what you need. It's free and takes just minutes",
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Post your job</title>
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      ),
    },
    {
      number: "2",
      title: "Review proposals",
      description:
        "Get qualified proposals within 24 hours from talented freelancers",
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Review proposals</title>
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      number: "3",
      title: "Start working",
      description: "Hire the best fit and collaborate on our secure platform",
      icon: (
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Start working</title>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
    },
  ];

  return (
    <section className="section" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-14)" }}>
          <h2
            style={{
              marginBottom: "var(--space-4)",
              fontSize: "var(--text-4xl)",
            }}
          >
            How Neplance works
          </h2>
          <p
            className="text-secondary"
            style={{
              fontSize: "var(--text-lg)",
              maxWidth: "560px",
              margin: "0 auto",
            }}
          >
            Getting started is simple and only takes a few minutes
          </p>
        </div>
        <div className="grid grid-cols-3" style={{ gap: "var(--space-8)" }}>
          {steps.map((step, index) => (
            <div
              key={step.title}
              className="card-static"
              style={{
                textAlign: "center",
                position: "relative",
                animationDelay: `${index * 150}ms`,
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  borderRadius: "var(--radius-xl)",
                  background:
                    "linear-gradient(135deg, var(--color-primary-lightest) 0%, var(--color-primary-100) 100%)",
                  color: "var(--color-primary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto var(--space-5)",
                  position: "relative",
                }}
              >
                {step.icon}
                <div
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "var(--color-primary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "var(--text-sm)",
                    fontWeight: "var(--font-weight-bold)",
                  }}
                >
                  {step.number}
                </div>
              </div>
              <h3
                style={{
                  marginBottom: "var(--space-3)",
                  fontSize: "var(--text-xl)",
                }}
              >
                {step.title}
              </h3>
              <p className="text-secondary">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Testimonials Section
export const TestimonialsSection = () => {
  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Marketing Director",
      company: "TechCorp",
      content:
        "Neplance helped us find the perfect developer for our project. The quality of talent is exceptional.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Freelance Designer",
      company: "Independent",
      content:
        "I've been able to grow my freelance business significantly through Neplance. Great clients, fair payments.",
      rating: 5,
    },
    {
      name: "Emily Rodriguez",
      role: "CEO",
      company: "StartupXYZ",
      content:
        "The platform makes it easy to manage projects and communicate with freelancers. Highly recommended!",
      rating: 5,
    },
  ];

  return (
    <section
      className="section"
      style={{ backgroundColor: "var(--color-bg-page)" }}
    >
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-14)" }}>
          <h2
            style={{
              marginBottom: "var(--space-4)",
              fontSize: "var(--text-4xl)",
            }}
          >
            Trusted by thousands worldwide
          </h2>
          <p className="text-secondary" style={{ fontSize: "var(--text-lg)" }}>
            See what our community has to say
          </p>
        </div>
        <div className="grid grid-cols-3" style={{ gap: "var(--space-6)" }}>
          {testimonials.map((testimonial) => (
            <div
              key={`${testimonial.name}-${testimonial.company}`}
              className="card"
              style={{ height: "100%" }}
            >
              <div
                style={{
                  marginBottom: "var(--space-5)",
                  color: "var(--color-warning)",
                  fontSize: "var(--text-lg)",
                  letterSpacing: "2px",
                }}
              >
                {"★".repeat(testimonial.rating)}
              </div>
              <p
                className="text-secondary"
                style={{
                  marginBottom: "var(--space-5)",
                  fontStyle: "italic",
                  lineHeight: 1.7,
                }}
              >
                "{testimonial.content}"
              </p>
              <div
                style={{
                  paddingTop: "var(--space-5)",
                  borderTop: "1px solid var(--color-border-light)",
                }}
              >
                <div
                  style={{
                    fontWeight: "var(--font-weight-semibold)",
                    marginBottom: "var(--space-1)",
                  }}
                >
                  {testimonial.name}
                </div>
                <div
                  className="text-muted"
                  style={{ fontSize: "var(--text-sm)" }}
                >
                  {testimonial.role} at {testimonial.company}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// Categories Section
export const CategoriesSection = () => {
  const categories = [
    {
      name: "Web Development",
      count: "2,500+",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Web Development</title>
          <rect x="3" y="4" width="18" height="14" rx="2" />
          <path d="M8 21h8" />
          <path d="m9 10-2 2 2 2" />
          <path d="m15 10 2 2-2 2" />
        </svg>
      ),
    },
    {
      name: "Mobile Development",
      count: "1,800+",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Mobile Development</title>
          <rect x="7" y="2" width="10" height="20" rx="2" />
          <path d="M11 5h2" />
          <circle cx="12" cy="18" r="1" />
        </svg>
      ),
    },
    {
      name: "Design & Creative",
      count: "3,200+",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Design and Creative</title>
          <circle cx="13.5" cy="6.5" r="2.5" />
          <circle cx="7.5" cy="10.5" r="2" />
          <circle cx="16.5" cy="12" r="2" />
          <path d="M7 20a3 3 0 1 1 0-6h4.5a5.5 5.5 0 1 0 0-11H11" />
        </svg>
      ),
    },
    {
      name: "Writing & Translation",
      count: "1,500+",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Writing and Translation</title>
          <path d="M4 20h16" />
          <path d="m13 6 5 5" />
          <path d="M6 16l9-9 3 3-9 9H6z" />
        </svg>
      ),
    },
    {
      name: "Marketing & Sales",
      count: "1,200+",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Marketing and Sales</title>
          <path d="M3 19h18" />
          <path d="M5 15l4-4 3 3 6-7" />
          <path d="M15 7h3v3" />
        </svg>
      ),
    },
    {
      name: "Admin & Support",
      count: "900+",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Admin and Support</title>
          <path d="M3 5h18" />
          <path d="M7 5v14" />
          <path d="M3 19h18" />
          <path d="M12 10h7" />
          <path d="M12 14h5" />
        </svg>
      ),
    },
    {
      name: "Data Science",
      count: "1,100+",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Data Science</title>
          <path d="M4 19V9" />
          <path d="M10 19V5" />
          <path d="M16 19v-8" />
          <path d="M22 19V3" />
        </svg>
      ),
    },
    {
      name: "Engineering",
      count: "800+",
      icon: (
        <svg
          width="30"
          height="30"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <title>Engineering</title>
          <path d="m14.7 6.3 3 3" />
          <path d="m4 20 6.2-6.2" />
          <path d="m6.8 12.8 4.4 4.4" />
          <path d="m18.5 2.5 3 3-8.8 8.8-3-3z" />
        </svg>
      ),
    },
  ];

  return (
    <section className="section" style={{ backgroundColor: "var(--color-bg)" }}>
      <div className="container">
        <div style={{ textAlign: "center", marginBottom: "var(--space-14)" }}>
          <h2
            style={{
              marginBottom: "var(--space-4)",
              fontSize: "var(--text-4xl)",
            }}
          >
            Explore talent by category
          </h2>
          <p className="text-secondary" style={{ fontSize: "var(--text-lg)" }}>
            Find the perfect professional for any job
          </p>
        </div>
        <div className="grid grid-cols-4" style={{ gap: "var(--space-4)" }}>
          {categories.map((category) => (
            <div
              key={category.name}
              className="card"
              style={{
                textAlign: "center",
                cursor: "pointer",
                transition: "all var(--transition-base)",
              }}
            >
              <div
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "var(--radius-xl)",
                  background:
                    "linear-gradient(135deg, var(--color-primary-lightest) 0%, var(--color-primary-100) 100%)",
                  color: "var(--color-primary)",
                  margin: "0 auto var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {category.icon}
              </div>
              <h4
                style={{
                  marginBottom: "var(--space-2)",
                  fontSize: "var(--text-lg)",
                }}
              >
                {category.name}
              </h4>
              <div
                className="text-muted"
                style={{ fontSize: "var(--text-sm)" }}
              >
                {category.count} professionals
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
