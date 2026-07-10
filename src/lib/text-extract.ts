// Client-only text extraction for .txt / .pdf / .docx
export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".txt") || file.type.startsWith("text/")) {
    return await file.text();
  }
  if (name.endsWith(".docx")) {
    const mammoth = await import("mammoth/mammoth.browser");
    const buf = await file.arrayBuffer();
    const { value } = await (mammoth as any).extractRawText({ arrayBuffer: buf });
    return value;
  }
  if (name.endsWith(".pdf")) {
    const pdfjs: any = await import("pdfjs-dist/build/pdf.mjs");
    // Worker URL — use the bundled ESM worker
    const workerSrc = (await import("pdfjs-dist/build/pdf.worker.mjs?url")).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
    const buf = await file.arrayBuffer();
    const doc = await pdfjs.getDocument({ data: buf }).promise;
    let text = "";
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();
      text += content.items.map((i: any) => i.str).join(" ") + "\n";
    }
    return text;
  }
  throw new Error("Unsupported file type. Upload .txt, .pdf or .docx.");
}