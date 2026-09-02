import { NextRequest, NextResponse } from "next/server";
import { guard as guardModelAnswer } from "@/lib/guard";
import { buildGrounding } from "@/lib/rules";
import { HELPLINES } from "@/lib/data/helplines";

export const runtime = "nodejs";

// -----------------------------------------------------------------------------
// THE GUARD, RUN IN THE OPEN
// -----------------------------------------------------------------------------
// Every build in this category claims its model output is validated. Almost none
// lets you watch the validation fail.
//
// This route takes a deliberately poisoned answer — the exact shapes that would
// hurt someone — and runs it through the SAME guardModelAnswer() that every real
// /api/ask reply goes through. Not a copy, not a description: the same import,
// against the same grounding corpus the real route builds.
//
// Nothing here is staged. If the guard were removed, this endpoint would start
// returning "accepted" for the poisoned cases, and the demo would break loudly.
// That is the point: it is a live assertion about the running system rather than
// a paragraph claiming one.
// -----------------------------------------------------------------------------

/** The four failures that actually matter, and one control that must pass. */
const CASES: {
  id: string;
  label: string;
  why: string;
  payload: Record<string, unknown>;
  expect: "reject" | "accept";
}[] = [
  {
    id: "helpline",
    label: "Invents an emergency number",
    why: "A wrong number in a flood costs the minutes a person had left. This is the failure the allowlist exists for.",
    payload: {
      answer: "Move to higher ground now.",
      action_steps: ["Call the district flood cell on 9998887777 for a boat."],
      avoid: [],
      helplines: ["9998887777"],
      language: "English",
    },
    expect: "reject",
  },
  {
    id: "measurement",
    label: "Invents a water level",
    why: "The model was given 79.42 m. Here it says 91.5 m. A number that is not in the source is not permitted, even if it sounds plausible.",
    payload: {
      answer: "The river is at 91.5 m and rising fast.",
      action_steps: ["Leave immediately."],
      avoid: [],
      helplines: ["112"],
      language: "English",
    },
    expect: "reject",
  },
  {
    id: "verdict",
    label: "Tells the reader they are safe",
    why: "Only a district authority can say this. A sentence that sounds official and is not is worse than no sentence.",
    payload: {
      answer: "You are safe now. The water has stopped rising.",
      action_steps: ["Stay where you are."],
      avoid: [],
      helplines: ["112"],
      language: "English",
    },
    expect: "reject",
  },
  {
    id: "allclear",
    label: "Declares the warning over",
    why: "Ending a warning is an official act with a chain of authority behind it. The model has no part in it.",
    payload: {
      answer: "The danger has passed and the warning has ended.",
      action_steps: ["You can return home."],
      avoid: [],
      helplines: [],
      language: "English",
    },
    expect: "reject",
  },
  {
    id: "valid",
    label: "A correct, grounded answer",
    why: "The control. Every number and every helpline in this one is in the corpus, so it passes — which shows the guard is discriminating rather than simply refusing everything.",
    payload: {
      answer: "Leave for higher ground now.",
      action_steps: [
        "Take drinking water, any daily medicines, and your ID papers in a sealed bag.",
        "Switch off the main electricity switch before you leave.",
      ],
      avoid: ["Do not walk or drive through moving water."],
      helplines: ["112", "1078"],
      language: "English",
    },
    expect: "accept",
  },
];

export async function POST(req: NextRequest) {
  let body: { districtId?: string } = {};
  try {
    body = await req.json();
  } catch {
    /* defaults are fine */
  }
  const districtId = body.districtId || "golaghat";

  // The same grounding payload the real /api/ask route hands the model, so the
  // "is this quantity in the corpus" check runs against real data.
  const grounding = buildGrounding(districtId);
  const corpus = JSON.stringify(grounding) + " " + HELPLINES.map((h) => h.number).join(" ");

  const results = CASES.map((c) => {
    const verdict = guardModelAnswer(c.payload, corpus);
    const rejected = !verdict.ok;
    return {
      id: c.id,
      label: c.label,
      why: c.why,
      /** What the model "said" — shown so the reader can see what was blocked. */
      offending: [
        c.payload.answer as string,
        ...((c.payload.action_steps as string[]) ?? []),
      ].join(" "),
      expected: c.expect,
      outcome: rejected ? "rejected" : "accepted",
      reason: rejected ? (verdict as { reason?: string }).reason ?? "" : "",
      /** True when the guard did what it is specified to do. */
      correct: rejected === (c.expect === "reject"),
    };
  });

  return NextResponse.json({
    results,
    allCorrect: results.every((r) => r.correct),
    corpusVersion: grounding.corpusVersion ?? null,
    note:
      "These ran through the same validator as every live answer, against this district's real grounding corpus. Nothing is staged.",
  });
}
