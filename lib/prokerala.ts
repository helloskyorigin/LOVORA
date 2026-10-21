import "server-only";
import type { JourneyDraft, PreviewInsight } from "./context";

type OAuthToken = { access_token?: unknown; expires_in?: unknown };
type Position = { id?: unknown; name?: unknown; rasi?: { id?: unknown; name?: unknown } };
type PlanetPayload = { status?: string; data?: { planet_position?: Position[] } };

let cachedToken: { token: string; expires: number } | null = null;
const pending = new Map<string, Promise<PreviewInsight>>();
const previewCache = new Map<string, { expires: number; insight: PreviewInsight }>();

const ZODIAC = [
  ["Aries","Expression of affection may be associated with openness and initiative.","स्नेह की अभिव्यक्ति को पहल और सीधेपन से जोड़ा जाता है।"],
  ["Taurus","Traditional readings associate affection with steadiness and a desire for comfort.","पारंपरिक व्याख्याएँ स्नेह को स्थिरता और सहजता से जोड़ती हैं।"],
  ["Gemini","Communication and curiosity are often emphasized in symbolic relationship readings.","पारंपरिक संकेत रिश्तों में संवाद और जिज्ञासा पर ज़ोर देते हैं।"],
  ["Cancer","Emotional security and caring bonds are common symbolic themes.","भावनात्मक सुरक्षा और देखभाल को पारंपरिक विषय माना जाता है।"],
  ["Leo","Warmth, self-expression and appreciation are often highlighted symbolically.","अपनापन, अभिव्यक्ति और सराहना को प्रतीकात्मक रूप से महत्व दिया जाता है।"],
  ["Virgo","Thoughtful care and attention to everyday details may be emphasized.","सोच-समझकर देखभाल और छोटी बातों पर ध्यान देने का प्रतीक माना जाता है।"],
  ["Libra","Balance and mutual understanding are traditional symbolic partnership themes.","संतुलन और आपसी समझ को पारंपरिक साझेदारी के संकेत माना जाता है।"],
  ["Scorpio","Depth, emotional intensity and trust may feature in traditional interpretations.","गहराई, भावनात्मक तीव्रता और विश्वास को प्रमुख प्रतीक माना जाता है।"],
  ["Sagittarius","Shared exploration, independence and openness may be highlighted.","साझा अनुभव, स्वतंत्रता और खुलेपन को रिश्तों से जोड़ा जाता है।"],
  ["Capricorn","Commitment, patience and long-term effort are common symbolic themes.","प्रतिबद्धता, धैर्य और दीर्घकालीन प्रयास को पारंपरिक विषय माना जाता है।"],
  ["Aquarius","Friendship, individuality and shared ideas are often emphasized.","दोस्ती, व्यक्तित्व और साझा विचारों को पारंपरिक संकेत माना जाता है।"],
  ["Pisces","Sensitivity, imagination and emotional empathy are common symbolic themes.","संवेदनशीलता, कल्पनाशीलता और सहानुभूति को प्रमुख प्रतीक माना जाता है।"],
] as const;

function credentials(): { id: string; secret: string } {
  const id = process.env.PROKERALA_CLIENT_ID?.trim();
  const secret = process.env.PROKERALA_CLIENT_SECRET?.trim();
  if (!id || !secret) throw new Error("PROKERALA_NOT_CONFIGURED");
  return { id, secret };
}

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.expires > Date.now() + 60_000) return cachedToken.token;
  const { id, secret } = credentials();
  const response = await fetch("https://api.prokerala.com/token", {
    method: "POST", cache: "no-store", signal: AbortSignal.timeout(12000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }),
  });
  if (!response.ok) throw new Error("PROKERALA_AUTH_FAILED");
  const value = await response.json() as OAuthToken;
  if (typeof value.access_token !== "string" || !value.access_token) throw new Error("PROKERALA_AUTH_FAILED");
  const seconds = typeof value.expires_in === "number" && Number.isFinite(value.expires_in) ? value.expires_in : 3600;
  cachedToken = { token: value.access_token, expires: Date.now() + Math.max(120, seconds) * 1000 };
  return cachedToken.token;
}

// Convert a historical local birth time in the verified IANA timezone to an
// absolute UTC instant. No fixed 'today' UTC offset and no fake noon fallback.
export function resolveBirthUTC(date: string, time: string, zone: string): Date {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const wall = Date.UTC(year, month - 1, day, hour, minute);
  if (!Number.isFinite(wall)) throw new Error("INVALID_BIRTH_TIME");
  const formatter = new Intl.DateTimeFormat("en-GB", {
    timeZone: zone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
  });
  function parts(instant: number) {
    const raw = formatter.formatToParts(new Date(instant));
    const dict = Object.fromEntries(raw.map(item => [item.type, item.value]));
    return { year: Number(dict.year), month: Number(dict.month), day: Number(dict.day),
      hour: Number(dict.hour), minute: Number(dict.minute), second: Number(dict.second) };
  }
  function offset(ms: number) {
    const p = parts(ms);
    return Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - Math.floor(ms / 1000) * 1000;
  }
  let instant = wall - offset(wall);
  for (let i = 0; i < 3; i++) instant = wall - offset(instant);
  const check = parts(instant);
  if (check.year !== year || check.month !== month || check.day !== day || check.hour !== hour || check.minute !== minute) {
    throw new Error("AMBIGUOUS_BIRTH_TIME");
  }
  return new Date(instant);
}

async function fetchPositions(draft: JourneyDraft, token: string): Promise<PlanetPayload> {
  if (!draft.birthTime || !draft.timeKnown) throw new Error("BIRTH_TIME_REQUIRED");
  const datetime = resolveBirthUTC(draft.dateOfBirth, draft.birthTime, draft.place.timezone).toISOString();
  const url = new URL("https://api.prokerala.com/v2/astrology/planet-position");
  url.searchParams.set("ayanamsa", "1");
  url.searchParams.set("coordinates", draft.place.latitude + "," + draft.place.longitude);
  url.searchParams.set("datetime", datetime);
  url.searchParams.set("la", "en");
  const response = await fetch(url.toString(), {
    cache: "no-store", signal: AbortSignal.timeout(14000),
    headers: { Authorization: "Bearer " + token, Accept: "application/json" },
  });
  if (response.status === 401) { cachedToken = null; throw new Error("PROKERALA_AUTH_FAILED"); }
  if (response.status === 429) throw new Error("ASTROLOGY_RATE_LIMIT");
  if (!response.ok) throw new Error("ASTROLOGY_UNAVAILABLE");
  return await response.json() as PlanetPayload;
}

function extractVenus(value: PlanetPayload): PreviewInsight {
  const planets = value.data?.planet_position;
  if (value.status !== "ok" || !Array.isArray(planets)) throw new Error("UNSUPPORTED_CHART_RESPONSE");
  const venus = planets.find(planet => planet.id === 3 || (typeof planet.name === "string" && planet.name.toLowerCase() === "venus"));
  if (!venus?.rasi || typeof venus.rasi.name !== "string") throw new Error("UNSUPPORTED_CHART_RESPONSE");
  const index = ZODIAC.findIndex(([name]) => name.toLowerCase() === (venus.rasi?.name as string).trim().toLowerCase());
  if (index < 0) throw new Error("UNSUPPORTED_CHART_RESPONSE");
  const [sign, descriptionEn, descriptionHi] = ZODIAC[index];
  return { planet: "Venus", sign, signId: index + 1, descriptionEn, descriptionHi,
    source: "Prokerala planet-position", ayanamsa: "Lahiri", generatedAt: Date.now() };
}

export async function calculateFreeInsight(draft: JourneyDraft, cacheKey: string): Promise<PreviewInsight> {
  const hit = previewCache.get(cacheKey);
  if (hit && hit.expires > Date.now()) return hit.insight;
  const ongoing = pending.get(cacheKey);
  if (ongoing) return ongoing;
  if (previewCache.size > 500) previewCache.clear();
  const run = (async () => {
    const token = await accessToken();
    const data = await fetchPositions(draft, token);
    const insight = extractVenus(data);
    previewCache.set(cacheKey, { insight, expires: Date.now() + 10 * 60_000 });
    return insight;
  })();
  pending.set(cacheKey, run);
  try { return await run; } finally { pending.delete(cacheKey); }
}
