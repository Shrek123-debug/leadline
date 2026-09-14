import React, { useState, useEffect, useRef } from "react";
import { lookupAddress, worstEntry, MATERIAL_LABELS, CLASS_LABELS } from "./lib/lookup.js";
import { STRINGS, TONES, contextSentence, actionPlanSteps } from "./lib/i18n.js";

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
  const [lang, setLang] = useState("en");
  const t = STRINGS[lang];

  const [view, setView] = useState("lookup"); // "lookup" | "compare"

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
  const [isOnline, setIsOnline] = useState(typeof navigator !== "undefined" ? navigator.onLine : true);

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

  // Track online/offline so the letter generator can honestly say it needs a connection.
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

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
  const catStrings = catKey ? t.categories[catKey] : null;
  const cat = catStrings ? { ...catStrings, tone: TONES[catKey] } : null;
  const atRisk = catKey && catKey !== "nonlead" && catKey !== "invalid";

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
    if (!isOnline) return;
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
      language: lang === "es" ? "Spanish" : "English",
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
      setLetterErr(t.letter.error);
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
      lines.push(contextSentence(lang, areaInfo.name, areaInfo.pctRequiresReplacement, citywide.pctRequiresReplacement));
    }
    lines.push(`${lang === "es" ? "Datos al" : "Data as of"} ${t.dateLabel}. ${lang === "es" ? "Verificado con LeadLine." : "Checked via LeadLine."}`);
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
        <div className="ll-head-right">
          <nav className="ll-nav">
            <button className={view === "lookup" ? "on" : ""} onClick={() => setView("lookup")}>
              {t.nav.lookup}
            </button>
            <button className={view === "compare" ? "on" : ""} onClick={() => setView("compare")}>
              {t.nav.compare}
            </button>
          </nav>
          <button className="ll-lang-btn" onClick={() => setLang(lang === "en" ? "es" : "en")}>
            {lang === "en" ? "Español" : "English"}
          </button>
        </div>
      </header>

      {!isOnline && <div className="ll-offline-banner">{t.offlineBanner}</div>}

      {view === "compare" ? (
        <CompareView t={t} communityStats={communityStats} onBack={() => setView("lookup")} />
      ) : (
        <>
          <section className="ll-hero">
            <p className="ll-kicker">{t.hero.kicker}</p>
            <h1 className="ll-h1">{t.hero.h1}</h1>
            <p className="ll-sub">{t.hero.sub}</p>

            <div className="ll-search">
              <input
                className="ll-input"
                placeholder={dataset ? t.hero.placeholder : t.hero.placeholderLoading}
                value={address}
                disabled={!dataset && !dataError}
                onChange={(e) => setAddress(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && runLookup()}
                aria-label="Chicago address"
              />
              <button className="ll-go" onClick={runLookup} disabled={!dataset}>
                {t.hero.go}
              </button>
            </div>
            {dataError && (
              <p className="ll-err" style={{ color: "#9E3B2E", marginTop: 10 }}>
                {t.hero.dataErr}
              </p>
            )}

            <div className="ll-chips">
              <span className="ll-chips-lab">{t.hero.tryLabel}</span>
              {["3510 W Franklin Blvd", "4518 W Gladys Ave", "600 N Wells St"].map((s) => (
                <button key={s} className="ll-chip" onClick={() => setAddress(s)}>
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section className="ll-about">
            <span className="ll-about-lab">{t.about.toTailor}</span>
            <div className="ll-seg">
              <button className={tenure === "rent" ? "on" : ""} onClick={() => setTenure("rent")}>{t.about.rent}</button>
              <button className={tenure === "own" ? "on" : ""} onClick={() => setTenure("own")}>{t.about.own}</button>
            </div>
            <label className="ll-check">
              <input type="checkbox" checked={kids} onChange={(e) => setKids(e.target.checked)} /> {t.about.kids}
            </label>
            <label className="ll-check">
              <input type="checkbox" checked={pregnant} onChange={(e) => setPregnant(e.target.checked)} /> {t.about.pregnant}
            </label>
          </section>

          {result && cat && (
            <section className="ll-result" ref={resultRef}>
              <div className={"ll-verdict tone-" + cat.tone}>
                <div className="ll-verdict-top">
                  <div className="ll-verdict-word">{cat.label}</div>
                  <span className="ll-snapshot-tag">
                    {lang === "es" ? "Datos al" : "Data as of"} {t.dateLabel}
                  </span>
                </div>
                <p className="ll-verdict-head">{cat.headline}</p>
                {cat.body && <p className="ll-verdict-body">{cat.body}</p>}
              </div>

              <div className="ll-share-row">
                <button className="ll-ghost small" onClick={shareLink}>
                  {copyState === "link" ? t.share.shareCopied : t.share.shareDefault}
                </button>
                <button className="ll-ghost small" onClick={copySummary}>
                  {copyState === "summary" ? t.share.summaryCopied : t.share.summaryDefault}
                </button>
              </div>

              {result.status === "not_found" && result.suggestions.length > 0 && (
                <div className="ll-suggest">
                  <p>{t.suggest}</p>
                  <div className="ll-chips">
                    {result.suggestions.map((s) => (
                      <button key={s} className="ll-chip" onClick={() => setAddress(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {worst && (
                <>
                  {result.entries.length > 1 && <p className="ll-multi-note">{t.multiNote(result.entries.length)}</p>}
                  <div className="ll-parts">
                    <Part name={t.parts.gooseneck} val={worst.g} sub={t.parts.goosenecksub} />
                    <Part name={t.parts.public} val={worst.p} sub={t.parts.publicsub} />
                    <Part name={t.parts.private} val={worst.s} sub={t.parts.privatesub} />
                  </div>
                </>
              )}

              {areaInfo && citywide && (
                <div className="ll-context">
                  <h2 className="ll-h2">{t.context.heading}</h2>
                  <p className="ll-context-line">
                    {contextSentence(lang, areaInfo.name, areaInfo.pctRequiresReplacement, citywide.pctRequiresReplacement)}
                  </p>
                  <CompareBar label={areaInfo.name} pct={areaInfo.pctRequiresReplacement} />
                  <CompareBar label={t.context.cityLabel} pct={citywide.pctRequiresReplacement} muted />
                  <p className="ll-context-sub">
                    {t.context.subFacts(areaInfo.pctPoverty, areaInfo.pctMinority, areaInfo.medianIncome)}
                  </p>
                </div>
              )}

              <div className="ll-plan">
                <h2 className="ll-h2">{t.plan.heading}</h2>
                <ol className="ll-steps">
                  {actionPlanSteps(lang, { catKey, kids, pregnant, tenure }).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ol>
                {catKey !== "nonlead" && catKey !== "invalid" && (
                  <button className="ll-ghost" onClick={downloadReminder}>
                    {t.plan.reminderBtn}
                  </button>
                )}
              </div>

              {atRisk && (
                <div className="ll-letter">
                  <h2 className="ll-h2">{t.letter.heading}</h2>
                  <p className="ll-letter-sub">{t.letter.sub}</p>

                  <div className="ll-seg wide">
                    <button className={target === "landlord" ? "on" : ""} onClick={() => setTarget("landlord")}>
                      {t.letter.landlord}
                    </button>
                    <button className={target === "alderman" ? "on" : ""} onClick={() => setTarget("alderman")}>
                      {t.letter.alderman}
                    </button>
                  </div>

                  <button className="ll-primary" onClick={generateLetter} disabled={letterLoading || !isOnline}>
                    {!isOnline
                      ? t.letter.offline
                      : letterLoading
                      ? t.letter.writing
                      : letter
                      ? t.letter.rewrite
                      : t.letter.generate}
                  </button>

                  {letterErr && <p className="ll-err">{letterErr}</p>}

                  {letter && (
                    <>
                      <textarea className="ll-textarea" value={letter} onChange={(e) => setLetter(e.target.value)} rows={16} />
                      <div className="ll-letter-actions">
                        <button className="ll-ghost" onClick={copyLetter}>{t.letter.copy}</button>
                        <button className="ll-ghost" onClick={emailLetter}>{t.letter.email}</button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}

      <footer className="ll-foot">
        <p>
          {t.footer.attribution}{" "}
          <a href="https://insideclimatenews.org" target="_blank" rel="noreferrer">Inside Climate News</a>,{" "}
          <a href="https://www.wbez.org" target="_blank" rel="noreferrer">WBEZ</a>,{" "}
          {lang === "es" ? "y" : "and"}{" "}
          <a href="https://grist.org" target="_blank" rel="noreferrer">Grist</a>
          {t.footer.attributionEnd}
        </p>
        <p>{t.footer.leadPaint}</p>
        <p>{t.footer.privacy}</p>
        <p>{t.footer.offlineNote}</p>
      </footer>
    </div>
  );
}

function CompareView({ t, communityStats, onBack }) {
  if (!communityStats) {
    return (
      <section className="ll-compare">
        <button className="ll-ghost small" onClick={onBack}>{t.compare.back}</button>
        <p style={{ marginTop: 20 }}>…</p>
      </section>
    );
  }
  const ranked = Object.values(communityStats.areas)
    .slice()
    .sort((a, b) => b.pctRequiresReplacement - a.pctRequiresReplacement)
    .slice(0, 20);

  return (
    <section className="ll-compare">
      <button className="ll-ghost small" onClick={onBack}>{t.compare.back}</button>
      <h1 className="ll-h1" style={{ fontSize: 30, marginTop: 18 }}>{t.compare.heading}</h1>
      <p className="ll-sub">{t.compare.sub}</p>
      <p className="ll-compare-avg">{t.compare.citywideAvg(communityStats.citywide.pctRequiresReplacement)}</p>

      <div className="ll-compare-list">
        {ranked.map((area, i) => (
          <div className="ll-compare-row" key={area.name}>
            <span className="ll-compare-rank">{i + 1}</span>
            <div className="ll-compare-bar-wrap">
              <div className="ll-bar-label">
                {area.name} <span className="ll-bar-pct">{area.pctRequiresReplacement}%</span>
              </div>
              <div className="ll-bar-track">
                <div className="ll-bar-fill" style={{ width: `${Math.min(area.pctRequiresReplacement, 100)}%` }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
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
