declare module 'pdf-parse' {
  type PdfResult = {
    text: string;
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: unknown;
    version: string;
  };
  export default function pdfParse(buffer: Buffer): Promise<PdfResult>;
}
