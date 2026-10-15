"use client"

import { useCallback, useMemo, useState } from "react"
import { useAvaForm } from "@/components/ava/use-ava-form"
import { services, site } from "@/lib/site"

const BUDGETS = ["Not sure yet", "Under $5,000 / month", "$5,000–$10,000 / month", "$10,000–$20,000 / month", "$20,000+ / month"]

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
  message: string
  company_website_confirm: string
}

const EMPTY: FormState = {
  name: "",
  email: "",
  company: "",
  website: "",
  service: "",
  budget: "Not sure yet",
  message: "",
  company_website_confirm: "",
}

export function LeadForm({ initialInterest = "" }: LeadFormProps) {
  const [form, setForm] = useState<FormState>({ ...EMPTY, service: initialInterest })
  const [status, setStatus] = useState<"idle" | "sending" | "saved" | "fallback" | "error">("idle")
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
      const data = (await response.json()) as { ok?: boolean; persisted?: boolean; error?: string }
      if (!response.ok || !data.ok) {
        setStatus("error")
        setError(data.error || "The note could not be sent.")
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
        <p className="mt-3 text-ink-soft">It is stored for DigiMark101. A person replies by email. Ava does not send that reply.</p>
      </div>
    )
  }

  if (status === "fallback") {
    return (
      <div className="rounded-3xl border border-signal/30 bg-[#f4e9fb] p-6" role="status">
        <h2 className="font-serif text-3xl">This note was not stored.</h2>
        <p className="mt-3 text-ink-soft">
          Supabase is not connected on this deployment, so the form cannot keep the message. Email it instead and the studio can reply.
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
      </div>
      <label className="grid gap-1.5 text-sm">
        <span className="font-medium">What do you need?</span>
        <select
          name="service"
          data-ava-field="service"
          value={form.service}
          onChange={(event) => update("service", event.target.value)}
          className="min-h-11 rounded-2xl border border-ink/15 bg-white px-3"
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
          className="min-h-11 rounded-2xl border border-ink/15 bg-white px-3"
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
          className="rounded-2xl border border-ink/15 bg-white px-3 py-3"
          placeholder="The site, the channel that feels stuck, and what a good quarter would look like."
        />
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
        className="min-h-11 rounded-2xl border border-ink/15 bg-white px-3"
      />
    </label>
  )
}
