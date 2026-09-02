import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { DISTRICTS } from "@/lib/data/districts";
import { ALERTS, UPSTREAM_LANGUAGES } from "@/lib/data/alerts";
import { SHELTERS } from "@/lib/data/shelters";
import { HELPLINES } from "@/lib/data/helplines";
import { LANGS, COVERED_BEYOND_UPSTREAM_M } from "@/lib/i18n";
import { Reveal, RevealGroup, CountUp, RotatingWord } from "@/components/motion";
import { LangSlots } from "@/components/LangSlots";

export const metadata: Metadata = {
  title: "Suno — the warning, in your language",
  description:
    "India issues disaster warnings in 2 languages. The alert format was designed to carry more. Suno delivers the same warning in 13, read aloud, working with no network. Independent hackathon prototype.",
  openGraph: {
    title: "Suno — the warning, in your language",
    description:
      "The alert format has room for 13 languages. The bulletin fills 2. Suno fills the rest, out loud, offline.",
    type: "website",
  },
};

// -----------------------------------------------------------------------------
// THE LANDING PAGE
// -----------------------------------------------------------------------------
// Deliberately not a SaaS hero: no gradient mesh, no floating orbs, no scroll
// reveals. A page about warnings that hides its own content behind a scroll
// gesture is arguing against itself.
//
// What it does instead is show the product. Every screenshot on this page is the
// real running build, captured by scripts/marketing-shots.mjs — because the page
// claims the interface changes language by district and turns red at Level 4,
// and the reader should be able to see that it does rather than take it on
// trust. Every figure is computed from the repository at build time, so nothing
// here can drift from the app it describes.
// -----------------------------------------------------------------------------

const SHELL = "mx-auto w-full max-w-[1280px] px-6 lg:px-10 2xl:max-w-[1440px]";

function Shot({
  src, alt, caption, tone,
}: { src: string; alt: string; caption: string; tone: string }) {
  return (
    <figure className="min-w-0">
      <div className="overflow-hidden rounded-[18px] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] shadow-[var(--shadow-lift)]">
        <Image src={src} alt={alt} width={780} height={1600} className="h-auto w-full" />
      </div>
      <figcaption className="mt-3 flex items-start gap-2.5">
        <span
          className="mt-[7px] h-2.5 w-2.5 shrink-0 rounded-full"
          style={{ background: `var(--color-${tone})` }}
          aria-hidden
        />
        <span className="text-[13px] leading-[1.55] text-[var(--color-ink-2)]">{caption}</span>
      </figcaption>
    </figure>
  );
}

function Feature({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--color-hairline)] pt-5">
      <h3 className="text-[16px] font-bold tracking-[-0.012em]">{title}</h3>
      <p className="mt-2 text-[14px] leading-[1.62] text-[var(--color-ink-2)]">{children}</p>
    </div>
  );
}

export default function Landing() {
  const langCount = LANGS.length;
  const upstream = UPSTREAM_LANGUAGES.length;
  const added = langCount - upstream;

  return (
    <main className="min-h-dvh bg-[var(--color-paper)] text-[var(--color-ink)]">
      {/* --- top bar ---------------------------------------------------- */}
      <header className="sticky top-0 z-40 border-b border-[var(--color-hairline)] bg-[var(--color-paper)]/92 backdrop-blur-[10px]">
        <div className={`${SHELL} flex h-[68px] items-center justify-between gap-4`}>
          <div className="flex items-baseline gap-3">
            <span className="text-[20px] font-extrabold tracking-[-0.03em]">Suno</span>
            <span className="hidden text-[12.5px] text-[var(--color-ink-3)] sm:inline">
              The warning, in your language
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/how-it-runs"
              className="hidden min-h-[44px] items-center rounded-[9px] px-3 text-[14px] font-bold text-[var(--color-ink-2)] hover:text-[var(--color-ink)] sm:inline-flex"
            >
              How it would run
            </Link>
            <Link
              href="/app"
              className="inline-flex min-h-[44px] items-center rounded-[9px] bg-[var(--color-ink)] px-4 text-[14px] font-bold text-[var(--color-paper)]"
            >
              Open the portal
            </Link>
          </div>
        </div>
      </header>

      {/* --- hero -------------------------------------------------------- */}
      <section className={`${SHELL} pt-12 pb-8 lg:pt-16 lg:pb-20`}>
        <div className="grid items-center gap-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-20">
          <div className="min-w-0">
            <Reveal kind="fade" delay={0}>
              <span className="inline-flex items-center rounded-full border border-dashed border-[var(--color-ink-3)] px-3 py-1 text-[10.5px] font-bold uppercase tracking-[0.1em] text-[var(--color-ink-3)]">
                Independent prototype · not a government service
              </span>
            </Reveal>

            {/* Each line lifts separately, ~90ms apart. The sentence assembles
                the way it is read rather than appearing as a slab. */}
            <h1 className="mt-6 text-[44px] font-extrabold leading-[1.0] tracking-[-0.038em] sm:text-[60px] lg:text-[72px] 2xl:text-[82px]">
              <Reveal delay={90}>The warning,</Reveal>
              <Reveal delay={180}>in your language,</Reveal>
              <Reveal delay={270}>out loud.</Reveal>
            </h1>

            {/* The claim, performed. The word for "warning" cycles through all
                thirteen while the reader is still on the first screen. */}
            <Reveal kind="fade" delay={420}>
              <div className="mt-6 flex h-[2em] items-center text-[26px] font-bold tracking-[-0.02em] lg:text-[30px]">
                <RotatingWord
                  items={[
                    { word: "সতৰ্কবাণী", label: "Assamese", lang: "as" },
                    { word: "चेतावनी", label: "Hindi", lang: "hi" },
                    { word: "ଚେତାବନୀ", label: "Odia", lang: "or" },
                    { word: "எச்சரிக்கை", label: "Tamil", lang: "ta" },
                    { word: "സൂചന", label: "Malayalam", lang: "ml" },
                    { word: "সতর্কতা", label: "Bengali", lang: "bn" },
                    { word: "హెచ్చరిక", label: "Telugu", lang: "te" },
                    { word: "ಎಚ್ಚರಿಕೆ", label: "Kannada", lang: "kn" },
                    { word: "ચેતવણી", label: "Gujarati", lang: "gu" },
                    { word: "इशारा", label: "Marathi", lang: "mr" },
                    { word: "ਚੇਤਾਵਨੀ", label: "Punjabi", lang: "pa" },
                    { word: "وارننگ", label: "Urdu", lang: "ur", dir: "rtl" as const },
                    { word: "Warning", label: "English", lang: "en" },
                  ]}
                />
              </div>
            </Reveal>

            <Reveal kind="fade" delay={500}>
            <p className="mt-5 max-w-[54ch] text-[17px] leading-[1.6] text-[var(--color-ink-2)] lg:text-[19px]">
              When the Dhansiri goes over its danger mark, Assam gets a bulletin in English and
              Hindi. Sixty-one percent of the state reads Assamese. The warning arrives, and it does
              not arrive.
            </p>
            </Reveal>

            <Reveal delay={580} className="mt-9 flex flex-wrap items-center gap-3">
              <Link
                href="/app"
                className="inline-flex min-h-[56px] items-center gap-2.5 rounded-[13px] bg-[var(--color-ink)] px-7 text-[17px] font-bold text-[var(--color-paper)] transition-[filter] hover:brightness-125"
              >
                Open the warning portal
                <span aria-hidden className="rtl:rotate-180">→</span>
              </Link>
              <Link
                href="/how-it-runs"
                className="inline-flex min-h-[56px] items-center rounded-[13px] border border-[var(--color-hairline)] px-6 text-[15px] font-bold transition-colors hover:border-[var(--color-ink-3)]"
              >
                How this would actually run
              </Link>
            </Reveal>

            <Reveal kind="fade" delay={660}>
              <p className="mt-4 text-[13px] text-[var(--color-ink-3)]">
                No sign-up, no login, nothing to install. It asks where you are, or you pick a
                district.
              </p>
            </Reveal>
          </div>

          {/* The product, not an illustration of it. */}
          <Reveal kind="scale" delay={340} className="relative mx-auto w-full max-w-[320px] lg:max-w-[380px]">
            <div className="overflow-hidden rounded-[24px] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] shadow-[var(--shadow-lift)]">
              <Image
                src="/shots/act.png"
                alt="The Suno warning screen at Level 4, rendered in Assamese: a red page with an evacuation headline, a live countdown, and numbered actions."
                width={780}
                height={1600}
                priority
                className="h-auto w-full"
              />
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
              A live Level 4 warning for Golaghat, Assam — in Assamese, because the district decides
              the language. Real screenshot of the running build.
            </p>
          </Reveal>
        </div>
      </section>

      {/* --- the argument ------------------------------------------------ */}
      <section className={`${SHELL} py-10 lg:py-16`}>
        <div className="rounded-[20px] border border-[var(--color-l3)]/25 bg-[var(--color-l3-wash)] p-7 lg:p-12">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.85fr)] lg:gap-16">
            <Reveal className="min-w-0">
              <div className="text-[11px] font-bold uppercase tracking-[0.1em] text-[var(--color-l3)]">
                This is not an oversight. It is an empty slot.
              </div>
              <h2 className="mt-4 text-[30px] font-extrabold leading-[1.12] tracking-[-0.028em] lg:text-[42px]">
                The alert format has room for {langCount} languages.
                <br />
                The bulletin fills {upstream}.
              </h2>
              <p className="mt-5 max-w-[60ch] text-[15px] leading-[1.68] text-[var(--color-ink-2)]">
                CAP v1.2 — the OASIS standard that Sachet, IMD and CWC already publish in — gives
                every alert a <em>repeating</em>{" "}
                <code className="num rounded bg-[var(--color-paper-3)] px-1.5 py-0.5 text-[13.5px]">
                  &lt;info&gt;
                </code>{" "}
                block, each carrying its own{" "}
                <code className="num rounded bg-[var(--color-paper-3)] px-1.5 py-0.5 text-[13.5px]">
                  &lt;language&gt;
                </code>
                . Delivering an alert in many languages is not a feature anyone has to be persuaded
                of. It is a slot the format was designed with, and it is left empty.
              </p>
            </Reveal>

            <Reveal delay={120} className="min-w-0">
              <LangSlots />
              <p className="mt-4 text-[13px] leading-[1.6] text-[var(--color-ink-3)]">
                Filled: the two the bulletin is issued in. Outlined: the {added} this fills,
                reaching a further{" "}
                <span className="num font-bold text-[var(--color-ink-2)]">
                  {COVERED_BEYOND_UPSTREAM_M}
                </span>{" "}
                million first-language speakers.
              </p>
            </Reveal>
          </div>
        </div>
      </section>

      {/* --- three states ------------------------------------------------ */}
      <section className={`${SHELL} py-10 lg:py-16`}>
        <Reveal as="h2" className="max-w-[24ch] text-[28px] font-extrabold leading-[1.15] tracking-[-0.028em] lg:text-[38px]">
          The same product, in three states it does not choose.
        </Reveal>
        <Reveal as="p" delay={80} className="mt-4 max-w-[70ch] text-[15px] leading-[1.65] text-[var(--color-ink-2)]">
          Severity is derived from the district&apos;s own warnings, never set by a toggle. Each
          screen below is a real district: New Delhi has nothing active, Wayanad has a developing
          hazard, Golaghat is at Level 4. The language changes with them.
        </Reveal>

        <RevealGroup
          kind="scale"
          step={110}
          start={120}
          className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-10"
        >
          <Shot
            src="/shots/calm.png"
            alt="The calm state in Hindi: no active warning, preparedness information, and the district picker."
            tone="safe"
            caption="New Delhi — no active warning. Opens in Hindi. Preparedness and local information, and nothing shouting."
          />
          <Shot
            src="/shots/watch.png"
            alt="The watch state in Malayalam: a developing hazard with advisories."
            tone="l2"
            caption="Wayanad — a hazard developing. Opens in Malayalam. Advisories and checklists, with the ground only tinted."
          />
          <Shot
            src="/shots/act.png"
            alt="The act state in Assamese: a Level 4 evacuation warning on a red page."
            tone="l4"
            caption="Golaghat — Level 4. Opens in Assamese. The ground turns red and the header collapses; nothing else competes."
          />
        </RevealGroup>
      </section>

      {/* --- desktop ------------------------------------------------------ */}
      <section className={`${SHELL} py-10 lg:py-16`}>
        <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:gap-16">
          <Reveal className="min-w-0">
            <h2 className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.028em] lg:text-[36px]">
              Built for a cheap Android. Not only for one.
            </h2>
            <p className="mt-5 max-w-[52ch] text-[15px] leading-[1.68] text-[var(--color-ink-2)]">
              The phone is the design target — the brief asks for people on mobile devices and slow
              connections, and that is who this is for. But a district control room runs on a
              desktop, so above 1024px it becomes a two-pane application with a persistent
              navigation rail rather than a phone column stranded in the middle of a monitor.
              Nothing is hidden at either size; only the arrangement changes.
            </p>
          </Reveal>
          <Reveal kind="scale" delay={120} className="overflow-hidden rounded-[16px] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] shadow-[var(--shadow-lift)]">
            <Image
              src="/shots/desktop.png"
              alt="Suno on a desktop: a left navigation rail, the Level 4 warning in a main column, and the language-gap and district cards in a side column."
              width={2880}
              height={1800}
              className="h-auto w-full"
            />
          </Reveal>
        </div>
      </section>

      {/* --- numbers ------------------------------------------------------ */}
      <section className={`${SHELL} py-10 lg:py-16`}>
        <RevealGroup
          step={90}
          className="grid gap-x-10 gap-y-9 border-t border-[var(--color-hairline)] pt-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {([
            [langCount, "Languages", "Hand-written, not machine-dumped"],
            [DISTRICTS.length, "Districts", "Each one sets the language"],
            [HELPLINES.length, "Real helplines", "The only real numbers here"],
            [0, "Network required", "Opens and warns offline"],
          ] as [number, string, string][]).map(([n, label, sub]) => (
            <div key={label}>
              {/* Tabular figures, so the digits do not shuffle the layout while
                  they count. Zero is not animated — counting up to nothing is a
                  joke the reader has to wait for. */}
              <div className="num text-[40px] font-extrabold leading-none tracking-[-0.035em] lg:text-[48px]">
                <CountUp to={n} />
              </div>
              <div className="mt-2 text-[14px] font-bold">{label}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-[var(--color-ink-3)]">{sub}</div>
            </div>
          ))}
        </RevealGroup>
      </section>

      {/* --- how it works ------------------------------------------------- */}
      <section className={`${SHELL} py-10 lg:py-16`}>
        <div className="grid gap-10 lg:grid-cols-[minmax(0,0.62fr)_minmax(0,1.38fr)] lg:gap-16">
          <Reveal
            as="h2"
            className="text-[28px] font-extrabold leading-[1.15] tracking-[-0.028em] lg:sticky lg:top-[104px] lg:self-start lg:text-[36px]"
          >
            What it actually does
          </Reveal>

          <RevealGroup step={70} className="grid gap-x-12 gap-y-8 sm:grid-cols-2">
            <Feature title="It speaks, and it listens">
              Hold the button and ask in your own language. The question goes to Whisper, because the
              browser&apos;s own recogniser has effectively no engine for Assamese or Odia — the
              languages of two of the districts warned about here. The answer is read back aloud.
            </Feature>

            <Feature title="A rule table answers before the model does">
              The twenty questions people actually ask in the first ten minutes are answered by
              assembling text that already exists in the dataset: identical input, identical answer,
              no model call, no key, no network. Only unrecognised text reaches the model.
            </Feature>

            <Feature title="And you can watch the validator fire">
              Every model reply is checked — no phone number outside the ten-number allowlist, no
              measurement absent from the source, no sentence telling a person they are safe. Open
              the assistant and run the check yourself: four poisoned answers and one correct
              control, through the same validator every live answer uses.
            </Feature>

            <Feature title="It works when the tower does not">
              Installable, offline, and honest about it: with no network it says so, and names the
              time of the last update it holds.
            </Feature>

            <Feature title="The severity owns the page">
              At Level 4 the ground itself turns red and the header collapses to one line. A red
              card inside a white page can be scrolled past. A red page cannot.
            </Feature>

            <Feature title="A CAP reader you can test yourself">
              Paste a real bulletin into the pipeline page and watch it parse — severity, urgency,
              area geocode, instructions, and the count of language blocks the sender actually
              filled. It runs an independent risk scan beside the official feed and publishes where
              the two disagree, and models what each delivery channel would and would not reach.
            </Feature>

            <Feature title="Every number on screen is traceable">
              Warnings are shaped field-for-field on CAP v1.2, the format the real agencies already
              publish, so replacing the synthetic feed with a live one is a parser change rather
              than a redesign.
            </Feature>
          </RevealGroup>
        </div>
      </section>

      {/* --- honesty ------------------------------------------------------- */}
      <section className={`${SHELL} py-10 lg:py-16`}>
        <Reveal className="rounded-[20px] border border-[var(--color-hairline)] bg-[var(--color-paper-2)] p-7 lg:p-12">
          <h2 className="text-[24px] font-extrabold tracking-[-0.022em] lg:text-[30px]">
            What is real here, and what is not
          </h2>
          <div className="mt-6 grid gap-x-12 gap-y-5 text-[14.5px] leading-[1.65] lg:grid-cols-2">
            <p className="text-[var(--color-ink-2)]">
              <strong className="text-[var(--color-ink)]">Synthetic:</strong> all {ALERTS.length}{" "}
              warnings, all {SHELTERS.length} shelters, every water level, wind speed and
              temperature, and the safety register. Sender addresses end in{" "}
              <code className="num">.invalid</code>, a reserved domain that can never resolve.
            </p>
            <p className="text-[var(--color-ink-2)]">
              <strong className="text-[var(--color-ink)]">Real:</strong> the {HELPLINES.length}{" "}
              helpline numbers, your device&apos;s location if you allow it, the interface text in{" "}
              {langCount} languages, and the OpenAI calls when a key is configured.
            </p>
          </div>
          <p className="mt-6 max-w-[80ch] text-[13.5px] leading-[1.65] text-[var(--color-ink-3)]">
            This is not connected to any government system. It carries no government name, emblem or
            logo. It decides nothing, and no officer is bound by anything it says. The full
            item-by-item account is on{" "}
            <Link
              href="/how-it-runs"
              className="font-semibold text-[var(--color-accent)] underline underline-offset-4"
            >
              How this would actually run
            </Link>
            , along with the feed it would subscribe to, who is legally allowed to order an
            evacuation, what breaks at national scale, and what it would cost in rupees.
          </p>
        </Reveal>
      </section>

      {/* --- close --------------------------------------------------------- */}
      <section className={`${SHELL} pb-16 pt-6 lg:pb-24`}>
        <Reveal className="border-t border-[var(--color-hairline)] pt-12">
          <h2 className="max-w-[18ch] text-[32px] font-extrabold leading-[1.08] tracking-[-0.032em] lg:text-[46px]">
            Open it. It will ask where you are.
          </h2>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="inline-flex min-h-[56px] items-center gap-2.5 rounded-[13px] bg-[var(--color-ink)] px-7 text-[17px] font-bold text-[var(--color-paper)] transition-[filter] hover:brightness-125"
            >
              Open the warning portal
              <span aria-hidden className="rtl:rotate-180">→</span>
            </Link>
            <Link
              href="/how-it-runs"
              className="inline-flex min-h-[56px] items-center rounded-[13px] border border-[var(--color-hairline)] px-6 text-[15px] font-bold transition-colors hover:border-[var(--color-ink-3)]"
            >
              Read the engineering note
            </Link>
            <Link
              href="/pipeline"
              className="inline-flex min-h-[56px] items-center rounded-[13px] border border-[var(--color-hairline)] px-6 text-[15px] font-bold transition-colors hover:border-[var(--color-ink-3)]"
            >
              See the pipeline
            </Link>
          </div>

          <p className="mt-10 max-w-[85ch] text-[12px] leading-[1.7] text-[var(--color-ink-3)]">
            Suno — an independent prototype built for Build What Moves India. Not a government
            service, not affiliated with or endorsed by any agency named on this site. NDMA, IMD,
            CWC and NDRF are referred to only as the sources of published guidance and as the
            institutions this design would have to work with. All screenshots are of the running
            build.
          </p>
        </Reveal>
      </section>
    </main>
  );
}
