import Link from "next/link";
import {
  markAllNotificationsReadAction,
  markNotificationReadAction,
} from "@/lib/actions/notifications";
import { requireSession } from "@/lib/server/auth";
import { listNotificationsServer } from "@/lib/server/notifications";

const formatTimestamp = (value) => {
  if (!value) {
    return "Just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export default async function NotificationsPage() {
  await requireSession();
  const notifications = await listNotificationsServer();
  const unreadCount = notifications.filter((item) => !item.isRead).length;

  return (
    <main className="section section-sm">
      <div className="container max-w-3xl">
        <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="mb-2">Notifications</h1>
            <p className="text-muted">
              Stay on top of proposals, milestones, and contract updates.
            </p>
          </div>
          {unreadCount > 0 ? (
            <form action={markAllNotificationsReadAction}>
              <button type="submit" className="btn btn-secondary btn-sm">
                Mark all as read
              </button>
            </form>
          ) : null}
        </div>

        {notifications.length === 0 ? (
          <section className="card">
            <p className="text-muted mb-0">
              No notifications yet. Activity from proposals and milestones will
              appear here.
            </p>
          </section>
        ) : (
          <div className="grid gap-4">
            {notifications.map((notification) => (
              <section key={notification._id} className="card">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h2 className="text-xl mb-2">{notification.title}</h2>
                    <p className="text-secondary mb-0">
                      {notification.message}
                    </p>
                  </div>
                  {!notification.isRead ? (
                    <span className="badge badge-success">New</span>
                  ) : null}
                </div>

                <div className="flex flex-wrap gap-4 text-sm text-muted mb-4">
                  <span>{formatTimestamp(notification.createdAt)}</span>
                  {notification.actor?.name ? (
                    <span>From {notification.actor.name}</span>
                  ) : null}
                </div>

                <div className="flex gap-3 flex-wrap">
                  {notification.link ? (
                    <form
                      action={markNotificationReadAction.bind(
                        null,
                        notification._id,
                        notification.link,
                      )}
                    >
                      <button type="submit" className="btn btn-primary btn-sm">
                        Open
                      </button>
                    </form>
                  ) : null}

                  {!notification.isRead ? (
                    <form
                      action={markNotificationReadAction.bind(
                        null,
                        notification._id,
                        null,
                      )}
                    >
                      <button
                        type="submit"
                        className="btn btn-secondary btn-sm"
                      >
                        Mark as read
                      </button>
                    </form>
                  ) : notification.link ? (
                    <Link
                      href={notification.link}
                      className="btn btn-secondary btn-sm"
                    >
                      View
                    </Link>
                  ) : null}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
