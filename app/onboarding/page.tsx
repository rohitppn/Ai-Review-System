import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import OnboardingWizard from "./OnboardingWizard";

export const dynamic = "force-dynamic";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const me = await getCurrentUser();
  if (!me) redirect("/auth/login?next=/onboarding");

  const { error } = await searchParams;

  return (
    <OnboardingWizard
      userEmail={me.email ?? ""}
      initialError={error ?? null}
      gpayQrSrc="/gpay-qr.png"
      adminWhatsapp={
        process.env.NEXT_PUBLIC_ADMIN_WHATSAPP ?? "917717766954"
      }
      adminUpiId={
        process.env.NEXT_PUBLIC_ADMIN_UPI_ID ?? "rohitsharmabusy@oksbi"
      }
      googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? ""}
    />
  );
}
