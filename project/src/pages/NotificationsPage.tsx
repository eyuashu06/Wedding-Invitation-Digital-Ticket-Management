import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatDateTime } from "@/lib/utils";
import type { AppNotification } from "@/lib/types";

export function NotificationsPage() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, [user]);

  async function load() {
    if (!user) return;
    const { data } = await supabase.from("notifications").select("*").eq("recipient_id", user.id).order("created_at", { ascending: false });
    setNotifications(data ?? []);
    setLoading(false);
  }

  async function markAsRead(id: string) {
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((n) => n.map((x) => x.id === id ? { ...x, read: true } : x));
  }

  async function markAllRead() {
    if (!user) return;
    await supabase.from("notifications").update({ read: true }).eq("recipient_id", user.id).eq("read", false);
    load();
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  if (loading) return <div className="skeleton h-96 rounded-2xl" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-stone-900 dark:text-stone-100">Notifications</h1>
          <p className="mt-1 text-sm text-stone-500">{unreadCount} unread of {notifications.length} total</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="secondary" onClick={markAllRead}><Check className="h-4 w-4" /> Mark All Read</Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-16 text-center">
          <Bell className="h-12 w-12 text-stone-300 dark:text-stone-600" />
          <p className="mt-4 text-sm text-stone-400">No notifications yet.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card key={n.id} className={`flex items-start gap-3 ${!n.read ? "border-gold-200 dark:border-gold-800" : ""}`}>
              <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-600 dark:bg-gold-900/30 dark:text-gold-400">
                <Bell className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-stone-900 dark:text-stone-100">{n.title}</p>
                  {!n.read && <Badge className="bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300">New</Badge>}
                </div>
                <p className="mt-1 text-sm text-stone-500">{n.message}</p>
                <p className="mt-1 text-xs text-stone-400">{formatDateTime(n.created_at)}</p>
              </div>
              {!n.read && (
                <button onClick={() => markAsRead(n.id)} className="rounded-lg p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-600 dark:hover:bg-stone-800">
                  <Check className="h-4 w-4" />
                </button>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
