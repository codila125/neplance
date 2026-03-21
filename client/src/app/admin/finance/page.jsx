import { FinanceManagementClient } from "@/features/admin/components/FinanceManagementClient";
import { getFinanceManagementServer } from "@/lib/server/admin";

export default async function AdminFinancePage() {
  const data = await getFinanceManagementServer();

  return <FinanceManagementClient initialData={data} />;
}
