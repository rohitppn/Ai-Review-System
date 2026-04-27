import { notFound } from "next/navigation";
import { getStoreBySlug } from "@/lib/stores";
import ReviewFlow from "./ReviewFlow";

export const dynamic = "force-dynamic";

export default async function ReviewPage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId: slug } = await params;
  const store = await getStoreBySlug(slug);
  if (!store) notFound();
  return <ReviewFlow store={store} />;
}
