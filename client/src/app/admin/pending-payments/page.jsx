import { PaymentVerificationQueueClient } from "@/features/admin/components/PaymentVerificationQueueClient";
import { listPaymentVerificationQueueServer } from "@/lib/server/admin";

export default async function AdminPendingPaymentsPage() {
  const requests = await listPaymentVerificationQueueServer("pending");

  return <PaymentVerificationQueueClient initialRequests={requests} />;
}
