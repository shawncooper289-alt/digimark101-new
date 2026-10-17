"use client"

import { useCallback, useMemo, useState } from "react"
import { useAvaForm } from "@/components/ava/use-ava-form"
import { services, site } from "@/lib/site"

const BUDGETS = ["Not sure yet", "Under $5,000 / month", "$5,000–$10,000 / month", "$10,000–$20,000 / month", "$20,000+ / month"]
const SIZES = [
  ["unspecified", "Not sure"],
  ["1-10", "1–10"],
  ["11-50", "11–50"],
  ["51-200", "51–200"],
  ["201-1000", "201–1,000"],
  ["1000+", "1,000+"],
] as const

type LeadFormProps = {
  initialInterest?: string
}

type FormState = {
  name: string
  email: string
  company: string
  website: string
  service: string
  budget: string
  region: string
  company_size: string
  message: string
  consent_contact: boolean
  consent_share: boolean
  company_website_confirm: string
}

const EMPTY: FormState = {
  name: "",
  email: "",
  company: "",
  website: "",
  service: "",
  budget: "Not sure yet",
  region: "",
  company_size: "unspecified",
  message: "",
  consent_contact: false,
  consent_share: false,
  company_website_confirm: "",
}

const fieldClass = "min-h-11 rounded-2xl border border-ink/15 bg-mist px-3 text-ink"

export function LeadForm({ initialInterest = "" }: LeadFormProps) {
  const [form, setForm] = useState<FormState>({ ...EMPTY, service: initialInterest })
  const [status, setStatus] = useState<"idle" | "sending" | "saved" | "fallback" | "suppressed" | "error">("idle")
  const [error, setError] = useState("")
  const applyFill = useCallback((fills: Record<string, string>) => {
    setForm((current) => ({
      ...current,
      name: fills.name ?? current.name,
      email: fills.email ?? current.email,
      company: fills.company ?? current.company,
      website: fills.website ?? current.website,
      service: fills.service ?? current.service,
      budget: fills.budget ?? current.budget,
      region: fills.region ?? current.region,
      message: fills.message ?? current.message,
    }))
  }, [])
  useAvaForm(applyFill)

  const mailto = useMemo(() => {
    const body = [
      `Name: ${form.name}`,
      `Email: ${form.email}`,
      `Company: ${form.company}`,
      `Website: ${form.website}`,
      `Interest: ${form.service}`,
      `Budget: ${form.budget}`,
      `Region: ${form.region}`,
      "",
      form.message,
    ].join("\n")
    return `mailto:${site.email}?subject=${encodeURIComponent("Project note for DigiMark101")}&body=${encodeURIComponent(body)}`
  }, [form])

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setStatus("sending")
    setError("")
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = (await response.json()) as { ok?: boolean; persisted?: boolean; reason?: string; error?: string }
      if (!response.ok || !data.ok) {
        setStatus("error")
        setError(data.error || "The note could not be sent.")
        return
      }
      if (data.reason === "suppressed") {
        setStatus("suppressed")
        return
      }
      setStatus(data.persisted ? "saved" : "fallback")
    } catch {
      setStatus("error")
      setError("The note could not be sent. Email the studio instead.")
    }
  }

  if (status === "saved") {
    return (
      <div className="rounded-3xl border border-ink/10 bg-card p-6" role="status">
        <h2 className="font-serif text-3xl">The studio has the note.</h2>
        <p className="mt-3 text-ink-soft">
          {form.consent_share
            ? "You allowed this contact to be shared if it qualifies as a premium lead. It is not on a public list until that happens. You can unsubscribe at any time."
            : "It is kept so DigiMark101 can reply. It is not cleared for sharing. You can unsubscribe at any time."}
        </p>
      </div>
    )
  }

  if (status === "suppressed") {
    return (
      <div className="rounded-3xl border border-ink/10 bg-card p-6" role="status">
        <h2 className="font-serif text-3xl">This address is unsubscribed.</h2>
        <p className="mt-3 text-ink-soft">The note was not stored. Email the studio if you still want a reply.</p>
        <a className="btn btn-signal mt-5" href={mailto}>
          Email {site.email}
        </a>
      </div>
    )
  }

  if (status === "fallback") {
    return (
      <div className="rounded-3xl border border-signal/30 bg-mist p-6" role="status">
        <h2 className="font-serif text-3xl">This note was not stored.</h2>
        <p className="mt-3 text-ink-soft">
          Lead storage is not connected on this deployment, so the form cannot keep the message. Email it instead and the studio can reply.
        </p>
        <a className="btn btn-signal mt-5" href={mailto}>
          Email {site.email}
        </a>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="relative grid gap-4 rounded-3xl border border-ink/10 bg-card p-5 sm:p-6" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" name="name" value={form.name} onChange={(value) => update("name", value)} required autoComplete="name" ava />
        <Field label="Email" name="email" type="email" value={form.email} onChange={(value) => update("email", value)} required autoComplete="email" ava />
        <Field label="Company" name="company" value={form.company} onChange={(value) => update("company", value)} autoComplete="organization" ava />
        <Field label="Website" name="website" value={form.website} onChange={(value) => update("website", value)} autoComplete="url" placeholder="https://" ava />
        <Field label="Region" name="region" value={form.region} onChange={(value) => update("region", value)} autoComplete="address-level1" placeholder="State or country" ava />
        <label className="grid gap-1.5 text-sm">
          <span className="font-medium">Company size</span>
          <select
            name="company_size"
            value={form.company_size}
            onChange={(event) => update("company_size", event.target.value)}
            className={fieldClass}
          >
            {SIZES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">What do you need?</span>
        <select
          name="service"
          data-ava-field="service"
          value={form.service}
          onChange={(event) => update("service", event.target.value)}
          className={fieldClass}
        >
          <option value="">Not sure yet</option>
          {services.map((service) => (
            <option key={service.slug} value={service.slug}>
              {service.name}
            </option>
          ))}
          <option value="not-sure">Help me choose</option>
        </select>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">Monthly budget, if you have one</span>
        <select
          name="budget"
          data-ava-field="budget"
          value={form.budget}
          onChange={(event) => update("budget", event.target.value)}
          className={fieldClass}
        >
          {BUDGETS.map((budget) => (
            <option key={budget}>{budget}</option>
          ))}
        </select>
        <span className="text-xs text-ink-soft">A planning range, not a quote. Fees are set in a proposal.</span>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">What should the studio know?</span>
        <textarea
          name="message"
          data-ava-field="message"
          required
          minLength={10}
          rows={6}
          value={form.message}
          onChange={(event) => update("message", event.target.value)}
          className="rounded-2xl border border-ink/15 bg-mist px-3 py-3 text-ink"
          placeholder="The site, the channel that feels stuck, and what a good quarter would look like."
        />
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="consent_contact"
          required
          checked={form.consent_contact}
          onChange={(event) => update("consent_contact", event.target.checked)}
          className="mt-1"
        />
        <span>DigiMark101 may store this note and contact me about it. Required.</span>
      </label>
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="consent_share"
          checked={form.consent_share}
          onChange={(event) => update("consent_share", event.target.checked)}
          className="mt-1"
        />
        <span>If this qualifies as a premium lead, DigiMark101 may share my contact details with a buyer. Leave this off if you only want the studio to reply.</span>
      </label>
      <label className="sr-only" aria-hidden="true">
        Company website confirm
        <input
          tabIndex={-1}
          autoComplete="off"
          value={form.company_website_confirm}
          onChange={(event) => update("company_website_confirm", event.target.value)}
        />
      </label>
      {error ? (
        <p className="text-sm text-signal" role="alert">
          {error} You can also email {site.email}.
        </p>
      ) : null}
      <button type="submit" className="btn btn-signal w-full sm:w-auto" disabled={status === "sending"}>
        {status === "sending" ? "Sending…" : "Send the note"}
      </button>
    </form>
  )
}

function Field({
  label,
  name,
  value,
  onChange,
  type = "text",
  required,
  autoComplete,
  placeholder,
  ava,
}: {
  label: string
  name: string
  value: string
  onChange: (value: string) => void
  type?: string
  required?: boolean
  autoComplete?: string
  placeholder?: string
  ava?: boolean
}) {
  const id = `lead-${name}`
  return (
    <label htmlFor={id} className="grid gap-1.5 text-sm">
      <span className="font-medium">
        {label}
        {required ? <span className="text-signal"> *</span> : null}
      </span>
      <input
        id={id}
        name={name}
        data-ava-field={ava ? name : undefined}
        type={type}
        required={required}
        value={value}
        autoComplete={autoComplete}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className={fieldClass}
      />
    </label>
  )
}
