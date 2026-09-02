"use client";

// -----------------------------------------------------------------------------
// FIND / MARK SAFE
// -----------------------------------------------------------------------------
// The complete loop: verify a number, mark it safe, and have it findable by
// someone else searching. It genuinely works end to end in this prototype — the
// record persists and the search finds it — and it is labelled at every step
// with exactly what is and is not real.
//
// One deliberate difference from the service this re-thinks: the empty result is
// written carefully. "No record found" reads to a frightened person as bad news
// about a relative. It is not. It means nobody has typed that number in. The
// copy says that, because the alternative is a false bereavement.
// -----------------------------------------------------------------------------

import React, { useState } from "react";
import { useStore } from "./store";
import { Btn, Card, Field, Label, SampleMark, SectionTitle, Sheet, cx, inputCls } from "./ui";
import { IconCheck, IconFind, IconMic, IconPhone, IconShare, IconUsers } from "./icons";
import { DISTRICT_BY_ID } from "@/lib/data/districts";

/** Two numbers that are always present, so a reviewer can see both outcomes
 *  without first having to register one. */
const SEEDED: Record<string, number> = {
  "9876543210": Date.now() - 62 * 60_000,
  "9123456780": Date.now() - 8 * 60_000,
};

export function FindTab() {
  const { t, safeNumbers } = useStore();
  const [markOpen, setMarkOpen] = useState(false);

  return (
    <div className="px-5 pt-5">
      <PersonFinder />

      <div className="mt-6">
        <Card className="p-4">
          <div className="flex items-start gap-3.5">
            <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-[11px] bg-[var(--color-safe-wash)] text-[var(--color-safe)]">
              <IconUsers size={22} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-[17px] font-bold leading-tight">{t.markSafe}</h2>
              <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
                {t.markSafeSub}
              </p>
              <Btn className="mt-3" variant="safe" size="sm" onClick={() => setMarkOpen(true)}>
                {t.markSafe}
              </Btn>
            </div>
          </div>

          {safeNumbers.length > 0 && (
            <div className="mt-4 border-t border-[var(--color-hairline)] pt-3">
              <Label>Marked safe on this device</Label>
              <div className="mt-1.5 space-y-1">
                {safeNumbers.map((r) => (
                  <div key={r.number} className="num flex items-center justify-between text-[13px]">
                    <span className="font-bold">+91 {r.number.slice(0, 3)}•••••{r.number.slice(-2)}</span>
                    <span className="text-[var(--color-ink-3)]">{ago(r.at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      <ShareLocation />

      <div className="mt-6 rounded-[11px] border border-dashed border-[var(--color-hairline)] p-4">
        <div className="flex items-start justify-between gap-3">
          <Label>What this register really is</Label>
          <SampleMark />
        </div>
        <ul className="mt-2 space-y-1.5 text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
          <li>
            It searches two sample numbers plus any number you verify on this device. It does not
            search any telecom network, and there is no national register behind it.
          </li>
          <li>
            The verification code is shown on screen instead of being sent by SMS, so the whole flow
            can be tried without a real message and without a real phone number.
          </li>
          <li>
            Nothing leaves this browser. Numbers are stored in local storage on this device only,
            and are not sent to any server, including ours.
          </li>
          <li>
            A real version would have to be operated by the telecom operators under DoT, because
            they are the only parties who can verify that a number belongs to the person using it.
            That is discussed on the &ldquo;How this would actually run&rdquo; page.
          </li>
        </ul>
      </div>

      <MarkSafeSheet open={markOpen} onClose={() => setMarkOpen(false)} />
      <div className="h-8" />
    </div>
  );
}

function ago(at: number) {
  const m = Math.max(1, Math.round((Date.now() - at) / 60_000));
  return m < 60 ? `${m} min ago` : `${Math.round(m / 60)} hr ago`;
}

// -----------------------------------------------------------------------------

function PersonFinder() {
  const { t, safeNumbers, lang } = useStore();
  const [q, setQ] = useState("");
  const [result, setResult] = useState<null | { found: boolean; at?: number }>(null);
  const [listening, setListening] = useState(false);

  function search() {
    const n = q.replace(/\D/g, "");
    if (n.length !== 10) return;
    const local = safeNumbers.find((r) => r.number === n);
    const seeded = SEEDED[n];
    if (local) setResult({ found: true, at: local.at });
    else if (seeded) setResult({ found: true, at: seeded });
    else setResult({ found: false });
  }

  /** Voice entry for the number field. A ten-digit number is genuinely hard to
   *  type on a cracked screen with wet hands. */
  function voice() {
    type SR = new () => {
      lang: string; onresult: (e: { results: { 0: { 0: { transcript: string } } } }) => void;
      onend: () => void; onerror: () => void; start: () => void;
    };
    const W = window as unknown as { SpeechRecognition?: SR; webkitSpeechRecognition?: SR };
    const Ctor = W.SpeechRecognition ?? W.webkitSpeechRecognition;
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = lang === "en" ? "en-IN" : `${lang}-IN`;
    setListening(true);
    rec.onresult = (e) => {
      const digits = (e.results[0][0].transcript ?? "").replace(/\D/g, "").slice(0, 10);
      if (digits) setQ(digits);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    try { rec.start(); } catch { setListening(false); }
  }

  return (
    <Card className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[17px] font-bold leading-tight">{t.findPerson}</h2>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
            {t.findPersonSub}
          </p>
        </div>
        <SampleMark />
      </div>

      <div className="mt-3 flex gap-2">
        <div className="relative flex-1">
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value.replace(/\D/g, "").slice(0, 10)); setResult(null); }}
            onKeyDown={(e) => e.key === "Enter" && search()}
            inputMode="numeric"
            autoComplete="off"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
            className={cx(inputCls, "num pr-12")}
          />
          <button
            onClick={voice}
            aria-label={t.tapToSpeak}
            className={cx(
              "absolute right-1.5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full",
              listening ? "bg-[var(--color-l4)] text-white a-pulse" : "text-[var(--color-ink-3)] hover:text-[var(--color-ink)]",
            )}
          >
            <IconMic size={19} />
          </button>
        </div>
        <Btn onClick={search} disabled={q.length !== 10} variant="primary" icon={<IconFind size={18} />}>
          {t.searchBtn}
        </Btn>
      </div>

      <p className="num mt-2 text-[12px] text-[var(--color-ink-3)]">
        Sample numbers to try: 9876543210, 9123456780
      </p>

      {result && (
        <div
          className={cx(
            "mt-3 rounded-[11px] border p-3.5 a-rise",
            result.found
              ? "border-[var(--color-safe)]/25 bg-[var(--color-safe-wash)]"
              : "border-[var(--color-hairline)] bg-[var(--color-paper-2)]",
          )}
          role="status"
        >
          {result.found ? (
            <>
              <div className="flex items-center gap-2 text-[var(--color-safe)]">
                <IconCheck size={20} />
                <span className="text-[16px] font-extrabold">{t.foundSafe}</span>
              </div>
              <div className="num mt-1 text-[13px] font-semibold">
                +91 {q.slice(0, 3)}•••••{q.slice(-2)}
              </div>
              <div className="num mt-0.5 text-[12.5px] text-[var(--color-ink-3)]">
                {t.lastSeen} {result.at ? ago(result.at) : "—"}
              </div>
            </>
          ) : (
            <>
              <div className="text-[16px] font-extrabold">{t.notFound}</div>
              <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
                {t.notFoundSub}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
                This does not mean anything has happened to them. It only means nobody has marked
                that number safe here.
              </p>
              <a
                href="tel:1077"
                className="num mt-2.5 inline-flex h-10 items-center gap-2 rounded-[9px] border border-[var(--color-hairline)] px-3.5 text-[14px] font-bold"
              >
                <IconPhone size={16} /> 1077
              </a>
            </>
          )}
        </div>
      )}
    </Card>
  );
}

// -----------------------------------------------------------------------------

function MarkSafeSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t, addSafeNumber } = useStore();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [num, setNum] = useState("");
  const [code, setCode] = useState("");
  const [issued, setIssued] = useState("");
  const [err, setErr] = useState<string | null>(null);

  function reset() {
    setStep(1); setNum(""); setCode(""); setIssued(""); setErr(null);
  }

  function send() {
    if (num.length !== 10) { setErr(t.invalidNumber); return; }
    setErr(null);
    // Six digits, generated here and shown on screen. No SMS is sent, no gateway
    // is involved, and no number leaves the device.
    const c = String(Math.floor(100000 + Math.random() * 900000));
    setIssued(c);
    setStep(2);
  }

  function verify() {
    if (code !== issued) { setErr(t.wrongCode); return; }
    setErr(null);
    addSafeNumber(num);
    setStep(3);
  }

  return (
    <Sheet open={open} onClose={() => { onClose(); setTimeout(reset, 250); }} title={t.markSafe}>
      {step === 1 && (
        <div className="space-y-4">
          <Field label={t.mobileNumber} error={err} id="ms-num">
            <div className="flex items-center gap-2">
              <span className="num grid h-[46px] shrink-0 place-items-center rounded-[10px] border border-[var(--color-hairline)] px-3 text-[15px] font-bold text-[var(--color-ink-3)]">
                +91
              </span>
              <input
                id="ms-num"
                value={num}
                onChange={(e) => setNum(e.target.value.replace(/\D/g, "").slice(0, 10))}
                inputMode="numeric"
                autoComplete="tel-national"
                aria-invalid={Boolean(err) || undefined}
                className={cx(inputCls, "num")}
                placeholder="10-digit number"
              />
            </div>
          </Field>
          <p className="text-[12.5px] leading-relaxed text-[var(--color-ink-3)]">
            Use any ten digits. Do not enter a real phone number — this is a prototype and the
            brief asks that no real personal data be used. Nothing is sent anywhere.
          </p>
          <Btn full variant="safe" size="lg" onClick={send}>{t.sendCode}</Btn>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="rounded-[11px] border border-dashed border-[var(--color-accent)]/40 bg-[var(--color-accent-wash)] p-3.5">
            <Label className="!text-[var(--color-accent)]">Simulated SMS</Label>
            <div className="num mt-1 text-[30px] font-extrabold tracking-[0.14em] text-[var(--color-accent)]">
              {issued}
            </div>
            <p className="mt-1 text-[12px] leading-relaxed text-[var(--color-ink-2)]">
              A real deployment would send this by SMS. Here it is shown on screen so the whole flow
              can be completed without a real message, a real number, or an SMS gateway.
            </p>
          </div>

          <Field label={t.enterCode} error={err} id="ms-code">
            <input
              id="ms-code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              aria-invalid={Boolean(err) || undefined}
              className={cx(inputCls, "num text-center text-[22px] tracking-[0.3em]")}
              placeholder="––––––"
            />
          </Field>

          <div className="flex gap-2">
            <Btn variant="ghost" onClick={() => setStep(1)}>{t.back}</Btn>
            <Btn full variant="safe" onClick={verify} disabled={code.length !== 6}>{t.verify}</Btn>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4 text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-[var(--color-safe)] text-white a-rise">
            <IconCheck size={32} />
          </div>
          <div>
            <div className="text-[20px] font-extrabold">{t.verified}</div>
            <p className="mt-1 text-[14px] leading-relaxed text-[var(--color-ink-2)]">
              {t.safeRegistered}
            </p>
          </div>
          <div className="num rounded-[10px] bg-[var(--color-paper-2)] px-3 py-2 text-[14px] font-bold">
            +91 {num.slice(0, 3)}•••••{num.slice(-2)}
          </div>
          <p className="text-[12px] leading-relaxed text-[var(--color-ink-3)]">
            Search this number in the finder above and it will now come back as safe. That record
            lives in this browser only.
          </p>
          <Btn full variant="outline" onClick={() => { onClose(); setTimeout(reset, 250); }}>
            {t.done}
          </Btn>
        </div>
      )}
    </Sheet>
  );
}

// -----------------------------------------------------------------------------

function ShareLocation() {
  const { t, districtId } = useStore();
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function share() {
    if (!("geolocation" in navigator)) { setStatus(t.locationDenied); return; }
    setBusy(true);
    setStatus(t.sharing);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        const url = `https://www.google.com/maps?q=${latitude.toFixed(5)},${longitude.toFixed(5)}`;
        const district = DISTRICT_BY_ID[districtId];
        const text = `I am safe. I am here: ${url}${district ? ` (near ${district.name})` : ""}`;
        try {
          if (navigator.share) {
            await navigator.share({ text });
            setStatus(null);
          } else {
            await navigator.clipboard.writeText(text);
            setStatus(t.copied);
          }
        } catch {
          setStatus(t.copied);
        } finally {
          setBusy(false);
        }
      },
      () => { setStatus(t.locationDenied); setBusy(false); },
      { enableHighAccuracy: true, timeout: 9000 },
    );
  }

  return (
    <Card className="mt-6 p-4">
      <div className="flex items-start gap-3.5">
        <span className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-[11px] bg-[var(--color-accent-wash)] text-[var(--color-accent)]">
          <IconShare size={22} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold leading-tight">{t.shareLocation}</h2>
          <p className="mt-0.5 text-[13.5px] leading-relaxed text-[var(--color-ink-2)]">
            Sends your exact position to your family over WhatsApp or SMS, so nobody has to describe
            where they are on a bad line.
          </p>
          <Btn className="mt-3" variant="outline" size="sm" onClick={share} disabled={busy}>
            {t.shareLocation}
          </Btn>
          {status && <p className="mt-2 text-[13px] font-semibold text-[var(--color-accent)]">{status}</p>}
          <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-ink-3)]">
            This part is genuinely real, not simulated: it uses the device&apos;s own location and
            the phone&apos;s own share sheet. Your coordinates are never sent to this prototype.
          </p>
        </div>
      </div>
    </Card>
  );
}
