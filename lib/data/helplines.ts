// -----------------------------------------------------------------------------
// HELPLINES — these are the only numbers in the product, and they are REAL.
// -----------------------------------------------------------------------------
// The assistant is not permitted to output any number that is not in this array.
// The validator in lib/guard.ts enforces that at runtime: a model reply that
// contains a phone-shaped string not present here is rejected outright rather
// than shown. That rule exists because a hallucinated emergency number is the
// single most dangerous failure this product could have.
// -----------------------------------------------------------------------------

export interface Helpline {
  number: string;
  name: string;
  detail: string;
  /** Shown on the emergency surface, not just the directory. */
  primary?: boolean;
}

export const HELPLINES: Helpline[] = [
  { number: "112", name: "Emergency Response Support System", detail: "Police, fire and ambulance, one number, all India", primary: true },
  { number: "108", name: "Ambulance", detail: "Medical emergency and patient transport", primary: true },
  { number: "1078", name: "NDMA control room", detail: "National disaster helpline", primary: true },
  { number: "101", name: "Fire", detail: "Fire and rescue services", primary: true },
  { number: "1070", name: "State relief commissioner", detail: "State-level disaster control room" },
  { number: "1077", name: "District control room", detail: "District Disaster Management Authority" },
  { number: "1091", name: "Women's helpline", detail: "Round the clock" },
  { number: "1098", name: "Childline", detail: "Children in distress" },
  { number: "14567", name: "Elderline", detail: "Support for senior citizens" },
  { number: "104", name: "Health advice", detail: "State health helpline" },
];

/** Every phone-shaped token the assistant is allowed to say. */
export const ALLOWED_NUMBERS = new Set(HELPLINES.map((h) => h.number));
