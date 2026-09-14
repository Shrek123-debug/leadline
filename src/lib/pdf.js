// jsPDF is loaded on demand (dynamic import), not at page load. Its default
// bundle pulls in html2canvas + dompurify for an HTML-rendering feature we
// never use, which would otherwise bloat every single page load for a
// feature most visitors never touch.

const MARGIN = 18;
const WIDTH = 210 - MARGIN * 2; // A4 width in mm, minus margins

/** Renders a plain-text letter as a simple formatted PDF and triggers a download. */
export async function letterToPdf(text, { filename = "letter.pdf", heading = "Letter" } = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(heading, MARGIN, y);
  y += 10;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const lines = doc.splitTextToSize(text, WIDTH);
  for (const line of lines) {
    if (y > 287 - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(line, MARGIN, y);
    y += 5.5;
  }

  doc.save(filename);
}

/** Renders a one-page "know your rights" summary: result, action plan, and key facts. */
export async function summaryToPdf({ address, resultLabel, resultHeadline, steps, areaInfo, citywide, attribution, lang, filename = "leadline-summary.pdf" }) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  let y = MARGIN;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LeadLine", MARGIN, y);
  y += 8;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(address || "", MARGIN, y);
  y += 8;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  const labelLines = doc.splitTextToSize(resultLabel, WIDTH);
  labelLines.forEach((l) => {
    doc.text(l, MARGIN, y);
    y += 6;
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  const headLines = doc.splitTextToSize(resultHeadline, WIDTH);
  headLines.forEach((l) => {
    doc.text(l, MARGIN, y);
    y += 5;
  });
  y += 4;

  if (areaInfo && citywide) {
    doc.setFont("helvetica", "italic");
    const ctx = doc.splitTextToSize(
      `${areaInfo.name}: ${areaInfo.pctRequiresReplacement}% require replacement (citywide: ${citywide.pctRequiresReplacement}%).`,
      WIDTH
    );
    ctx.forEach((l) => {
      doc.text(l, MARGIN, y);
      y += 5;
    });
    y += 4;
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(lang === "es" ? "Próximos pasos" : "Next steps", MARGIN, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10.5);
  steps.forEach((step, i) => {
    const stepLines = doc.splitTextToSize(`${i + 1}. ${step}`, WIDTH);
    stepLines.forEach((l) => {
      if (y > 287 - MARGIN) {
        doc.addPage();
        y = MARGIN;
      }
      doc.text(l, MARGIN, y);
      y += 5.5;
    });
    y += 1.5;
  });

  y += 4;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8.5);
  const attrLines = doc.splitTextToSize(attribution, WIDTH);
  attrLines.forEach((l) => {
    if (y > 287 - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
    doc.text(l, MARGIN, y);
    y += 4;
  });

  doc.save(filename);
}
