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
  if (store.status !== "active") {
    return (
      <main className="min-h-screen flex items-center justify-center px-5 py-10">
        <div className="max-w-sm w-full text-center bg-white rounded-3xl shadow-xl shadow-rose-200/30 p-8 animate-slide-up">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-amber-100 text-3xl mb-4">⏳</div>
          <h1 className="text-2xl font-bold mb-2">Coming soon</h1>
          <p className="text-gray-600 leading-relaxed">
            This store is being set up. Check back in a few hours — the QR will
            be live once activation is complete.
          </p>
        </div>
      </main>
    );
  }
  return <ReviewFlow store={store} />;
}
