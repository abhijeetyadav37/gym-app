import { Bell, X } from "lucide-react";

// Shows unread notifications (e.g. "membership expiring soon") with
// a dismiss button that marks each one as read.
function NotificationsPanel({ notifications, onDismiss }) {
  const unreadNotifications = notifications.filter((notification) => !notification.is_read);

  if (unreadNotifications.length === 0) {
    return null; // Nothing to show — keeps the dashboard uncluttered.
  }

  return (
    <div className="space-y-2 mb-6">
      {unreadNotifications.map((notification) => (
        <div
          key={notification.id}
          className="bg-warning/10 border border-warning/30 rounded-xl px-4 py-3 flex items-start justify-between gap-3"
        >
          <div className="flex items-start gap-3">
            <Bell className="text-warning shrink-0 mt-0.5" size={18} />
            <p className="text-ink text-sm">{notification.message}</p>
          </div>
          <button
            onClick={() => onDismiss(notification.id)}
            className="text-ink-muted hover:text-ink shrink-0"
            aria-label="Dismiss notification"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export default NotificationsPanel;