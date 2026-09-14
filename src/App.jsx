import React, { useState, useEffect, useRef } from "react";
import { lookupAddress, worstEntry, MATERIAL_LABELS, CLASS_LABELS } from "./lib/lookup.js";

const DATA_SNAPSHOT = "April 2025";

const CATEGORY = {
  lead: {
    label: "Lead",
    tone: "danger",
    headline: "At least one part of your service line is known to be lead.",
    body:
      "Lead can dissolve or flake into your tap water — most when water has been sitting in the pipe. Having a lead line does not guarantee elevated lead (the city adds corrosion control), but you should act as if it could be present until a test says otherwise.",
  },
  galvanized: {
    label: "Galvanized — needs replacement",
    tone: "danger",
    headline: "Your line has galvanized steel that needs replacing.",
    body:
      "Galvanized steel can trap and later release lead particles from lead pipe it was once connected to. The city classifies this as requiring replacement, so treat it like a lead result.",
  },
  suspected: {
    label: "Suspected lead",
    tone: "warn",
    headline: "The city doesn't have confirmed data for your line.",
    body:
      "This is NOT a clean bill of health. “Suspected” means unknown — often based on the building's age — not safe. A free test is the only way to know.",
  },
  nonlead: {
    label: "No lead found",
    tone: "safe",
    headline: "No lead or lead-contaminable material is recorded for your line.",
    body:
      "The city's inventory is incomplete and can contain errors, and interior plumbing or fixtures can still carry lead. A test is still the only way to be certain, but your recorded risk is low.",
  },
  notfound: {
    label: "Address not found",
    tone: "warn",
    headline: "Your address isn't in the inventory — that doesn't mean you're safe.",
    body:
      "Many addresses are missing because one service line often serves several units, or the line is filed under a nearby intersection. Try a neighbor's address or request a free test to be sure.",
  },
  invalid: {
    label: "Couldn't read that address",
    tone: "warn",
    headline: "Start with the house number, like “1034 N Wells St”.",
    body: "",
  },
};

const VERIFIED_FACTS = `
- Chicago has more lead service lines than any U.S. city (an estimated 400,000+ still in the ground).
- Under its current plan the city does not expect to finish replacing all lead service lines until roughly 2076 — decades behind the federal deadline.
- The city has been slow to notify residents that they may have lead pipes.
- Free water testing kits are available to residents by calling 311.
- If lead is confirmed, residents may qualify for city programs covering pipe replacement and for a free water filter.
- A tenant does not own the service line, but landlords are responsible for the building's plumbing and can request testing and replacement.
- The city advises running cold water at least 5 minutes before drinking or cooking whenever it has sat unused for 6+ hours.
`.trim();

export default function App() {
  const [dataset, setDataset] = useState(null);
  const [dataError, setDataError] = useState(false);
  const [communityStats, setCommunityStats] = useState(null);

  const [address, setAddress] = useState("");
  const [result, setResult] = useState(null);
  const [tenure, setTenure] = useState("rent");
  const [kids, setKids] = useState(false);
  const [pregnant, setPregnant] = useState(false);

  const [target, setTarget] = useState("landlord");
  const [letter, setLetter] = useState("");
  const [letterLoading, setLetterLoading] = useState(false);
  const [letterErr, setLetterErr] = useState("");

  const [copyState, setCopyState] = useState(""); // "link" | "summary" | ""

  const resultRef = useRef(null);
  const autoRanFromUrl = useRef(false);

  useEffect(() => {
    fetch("/data/service-lines.json")
      .then((r) => {
        if (!r.ok) throw new Error("bad response");
        return r.json();
      })
      .then(setDataset)
      .catch(() => setDataError(true));

    // Small file (~12KB) — failing quietly here just means the context
    // line and comparison chart don't show, the core app still works.
    fetch("/data/community-stats.json")
      .then((r) => (r.ok ? r.json() : null))
      .then(setCommunityStats)
      .catch(() => setCommunityStats(null));

    // If someone opened a shared link (?address=...), pre-fill it so the
    // lookup can run automatically once the dataset finishes loading.
    const params = new URLSearchParams(window.location.search);
    const shared = params.get("address");
    if (shared) setAddress(shared);
  }, []);

  // Auto-run the lookup once from a shared link, as soon as the dataset is ready.
  useEffect(() => {
    if (dataset && address && !autoRanFromUrl.current) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("address")) {
        autoRanFromUrl.current = true;
        runLookup();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset]);

  function runLookup() {
    if (!dataset) return;
    const r = lookupAddress(address, dataset);
    setResult(r);
    setLetter("");
    setLetterErr("");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
  }

  const worst = result?.status === "found" ? worstEntry(result.entries) : null;

  const areaInfo =
    result?.status === "found" && communityStats && result.area != null
      ? communityStats.areas[String(result.area)]
      : null;
  const citywide = communityStats?.citywide;
  const catKey = worst ? CLASS_LABELS[worst.c] : result?.status === "not_found" ? "notfound" : result?.status === "invalid" ? "invalid" : null;
  const cat = catKey ? CATEGORY[catKey] : null;
  const atRisk = catKey && catKey !== "nonlead" && catKey !== "invalid";

  function actionPlan() {
    if (!catKey || catKey === "invalid") return [];
    const steps = [];
    if (catKey === "notfound") {
      steps.push("Call 311 to request a free lead water test — the safest way to know when your address isn't listed.");
      steps.push("Check the suggested nearby addresses below — your line may be filed under a neighboring number.");
      return steps;
    }
    if (catKey !== "nonlead") {
      steps.push("Call 311 to request a free lead water test — it's the only way to know your actual levels.");
      if (kids || pregnant)
        steps.push("Use only cold, filtered water for drinking, cooking, and baby formula. Hot tap water pulls in more lead.");
      steps.push("Run cold water 5+ minutes before drinking or cooking whenever the tap has sat unused for 6 hours or more.");
      steps.push("Use a filter certified for lead (look for NSF/ANSI 53). Ask if you qualify for the city's free filter program.");
      if (tenure === "rent")
        steps.push("Send your landlord the letter below — they own the building's plumbing and can request testing and replacement.");
      else steps.push("Check your eligibility for the city's lead service line replacement program.");
    } else {
      steps.push("Low recorded risk — but interior plumbing and fixtures can still carry lead. A free 311 test confirms it.");
      steps.push("Still worth flushing after long idle periods, especially first thing in the morning.");
    }
    return steps;
  }

  function downloadReminder() {
    const ics = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//LeadLine//Chicago//EN",
      "BEGIN:VEVENT",
      "UID:leadline-flush-" + Date.now() + "@leadline",
      "SUMMARY:Flush tap 5 min before drinking (LeadLine)",
      "RRULE:FREQ=DAILY",
      "DTSTART:20260101T070000",
      "DTEND:20260101T070500",
      "DESCRIPTION:Run cold water ~5 minutes before drinking or cooking after the tap has sat overnight.",
      "END:VEVENT",
      "END:VCALENDAR",
    ].join("\r\n");
    const blob = new Blob([ics], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flush-reminder.ics";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function generateLetter() {
    setLetterLoading(true);
    setLetterErr("");
    setLetter("");

    const situation = {
      resultLabel: cat.label,
      resultHeadline: cat.headline,
      target,
      tenure,
      kids,
      pregnant,
      address,
      verifiedFacts: VERIFIED_FACTS,
    };

    try {
      const res = await fetch("/.netlify/functions/generate-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(situation),
      });
      if (!res.ok) throw new Error("bad response");
      const data = await res.json();
      if (!data.letter) throw new Error("empty");
      setLetter(data.letter);
    } catch (e) {
      setLetterErr("Couldn't generate the letter just now. Check your connection and try again.");
    } finally {
      setLetterLoading(false);
    }
  }

  function copyLetter() {
    navigator.clipboard?.writeText(letter);
  }
  function emailLetter() {
    const subject = encodeURIComponent(
      target === "landlord" ? "Request: test our water for lead" : "Request: help with lead pipe testing in our neighborhood"
    );
    window.location.href = `mailto:?subject=${subject}&body=${encodeURIComponent(letter)}`;
  }

  function shareLink() {
    const url = `${window.location.origin}${window.location.pathname}?address=${encodeURIComponent(address)}`;
    navigator.clipboard?.writeText(url);
    setCopyState("link");
    setTimeout(() => setCopyState(""), 2000);
  }

  function copySummary() {
    const lines = [`LeadLine result for ${address}:`, `${cat.label} — ${cat.headline}`];
    if (areaInfo && citywide) {
      lines.push(
        `In ${areaInfo.name}, ${areaInfo.pctRequiresReplacement}% of service lines require replacement (citywide: ${citywide.pctRequiresReplacement}%).`
      );
    }
    lines.push(`Data as of ${DATA_SNAPSHOT}. Checked via LeadLine.`);
    navigator.clipboard?.writeText(lines.join("\n"));
    setCopyState("summary");
    setTimeout(() => setCopyState(""), 2000);
  }

  return (
    <div className="ll-root">
      <header className="ll-head">
        <div className="ll-mark">
          <span className="ll-dot" /> LeadLine
        </div>
        <div className="ll-loc">Chicago lead service line checker</div>
      </header>

      <section className="ll-hero">
        <p className="ll-kicker">Chicago has more lead water pipes than any U.S. city.</p>
        <h1 className="ll-h1">
          Find out what's under your street — and get the letter that gets it tested.
        </h1>
        <p className="ll-sub">
          The city won't finish replacing every lead line until around 2076, and it has barely started warning
          residents. Look up your address, then take action in one tap.
        </p>

        <div className="ll-search">
          <input
            className="ll-input"
            placeholder={dataset ? "Enter a Chicago address" : "Loading Chicago dataset…"}
            value={address}
            disabled={!dataset && !dataError}
            onChange={(e) => setAddress(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && runLookup()}
            aria-label="Chicago address"
          />
          <button className="ll-go" onClick={runLookup} disabled={!dataset}>
            Check my line
          </button>
        </div>
        {dataError && (
          <p className="ll-err" style={{ color: "#9E3B2E", marginTop: 10 }}>
            Couldn't load the address dataset. Refresh, or check your connection.
          </p>
        )}

        <div className="ll-chips">
          <span className="ll-chips-lab">Try a sample:</span>
          {["3510 W Franklin Blvd", "4518 W Gladys Ave", "600 N Wells St"].map((s) => (
            <button key={s} className="ll-chip" onClick={() => setAddress(s)}>
              {s}
            </button>
          ))}
        </div>
      </section>

      <section className="ll-about">
        <span className="ll-about-lab">To tailor your steps:</span>
        <div className="ll-seg">
          <button className={tenure === "rent" ? "on" : ""} onClick={() => setTenure("rent")}>I rent</button>
          <button className={tenure === "own" ? "on" : ""} onClick={() => setTenure("own")}>I own</button>
        </div>
        <label className="ll-check">
          <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} /> Young kids at home
        </label>
        <label className="ll-check">
          <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} /> Someone pregnant
        </label>
      </section>

      {result && cat && (
        <section className="ll-result" ref={resultRef}>
          <div className={"ll-verdict tone-" + cat.tone}>
            <div className="ll-verdict-top">
              <div className="ll-verdict-word">{cat.label}</div>
              <span className="ll-snapshot-tag">Data as of {DATA_SNAPSHOT}</span>
            </div>
            <p className="ll-verdict-head">{cat.headline}</p>
            {cat.body && <p className="ll-verdict-body">{cat.body}</p>}
          </div>

          <div className="ll-share-row">
            <button className="ll-ghost small" onClick={shareLink}>
              {copyState === "link" ? "Link copied!" : "Share this result"}
            </button>
            <button className="ll-ghost small" onClick={copySummary}>
              {copyState === "summary" ? "Copied!" : "Copy summary"}
            </button>
          </div>

          {result.status === "not_found" && result.suggestions.length > 0 && (
            <div className="ll-suggest">
              <p>Nearby addresses on record — tap one if it's your building:</p>
              <div className="ll-chips">
                {result.suggestions.map((s) => (
                  <button key={s} className="ll-chip" onClick={() => { setAddress(s); }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {worst && (
            <>
              {result.entries.length > 1 && (
                <p className="ll-multi-note">
                  This address has {result.entries.length} distinct service lines on record (common for multi-unit
                  buildings). Showing the highest-risk one below — your specific unit may differ.
                </p>
              )}
              <div className="ll-parts">
                <Part name="Gooseneck" val={worst.g} sub="connects to the water main" />
                <Part name="Public side" val={worst.p} sub="under the sidewalk — city-owned" />
                <Part name="Private side" val={worst.s} sub="runs into your home" />
              </div>
            </>
          )}

          {areaInfo && citywide && (
            <div className="ll-context">
              <h2 className="ll-h2">Your neighborhood, in context</h2>
              <p className="ll-context-line">
                In <strong>{areaInfo.name}</strong>, <strong>{areaInfo.pctRequiresReplacement}%</strong> of service
                lines require replacement
                {areaInfo.pctRequiresReplacement > citywide.pctRequiresReplacement
                  ? ` — higher than the citywide rate of ${citywide.pctRequiresReplacement}%.`
                  : areaInfo.pctRequiresReplacement < citywide.pctRequiresReplacement
                  ? ` — lower than the citywide rate of ${citywide.pctRequiresReplacement}%.`
                  : ` — about the same as the citywide rate.`}
              </p>
              <CompareBar label={areaInfo.name} pct={areaInfo.pctRequiresReplacement} />
              <CompareBar label="Chicago citywide" pct={citywide.pctRequiresReplacement} muted />
              <p className="ll-context-sub">
                {areaInfo.pctPoverty}% poverty rate · {areaInfo.pctMinority}% minority population · median household
                income ${areaInfo.medianIncome.toLocaleString()}. Chicago's lead pipe burden falls hardest on
                lower-income and minority neighborhoods.
              </p>
            </div>
          )}

          <div className="ll-plan">
            <h2 className="ll-h2">Your next steps</h2>
            <ol className="ll-steps">
              {actionPlan().map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {catKey !== "nonlead" && catKey !== "invalid" && (
              <button className="ll-ghost" onClick={downloadReminder}>
                Add a daily flush reminder to my calendar
              </button>
            )}
          </div>

          {atRisk && (
            <div className="ll-letter">
              <h2 className="ll-h2">Send a letter that gets it tested</h2>
              <p className="ll-letter-sub">Drafted from verified city facts only — edit anything before you send it.</p>

              <div className="ll-seg wide">
                <button className={target === "landlord" ? "on" : ""} onClick={() => setTarget("landlord")}>
                  To my landlord
                </button>
                <button className={target === "alderman" ? "on" : ""} onClick={() => setTarget("alderman")}>
                  To my alderman
                </button>
              </div>

              <button className="ll-primary" onClick={generateLetter} disabled={letterLoading}>
                {letterLoading ? "Writing your letter…" : letter ? "Rewrite letter" : "Generate my letter"}
              </button>

              {letterErr && <p className="ll-err">{letterErr}</p>}

              {letter && (
                <>
                  <textarea className="ll-textarea" value={letter} onChange={(e) => setLetter(e.target.value)} rows={16} />
                  <div className="ll-letter-actions">
                    <button className="ll-ghost" onClick={copyLetter}>Copy</button>
                    <button className="ll-ghost" onClick={emailLetter}>Open in email</button>
                  </div>
                </>
              )}
            </div>
          )}
        </section>
      )}

      <footer className="ll-foot">
        <p>
          Data: Chicago Dept. of Water Management service line inventory (April 2025), as cleaned and geocoded by{" "}
          <a href="https://insideclimatenews.org" target="_blank" rel="noreferrer">Inside Climate News</a>,{" "}
          <a href="https://www.wbez.org" target="_blank" rel="noreferrer">WBEZ</a>, and{" "}
          <a href="https://grist.org" target="_blank" rel="noreferrer">Grist</a>. This dataset is a snapshot and may
          contain errors or gaps — a free 311 test is the only way to confirm your result.
        </p>
        <p>Lead paint, not pipes, is still the leading cause of lead poisoning in Chicago children.</p>
        <p>Privacy: your address stays on your device. Nothing is saved except when you choose to generate a letter.</p>
      </footer>
    </div>
  );
}

function CompareBar({ label, pct, muted }) {
  return (
    <div className="ll-bar-row">
      <div className="ll-bar-label">
        {label} <span className="ll-bar-pct">{pct}%</span>
      </div>
      <div className="ll-bar-track">
        <div
          className={"ll-bar-fill" + (muted ? " muted" : "")}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
    </div>
  );
}

function Part({ name, val, sub }) {
  const label = MATERIAL_LABELS[val] || val || "Unknown";
  const bad = val === "L" || val === "GRR";
  const unk = val === "U";
  return (
    <div className="ll-part">
      <div className="ll-part-name">{name}</div>
      <div className={"ll-part-val " + (bad ? "bad" : unk ? "unk" : "ok")}>{label}</div>
      <div className="ll-part-sub">{sub}</div>
    </div>
  );
}
