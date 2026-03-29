import OnboardingWizard from "@/components/OnboardingWizard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Onboarding — ET Intelligence",
  description: "Set up your personalized business news feed in 3 simple steps.",
};

export const dynamic = "force-dynamic";

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
