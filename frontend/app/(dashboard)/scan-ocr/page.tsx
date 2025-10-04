import OcrScanner from "@/components/ocr/ocr-scanner"

export default function ScanOcrPage() {
  return (
    <section>
      <h1 className="text-2xl md:text-3xl font-bold text-pretty">Scan with OCR</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Upload or capture a receipt image. Text extraction runs in your browser using Tesseract.js.
      </p>
      <div className="my-6 h-px bg-border" />
      <OcrScanner />
    </section>
  )
}
