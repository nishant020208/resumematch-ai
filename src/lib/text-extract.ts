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
    return await extractPdfText(file);
  }
  throw new Error("Unsupported file type. Upload .txt, .pdf or .docx.");
}

async function extractPdfText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();

  // Tier 1: Try bundled / installed pdfjs-dist with reliable CDN worker URL
  try {
    const pdfjs: any = await import("pdfjs-dist");
    const pdfLib = pdfjs?.getDocument ? pdfjs : (pdfjs?.default?.getDocument ? pdfjs.default : null);
    if (pdfLib) {
      const version = pdfjs.version || "4.10.38";
      if (pdfLib.GlobalWorkerOptions) {
        pdfLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${version}/pdf.worker.min.mjs`;
      }
      const doc = await pdfLib.getDocument({ data: new Uint8Array(buf) }).promise;
      let text = "";
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        text += content.items.map((i: any) => i.str).join(" ") + "\n";
      }
      if (text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (e) {
    console.warn("Primary pdfjs-dist import failed, trying CDN fallback:", e);
  }

  // Tier 2: Try fetching PDF.js from CDN directly
  try {
    const cdnUrl = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.min.mjs";
    const pdfjsCdn: any = await import(/* @vite-ignore */ cdnUrl);
    const pdfLib = pdfjsCdn?.getDocument ? pdfjsCdn : (pdfjsCdn?.default?.getDocument ? pdfjsCdn.default : null);
    if (pdfLib) {
      if (pdfLib.GlobalWorkerOptions) {
        pdfLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.10.38/pdf.worker.min.mjs";
      }
      const doc = await pdfLib.getDocument({ data: new Uint8Array(buf) }).promise;
      let text = "";
      for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        text += content.items.map((i: any) => i.str).join(" ") + "\n";
      }
      if (text.trim().length > 0) {
        return text.trim();
      }
    }
  } catch (e) {
    console.warn("CDN pdfjs fallback failed, using native stream extractor:", e);
  }

  // Tier 3: Zero-dependency native PDF stream parser (handles compressed and uncompressed streams)
  try {
    const nativeText = await extractPdfTextNative(buf);
    if (nativeText && nativeText.trim().length > 0) {
      return nativeText.trim();
    }
  } catch (e) {
    console.warn("Native PDF stream parser error:", e);
  }

  throw new Error("Could not extract text from PDF. Please ensure the file contains readable text.");
}

async function extractPdfTextNative(buf: ArrayBuffer): Promise<string> {
  const bytes = new Uint8Array(buf);
  let textResult = "";

  // Convert bytes to Latin-1 string for pattern matching
  let binStr = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binStr += String.fromCharCode.apply(null, sub as unknown as number[]);
  }

  // Match PDF stream objects
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match: RegExpExecArray | null;

  while ((match = streamRegex.exec(binStr)) !== null) {
    const streamStartPos = match.index;
    const rawStreamContent = match[1];

    // Check header for FlateDecode
    const headerSlice = binStr.substring(Math.max(0, streamStartPos - 500), streamStartPos);
    const isFlate = /Filter\s*\/FlateDecode|Filter\s*\[\s*\/FlateDecode\s*\]/i.test(headerSlice);

    let streamText = "";

    if (isFlate) {
      const rawStart = match.index + match[0].indexOf(rawStreamContent);
      const rawEnd = rawStart + rawStreamContent.length;
      const compressedBytes = bytes.subarray(rawStart, rawEnd);

      const decompressedBytes = await decompressBytes(compressedBytes);
      if (decompressedBytes) {
        streamText = bytesToString(decompressedBytes);
      }
    } else {
      streamText = rawStreamContent;
    }

    if (streamText) {
      const extracted = parsePdfStreamText(streamText);
      if (extracted) {
        textResult += extracted + "\n";
      }
    }
  }

  if (!textResult.trim()) {
    textResult = parsePdfStreamText(binStr);
  }

  return textResult;
}

async function decompressBytes(compressedBytes: Uint8Array): Promise<Uint8Array | null> {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const ds = new DecompressionStream("deflate");
    const writer = ds.writable.getWriter();
    await writer.write(compressedBytes as any);
    await writer.close();
    const arrayBuffer = await new Response(ds.readable).arrayBuffer();
    return new Uint8Array(arrayBuffer);
  } catch {
    try {
      const ds = new DecompressionStream("deflate-raw");
      const writer = ds.writable.getWriter();
      await writer.write(compressedBytes as any);
      await writer.close();
      const arrayBuffer = await new Response(ds.readable).arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } catch {
      return null;
    }
  }
}

function bytesToString(bytes: Uint8Array): string {
  let str = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const sub = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    str += String.fromCharCode.apply(null, sub as unknown as number[]);
  }
  return str;
}

function parsePdfStreamText(streamText: string): string {
  let extracted = "";

  // 1. Match (text) Tj, (text) ', (text) "
  const tjRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)\s*(?:Tj|'|")/g;
  let match: RegExpExecArray | null;
  while ((match = tjRegex.exec(streamText)) !== null) {
    extracted += unescapePdfString(match[1]) + " ";
  }

  // 2. Match [(text1) -123 (text2)] TJ
  const tjArrayRegex = /\[([^\]]+)\]\s*TJ/g;
  while ((match = tjArrayRegex.exec(streamText)) !== null) {
    const arrayContent = match[1];
    const strInArrRegex = /\(([^)\\]*(?:\\.[^)\\]*)*)\)/g;
    let strMatch: RegExpExecArray | null;
    while ((strMatch = strInArrRegex.exec(arrayContent)) !== null) {
      extracted += unescapePdfString(strMatch[1]);
    }
    extracted += " ";
  }

  return extracted;
}

function unescapePdfString(str: string): string {
  return str
    .replace(/\\([()])/g, "$1")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\\t/g, "\t")
    .replace(/\\\\/g, "\\")
    .replace(/\\(\d{3})/g, (_, oct) => String.fromCharCode(parseInt(oct, 8)));
}