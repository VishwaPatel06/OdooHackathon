import CompanySettingsForm from "@/components/settings/company-settings-form"

export default function CompanySettingsPage() {
  return (
    <section>
      <h1 className="text-2xl md:text-3xl font-bold">Company Settings</h1>
      <p className="mt-2 text-sm text-muted-foreground">Configure company-wide preferences and integrations.</p>

      <div className="mt-6">
        <CompanySettingsForm />
      </div>
    </section>
  )
}
