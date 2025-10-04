"use client"

import * as React from "react"
import Image from "next/image"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"

type NumberFormat = "en-US" | "de-DE"
type DateFormat = "YYYY-MM-DD" | "MM/DD/YYYY" | "DD/MM/YYYY"

const timezones = [
  "UTC",
  "America/New_York",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Asia/Kolkata",
  "Asia/Tokyo",
] as const

const currencies = ["USD", "EUR", "GBP", "INR", "JPY"] as const

const ocrLanguages = [
  { value: "eng", label: "English" },
  { value: "spa", label: "Spanish" },
  { value: "fra", label: "French" },
  { value: "deu", label: "German" },
]

export default function CompanySettingsForm() {
  const { toast } = useToast()

  const [companyName, setCompanyName] = React.useState("Acme Inc.")
  const [legalName, setLegalName] = React.useState("Acme Incorporated")
  const [supportEmail, setSupportEmail] = React.useState("support@acme.inc")
  const [supportPhone, setSupportPhone] = React.useState("+1 555 0100")
  const [address, setAddress] = React.useState("")
  const [logoFile, setLogoFile] = React.useState<File | null>(null)
  const [logoPreview, setLogoPreview] = React.useState<string | null>(null)

  const [currency, setCurrency] = React.useState<(typeof currencies)[number]>("USD")
  const [timezone, setTimezone] = React.useState<(typeof timezones)[number]>("UTC")
  const [dateFormat, setDateFormat] = React.useState<DateFormat>("YYYY-MM-DD")
  const [numberFormat, setNumberFormat] = React.useState<NumberFormat>("en-US")

  const [multiCurrency, setMultiCurrency] = React.useState(true)
  const [approvalThreshold, setApprovalThreshold] = React.useState<number>(1000)
  const [ocrAutoCategorize, setOcrAutoCategorize] = React.useState(true)
  const [ocrLang, setOcrLang] = React.useState("eng")

  const [weeklySummary, setWeeklySummary] = React.useState(true)
  const [billingEmail, setBillingEmail] = React.useState("billing@acme.inc")
  const [agingAlertDays, setAgingAlertDays] = React.useState<number>(5)

  const [enforce2FA, setEnforce2FA] = React.useState(false)
  const [sessionTimeoutMins, setSessionTimeoutMins] = React.useState<number>(60)

  // Create and cleanup preview URL
  React.useEffect(() => {
    if (!logoFile) {
      setLogoPreview(null)
      return
    }
    const url = URL.createObjectURL(logoFile)
    setLogoPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [logoFile])

  const onLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) setLogoFile(file)
  }

  const handleSave = async () => {
    // In a real app, POST these settings. Here we just toast and simulate latency.
    await new Promise((r) => setTimeout(r, 500))
    toast({
      title: "Settings saved",
      description: "Your company preferences have been updated.",
    })
  }

  const handleReset = () => {
    setCompanyName("Acme Inc.")
    setLegalName("Acme Incorporated")
    setSupportEmail("support@acme.inc")
    setSupportPhone("+1 555 0100")
    setAddress("")
    setLogoFile(null)

    setCurrency("USD")
    setTimezone("UTC")
    setDateFormat("YYYY-MM-DD")
    setNumberFormat("en-US")

    setMultiCurrency(true)
    setApprovalThreshold(1000)
    setOcrAutoCategorize(true)
    setOcrLang("eng")

    setWeeklySummary(true)
    setBillingEmail("billing@acme.inc")
    setAgingAlertDays(5)

    setEnforce2FA(false)
    setSessionTimeoutMins(60)

    toast({ title: "Settings reset", description: "Defaults restored." })
  }

  return (
    <form
      className="grid grid-cols-1 gap-6 md:grid-cols-2"
      onSubmit={(e) => {
        e.preventDefault()
        handleSave()
      }}
      aria-label="Company settings form"
    >
      {/* Organization */}
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="text-balance">Organization</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label htmlFor="companyName">Company Name</Label>
            <Input
              id="companyName"
              className="mt-1"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Inc."
            />
          </div>
          <div>
            <Label htmlFor="legalName">Legal Name</Label>
            <Input
              id="legalName"
              className="mt-1"
              value={legalName}
              onChange={(e) => setLegalName(e.target.value)}
              placeholder="Registered legal entity"
            />
          </div>
          <div>
            <Label htmlFor="supportEmail">Support Email</Label>
            <Input
              id="supportEmail"
              type="email"
              className="mt-1"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@company.com"
            />
          </div>
          <div>
            <Label htmlFor="supportPhone">Support Phone</Label>
            <Input
              id="supportPhone"
              className="mt-1"
              value={supportPhone}
              onChange={(e) => setSupportPhone(e.target.value)}
              placeholder="+1 555 ..."
            />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              className="mt-1"
              rows={3}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Street, City, State, ZIP, Country"
            />
          </div>
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-[1fr_auto] items-start gap-4">
            <div>
              <Label htmlFor="logo">Company Logo</Label>
              <Input id="logo" type="file" accept="image/*" className="mt-1" onChange={onLogoChange} />
              <p className="mt-2 text-xs text-muted-foreground">PNG or SVG recommended. Max 2MB.</p>
            </div>
            <div className="flex flex-col items-start gap-2">
              {logoPreview ? (
                <div className="rounded-md border p-2">
                  {/* Using next/image for optimization; crossOrigin not needed for local previews */}
                  <Image
                    src={logoPreview || "/placeholder.svg"}
                    alt="Logo preview"
                    width={96}
                    height={96}
                    className="rounded"
                  />
                </div>
              ) : (
                <div className="rounded-md border p-6 text-sm text-muted-foreground">No logo selected</div>
              )}
              {logoPreview && (
                <Button variant="secondary" type="button" onClick={() => setLogoFile(null)} className="mt-1">
                  Remove
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Localization */}
      <Card>
        <CardHeader>
          <CardTitle>Localization</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div>
            <Label>Default Currency</Label>
            <Select value={currency} onValueChange={(v) => setCurrency(v as any)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {currencies.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Timezone</Label>
            <Select value={timezone} onValueChange={(v) => setTimezone(v as any)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select timezone" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {timezones.map((tz) => (
                  <SelectItem key={tz} value={tz}>
                    {tz}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Date Format</Label>
              <Select value={dateFormat} onValueChange={(v) => setDateFormat(v as DateFormat)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select date format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                  <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                  <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Number Format</Label>
              <Select value={numberFormat} onValueChange={(v) => setNumberFormat(v as NumberFormat)}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select number format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-US">1,234.56</SelectItem>
                  <SelectItem value="de-DE">1.234,56</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>Preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="cursor-pointer">Enable Multi-currency</Label>
              <p className="text-xs text-muted-foreground">Allow expenses in multiple currencies.</p>
            </div>
            <Switch checked={multiCurrency} onCheckedChange={setMultiCurrency} aria-label="Enable Multi-currency" />
          </div>

          <div>
            <Label htmlFor="approvalThreshold">Require Manager Approval Over</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="approvalThreshold"
                type="number"
                min={0}
                value={approvalThreshold}
                onChange={(e) => setApprovalThreshold(Number(e.target.value))}
                className="w-36"
              />
              <span className="text-sm text-muted-foreground">{currency}</span>
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="cursor-pointer">Auto-categorize with OCR</Label>
              <p className="text-xs text-muted-foreground">Use OCR data to suggest categories.</p>
            </div>
            <Switch
              checked={ocrAutoCategorize}
              onCheckedChange={setOcrAutoCategorize}
              aria-label="Auto-categorize with OCR"
            />
          </div>

          <div>
            <Label>Default OCR Language</Label>
            <Select value={ocrLang} onValueChange={setOcrLang}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {ocrLanguages.map((l) => (
                  <SelectItem key={l.value} value={l.value}>
                    {l.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle>Notifications</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="cursor-pointer">Weekly Summary Email</Label>
              <p className="text-xs text-muted-foreground">Send a summary every Monday morning.</p>
            </div>
            <Switch checked={weeklySummary} onCheckedChange={setWeeklySummary} aria-label="Weekly summary" />
          </div>

          <div>
            <Label htmlFor="billingEmail">Billing Email</Label>
            <Input
              id="billingEmail"
              type="email"
              className="mt-1"
              value={billingEmail}
              onChange={(e) => setBillingEmail(e.target.value)}
              placeholder="billing@company.com"
            />
          </div>

          <div>
            <Label htmlFor="agingAlertDays">Approval Aging Alert</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="agingAlertDays"
                type="number"
                min={0}
                className="w-28"
                value={agingAlertDays}
                onChange={(e) => setAgingAlertDays(Number(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">days</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="cursor-pointer">Enforce 2FA</Label>
              <p className="text-xs text-muted-foreground">Require two-factor authentication for all users.</p>
            </div>
            <Switch checked={enforce2FA} onCheckedChange={setEnforce2FA} aria-label="Enforce 2FA" />
          </div>

          <div>
            <Label htmlFor="sessionTimeout">Session Timeout</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                id="sessionTimeout"
                type="number"
                min={5}
                className="w-28"
                value={sessionTimeoutMins}
                onChange={(e) => setSessionTimeoutMins(Number(e.target.value))}
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="md:col-span-2 flex items-center justify-end gap-2">
        <Button type="button" variant="secondary" onClick={handleReset}>
          Reset
        </Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  )
}
