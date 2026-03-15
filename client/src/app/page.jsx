import Link from "next/link";
import {
  CategoriesSection,
  HeroSection,
  HowItWorksSection,
  TestimonialsSection,
} from "@/features/marketing/components/LandingSections";
import { redirectIfAuthenticated } from "@/lib/server/auth";

export default async function Home() {
  await redirectIfAuthenticated();

  return (
    <>
      <main>
        <HeroSection />
        <HowItWorksSection />

        <section
          className="section"
          style={{ backgroundColor: "var(--color-bg-light)" }}
          id="hire-talent"
        >
          <div className="container">
            <div
              className="grid grid-cols-2"
              style={{ alignItems: "center", gap: "var(--space-12)" }}
            >
              <div>
                <div
                  className="badge badge-success"
                  style={{ marginBottom: "var(--space-4)" }}
                >
                  FOR BUSINESSES
                </div>
                <h2
                  style={{
                    marginBottom: "var(--space-6)",
                    fontSize: "var(--text-4xl)",
                  }}
                >
                  Hire the world's best talent
                </h2>
                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    marginBottom: "var(--space-8)",
                  }}
                >
                  <li
                    style={{
                      marginBottom: "var(--space-4)",
                      display: "flex",
                      gap: "var(--space-3)",
                      alignItems: "start",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ flexShrink: 0, marginTop: "2px" }}
                    >
                      <title>Post a job for free</title>
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="var(--color-primary-lightest)"
                      />
                      <path
                        d="M8 12l2 2 4-4"
                        stroke="var(--color-primary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          marginBottom: "var(--space-1)",
                        }}
                      >
                        Post a job for free
                      </div>
                      <div className="text-light">
                        Describe your project and get proposals from qualified
                        professionals
                      </div>
                    </div>
                  </li>
                  <li
                    style={{
                      marginBottom: "var(--space-4)",
                      display: "flex",
                      gap: "var(--space-3)",
                      alignItems: "start",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ flexShrink: 0, marginTop: "2px" }}
                    >
                      <title>Review vetted talent</title>
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="var(--color-primary-lightest)"
                      />
                      <path
                        d="M8 12l2 2 4-4"
                        stroke="var(--color-primary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          marginBottom: "var(--space-1)",
                        }}
                      >
                        Review vetted talent
                      </div>
                      <div className="text-light">
                        Compare proposals, portfolios, and reviews to find the
                        perfect match
                      </div>
                    </div>
                  </li>
                  <li
                    style={{
                      marginBottom: "var(--space-4)",
                      display: "flex",
                      gap: "var(--space-3)",
                      alignItems: "start",
                    }}
                  >
                    <svg
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      style={{ flexShrink: 0, marginTop: "2px" }}
                    >
                      <title>Pay with confidence</title>
                      <circle
                        cx="12"
                        cy="12"
                        r="10"
                        fill="var(--color-primary-lightest)"
                      />
                      <path
                        d="M8 12l2 2 4-4"
                        stroke="var(--color-primary)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    <div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          marginBottom: "var(--space-1)",
                        }}
                      >
                        Pay with confidence
                      </div>
                      <div className="text-light">
                        Only release payment when you're 100% satisfied with the
                        work
                      </div>
                    </div>
                  </li>
                </ul>
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Get Started as a Client
                </Link>
              </div>
              <div
                className="card"
                style={{ padding: "var(--space-8)", backgroundColor: "white" }}
              >
                <h3
                  style={{
                    marginBottom: "var(--space-6)",
                    fontSize: "var(--text-2xl)",
                  }}
                >
                  What makes Neplance different
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-6)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--color-primary-lightest)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "var(--text-xl)",
                          color: "var(--color-primary)",
                          fontWeight: "var(--font-weight-bold)",
                        }}
                      >
                        $
                      </div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          fontSize: "var(--text-lg)",
                        }}
                      >
                        Secure payments
                      </div>
                    </div>
                    <p className="text-light">
                      Blockchain-based escrow system ensures safe and
                      transparent transactions
                    </p>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--color-primary-lightest)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "var(--text-xl)",
                          color: "var(--color-primary)",
                          fontWeight: "var(--font-weight-bold)",
                        }}
                      >
                        ★
                      </div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          fontSize: "var(--text-lg)",
                        }}
                      >
                        Quality talent
                      </div>
                    </div>
                    <p className="text-light">
                      All freelancers are verified and reviewed by our community
                    </p>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "var(--color-primary-lightest)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "var(--text-xl)",
                          color: "var(--color-primary)",
                          fontWeight: "var(--font-weight-bold)",
                        }}
                      >
                        ?
                      </div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          fontSize: "var(--text-lg)",
                        }}
                      >
                        24/7 support
                      </div>
                    </div>
                    <p className="text-light">
                      Our team is always here to help you succeed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section
          className="section"
          style={{ backgroundColor: "var(--color-bg)" }}
          id="find-opportunities"
        >
          <div className="container">
            <div
              className="grid grid-cols-2"
              style={{ alignItems: "center", gap: "var(--space-12)" }}
            >
              <div
                className="card"
                style={{
                  padding: "var(--space-8)",
                  backgroundColor: "var(--color-bg-light)",
                }}
              >
                <h3
                  style={{
                    marginBottom: "var(--space-6)",
                    fontSize: "var(--text-2xl)",
                  }}
                >
                  Why freelancers love Neplance
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "var(--space-6)",
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "var(--text-xl)",
                          color: "var(--color-primary)",
                          fontWeight: "var(--font-weight-bold)",
                        }}
                      >
                        ↑
                      </div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          fontSize: "var(--text-lg)",
                        }}
                      >
                        Find great projects
                      </div>
                    </div>
                    <p className="text-light">
                      Access thousands of high-quality projects that match your
                      skills
                    </p>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "var(--text-xl)",
                          color: "var(--color-primary)",
                          fontWeight: "var(--font-weight-bold)",
                        }}
                      >
                        ₹
                      </div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          fontSize: "var(--text-lg)",
                        }}
                      >
                        Get paid on time
                      </div>
                    </div>
                    <p className="text-light">
                      Secure payment processing ensures you get paid for your
                      work
                    </p>
                  </div>
                  <div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "var(--space-3)",
                        marginBottom: "var(--space-2)",
                      }}
                    >
                      <div
                        style={{
                          width: "48px",
                          height: "48px",
                          borderRadius: "var(--radius-md)",
                          backgroundColor: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "var(--text-xl)",
                          color: "var(--color-primary)",
                          fontWeight: "var(--font-weight-bold)",
                        }}
                      >
                        ↗
                      </div>
                      <div
                        style={{
                          fontWeight: "var(--font-weight-semibold)",
                          fontSize: "var(--text-lg)",
                        }}
                      >
                        Grow your business
                      </div>
                    </div>
                    <p className="text-light">
                      Build your reputation and grow your freelance career
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <div
                  className="badge badge-success"
                  style={{ marginBottom: "var(--space-4)" }}
                >
                  FOR FREELANCERS
                </div>
                <h2
                  style={{
                    marginBottom: "var(--space-6)",
                    fontSize: "var(--text-4xl)",
                  }}
                >
                  Build your freelance career
                </h2>
                <p
                  className="text-light"
                  style={{
                    fontSize: "var(--text-lg)",
                    marginBottom: "var(--space-8)",
                    lineHeight: 1.7,
                  }}
                >
                  Join thousands of successful freelancers who are earning a
                  living doing what they love. Whether you're looking for a side
                  hustle or building a full-time career, Neplance connects you
                  with clients who value your expertise.
                </p>
                <Link href="/signup" className="btn btn-primary btn-lg">
                  Start Freelancing Today
                </Link>
              </div>
            </div>
          </div>
        </section>

        <TestimonialsSection />
        <CategoriesSection />

        <section
          className="section"
          id="signup"
          style={{ backgroundColor: "var(--color-primary-lightest)" }}
        >
          <div className="container">
            <div
              style={{ textAlign: "center", marginBottom: "var(--space-12)" }}
            >
              <h2
                style={{
                  marginBottom: "var(--space-4)",
                  fontSize: "var(--text-4xl)",
                }}
              >
                Ready to get started?
              </h2>
              <p className="text-light" style={{ fontSize: "var(--text-xl)" }}>
                Join Neplance today and connect with opportunities or talent
                worldwide
              </p>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                gap: "var(--space-4)",
              }}
            >
              <Link href="/login" className="btn btn-secondary btn-lg">
                Log In
              </Link>
              <Link href="/signup" className="btn btn-primary btn-lg">
                Sign Up
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer
        style={{
          backgroundColor: "var(--color-dark)",
          color: "white",
          padding: "var(--space-16) 0 var(--space-8)",
        }}
      >
        <div className="container">
          <div
            className="grid grid-cols-4"
            style={{ gap: "var(--space-8)", marginBottom: "var(--space-12)" }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "var(--space-2)",
                  marginBottom: "var(--space-4)",
                }}
              >
                <svg
                  width="32"
                  height="32"
                  viewBox="0 0 32 32"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>Neplance logo</title>
                  <circle cx="16" cy="16" r="16" fill="#14a800" />
                  <path
                    d="M12 10L16 20L20 10"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M10 15H22"
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
                <span
                  style={{
                    fontSize: "var(--text-xl)",
                    fontWeight: "var(--font-weight-bold)",
                  }}
                >
                  Neplance
                </span>
              </div>
              <p
                style={{
                  color: "rgba(255, 255, 255, 0.7)",
                  fontSize: "var(--text-sm)",
                }}
              >
                The world's work marketplace connecting talent with opportunity.
              </p>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-4)", color: "white" }}>
                For Clients
              </h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="#hire-talent"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    How to Hire
                  </a>
                </li>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="#hire-talent"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Talent Marketplace
                  </a>
                </li>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="/signup"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Post a Job
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-4)", color: "white" }}>
                For Talent
              </h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="#find-opportunities"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    How to Find Work
                  </a>
                </li>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="/jobs"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Browse Jobs
                  </a>
                </li>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="/signup"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Create Profile
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 style={{ marginBottom: "var(--space-4)", color: "white" }}>
                Company
              </h4>
              <ul style={{ listStyle: "none", padding: 0 }}>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="/about"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    About Us
                  </a>
                </li>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="/trust"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Trust & Safety
                  </a>
                </li>
                <li style={{ marginBottom: "var(--space-2)" }}>
                  <a
                    href="/contact"
                    style={{
                      color: "rgba(255, 255, 255, 0.7)",
                      textDecoration: "none",
                      fontSize: "var(--text-sm)",
                    }}
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div
            style={{
              paddingTop: "var(--space-6)",
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "var(--space-4)",
            }}
          >
            <p
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "var(--text-sm)",
                margin: 0,
              }}
            >
              © 2026 Neplance Inc. All rights reserved.
            </p>
            <div style={{ display: "flex", gap: "var(--space-4)" }}>
              <a
                href="/privacy"
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "var(--text-sm)",
                  textDecoration: "none",
                }}
              >
                Privacy Policy
              </a>
              <a
                href="/terms"
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "var(--text-sm)",
                  textDecoration: "none",
                }}
              >
                Terms of Service
              </a>
              <a
                href="/cookies"
                style={{
                  color: "rgba(255, 255, 255, 0.5)",
                  fontSize: "var(--text-sm)",
                  textDecoration: "none",
                }}
              >
                Cookie Policy
              </a>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
