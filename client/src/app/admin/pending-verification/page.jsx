import { VerificationQueueClient } from "@/features/admin/components/VerificationQueueClient";
import { listVerificationQueueServer } from "@/lib/server/admin";

export default async function AdminPendingVerificationPage() {
  const users = await listVerificationQueueServer("pending");

  return <VerificationQueueClient initialUsers={users} />;
}
