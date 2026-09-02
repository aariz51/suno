// The product itself. The landing page at / explains it; this is the thing.
//
// Kept as a thin shell: five screens, one state object, no routing between them,
// because a person in an emergency should never see a page load.
import AppShell from "@/components/AppShell";

export const metadata = {
  title: "Suno — warning portal",
  description:
    "Disaster warnings for India in 13 languages, read aloud, working offline. Independent prototype; not a government service.",
};

export default function AppPage() {
  return <AppShell />;
}
