import { DashboardSectionNav } from "@/features/dashboard/components/DashboardSectionNav";

export function DashboardShell({ activeRole, children }) {
  const config =
    activeRole === "client"
      ? {
          title: "Client Dashboard",
          subtitle: "Manage your contracts and proposals",
          items: [
            { href: "/dashboard/client/my-contracts", label: "My Contracts" },
            { href: "/dashboard/client/my-jobs", label: "My Jobs" },
            { href: "/dashboard/client/proposals", label: "Review Proposals" },
            { href: "/dashboard/client/post-job", label: "Post Job" },
          ],
        }
      : {
          title: "Freelancer Dashboard",
          subtitle: "Manage your proposals and active contracts",
          items: [
            {
              href: "/dashboard/freelancer/my-contracts",
              label: "My Contracts",
            },
            {
              href: "/dashboard/freelancer/active-proposals",
              label: "My Proposals",
            },
            {
              href: "/dashboard/freelancer/ongoing-jobs",
              label: "Active Contracts",
            },
          ],
        };

  return (
    <div className="dashboard">
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="dashboard-header-row">
            <div>
              <h2 className="dashboard-title">{config.title}</h2>
              <p className="dashboard-subtitle">{config.subtitle}</p>
            </div>
          </div>
        </div>

        <DashboardSectionNav items={config.items} />

        {children}
      </div>
    </div>
  );
}
