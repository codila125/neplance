import { DisputesQueueClient } from "@/features/admin/components/DisputesQueueClient";
import { listDisputesQueueServer } from "@/lib/server/admin";

export default async function AdminDisputesPage() {
  const disputes = await listDisputesQueueServer("all");

  return <DisputesQueueClient initialDisputes={disputes} />;
}
