"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Copy, Loader2, Trash2, Upload } from "lucide-react"
import Tesseract from "tesseract.js"

export default function OcrScanner() {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [text, setText] = useState("")
  const [status, setStatus] = useState<string>("Idle")
  const [progress, setProgress] = useState<number>(0)
  const [isRunning, setIsRunning] = useState(false)
  const fileRef = useRef<HTMLInputElement | null>(null)

  const canScan = useMemo(() => !!imageUrl && !isRunning, [imageUrl, isRunning])

  const onSelectFile = useCallback((file?: File | null) => {
    if (!file) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setText("")
    setProgress(0)
    setStatus("Ready")
  }, [])

  async function handleScan() {
    if (!imageUrl) return
    setIsRunning(true)
    setStatus("Initializing")
    setProgress(0)

    try {
      const { data } = await Tesseract.recognize(imageUrl, "eng", {
        logger: (m) => {
          if (m.status) setStatus(m.status)
          if (typeof m.progress === "number") setProgress(Math.round(m.progress * 100))
        },
      })
      setText(data.text || "")
      setStatus("Done")
      setProgress(100)
    } catch (err: any) {
      console.error("[v0] OCR error:", err)
      setStatus("Error")
    } finally {
      setIsRunning(false)
    }
  }

  function handleClear() {
    if (imageUrl) URL.revokeObjectURL(imageUrl)
    setImageUrl(null)
    setText("")
    setStatus("Idle")
    setProgress(0)
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(text)
      setStatus("Copied")
      setTimeout(() => setStatus("Done"), 1000)
    } catch {
      // no-op
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-pretty">Upload or Capture Image</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Input
              ref={fileRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(e) => onSelectFile(e.target.files?.[0] || null)}
              aria-label="Upload receipt image"
            />
            <Button variant="outline" type="button" onClick={() => fileRef.current?.click()} className="gap-2">
              <Upload className="size-4" />
              Choose Image
            </Button>
            <Button disabled={!canScan} onClick={handleScan} className="gap-2">
              {isRunning ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Scanning...
                </>
              ) : (
                "Scan with OCR"
              )}
            </Button>
            <Button variant="ghost" type="button" onClick={handleClear} disabled={!imageUrl && !text} className="gap-2">
              <Trash2 className="size-4" />
              Clear
            </Button>
          </div>

          {isRunning || progress > 0 ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="secondary">{status}</Badge>
              </div>
              <Progress value={progress} aria-label="OCR progress" />
            </div>
          ) : null}

          <div className="rounded-md border overflow-hidden">
            {imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageUrl || "/placeholder.svg"}
                alt="Selected receipt to scan"
                className="w-full h-auto object-contain"
              />
            ) : (
              <div className="p-8 text-center text-sm text-muted-foreground">
                Select or capture a receipt image to start OCR.
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-pretty">Extracted Text</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCopy} disabled={!text} className="gap-2 bg-transparent">
              <Copy className="size-4" />
              Copy
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={18}
            placeholder="OCR result will appear here..."
            aria-label="OCR result text"
            className="resize-y"
          />
        </CardContent>
      </Card>
    </div>
  )
}
