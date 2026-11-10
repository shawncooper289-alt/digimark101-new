"use client"

import Link from "next/link"
import { useCallback, useEffect, useState, useSyncExternalStore } from "react"
import { useAvaForm } from "@/components/ava/use-ava-form"
import { usePlatform } from "@/components/studio/platform-provider"
import {
  answersFromFields,
  fieldsFromDraft,
  nicheBranch,
  questionLabel,
  visiblePlaybook,
} from "@/lib/ava/onboarding-playbook"
import { isNoRoadblock, NO_ROADBLOCK_NOTE } from "@/lib/onboarding/growth-plan"
import {
  patchSetupDraft,
  EMPTY_SETUP_DRAFT,
  readSetupDraft,
  subscribeSetupDraft,
  writeSetupDraft,
  type SetupPath,
} from "@/lib/onboarding/setup-draft"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const inputClass = "min-h-11 w-full rounded-2xl border border-ink/15 bg-mist px-3 text-ink"

function choosePath(path: SetupPath) {
  patchSetupDraft({ path })
  if (path === "ava") {
    window.dispatchEvent(new CustomEvent("ava:ask", { detail: "set up my account" }))
  }
}

export function AccountSetup() {
  const draft = useSyncExternalStore(subscribeSetupDraft, readSetupDraft, () => EMPTY_SETUP_DRAFT)
  const platform = usePlatform()
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState("")
  const branch = nicheBranch(draft.answers.niche)
  const questions = visiblePlaybook(branch)
  const step = Math.min(draft.step, questions.length)
  const reviewing = draft.path === "manual" && step >= questions.length
  const showReview = reviewing || draft.phase === "confirm" || draft.phase === "saved"
  const preview = fieldsFromDraft(draft.answers, draft.planEdited ? draft.plan : undefined)
  const plan = draft.planEdited ? draft.plan : preview.growth_plan || ""

  const applyFill = useCallback((fills: Record<string, string>) => {
    const next: Record<string, string> = {}
    if (fills.name) next.name = fills.name
    if (fills.email) next.email = fills.email
    if (fills.company) next.business_name = fills.company
    if (fills.website || fills.site) next.website = fills.website || fills.site
    if (fills.region) {
      const place = nicheBranch(readSetupDraft().answers.niche) === "ecommerce" ? "ship_area" : "service_area"
      next[place] = fills.region
    }
    if (fills.message) next.goals = fills.message
    if (fills.brief) next.offer = fills.brief
    if (Object.keys(next).length) patchSetupDraft({ answers: next })
  }, [])
  useAvaForm(applyFill)

  useEffect(() => {
    if (!platform.email) return
    const current = readSetupDraft()
    if (current.answers.email?.trim()) return
    patchSetupDraft({ answers: { email: platform.email } })
  }, [platform.email])

  useEffect(() => {
    let cancelled = false
    fetch("/api/onboarding/save")
      .then((response) => response.json())
      .then((data: { fields?: Record<string, string | null>; complete?: boolean }) => {
        if (cancelled || !data.fields) return
        const current = readSetupDraft()
        writeSetupDraft({
          ...current,
          answers: { ...answersFromFields(data.fields), ...current.answers },
          plan: current.plan || (typeof data.fields.growth_plan === "string" ? data.fields.growth_plan : ""),
          phase: current.phase === "idle" && data.complete ? "saved" : current.phase,
        })
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [])

  function setAnswer(id: string, value: string) {
    patchSetupDraft({ answers: { [id]: value } })
  }

  function goNext(value: string) {
    const question = questions[step]
    if (!question) return
    const trimmed = value.trim()
    if (question.id === "email" && trimmed && !EMAIL.test(trimmed)) {
      setError("That email needs an @ and a dot, like name@example.com. Or leave it blank for now.")
      return
    }
    setError("")
    patchSetupDraft({ answers: { [question.id]: trimmed }, step: step + 1 })
  }

  async function confirm() {
    setBusy(true)
    setError("")
    setNotice("")
    const fields = fieldsFromDraft(readSetupDraft().answers, readSetupDraft().planEdited ? readSetupDraft().plan : undefined)
    try {
      const response = await fetch("/api/onboarding/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...fields, onboarding_complete: true }),
      })
      const body = (await response.json()) as { error?: string }
      if (!response.ok) {
        setError(body.error || "Could not save your setup.")
        return
      }
      const current = readSetupDraft()
      writeSetupDraft({ ...current, phase: "saved", plan: fields.growth_plan || current.plan, planEdited: true })
      setNotice("Saved. Your setup and the first growth plan are on your account. Nothing has been published or sent.")
    } catch {
      setError("Could not save your setup.")
    } finally {
      setBusy(false)
    }
  }

  const question = questions[step]

  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Account setup</p>
      <h1 className="display mt-2 text-4xl md:text-5xl">Let&apos;s set this up the easy way.</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Two ways. Fill in the form, or just talk with Ava. You can switch whenever you want, and your answers stay put. Nothing is saved until you look it over and confirm.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-2" role="group" aria-label="How do you want to set up your account">
        <button
          type="button"
          aria-pressed={draft.path === "manual"}
          className={`rounded-3xl border p-5 text-left ${draft.path === "manual" ? "border-signal bg-mist" : "border-ink/10 bg-card"}`}
          onClick={() => choosePath("manual")}
        >
          <span className="font-serif text-2xl">I&apos;ll fill it in</span>
          <span className="mt-2 block text-sm text-ink-soft">One short question at a time. You type the answers yourself.</span>
        </button>
        <button
          type="button"
          aria-pressed={draft.path === "ava"}
          className={`rounded-3xl border p-5 text-left ${draft.path === "ava" ? "border-signal bg-mist" : "border-ink/10 bg-card"}`}
          onClick={() => choosePath("ava")}
        >
          <span className="font-serif text-2xl">Just talk with Ava</span>
          <span className="mt-2 block text-sm text-ink-soft">She asks in plain words, one at a time. Type, or turn on Voice and talk. Then you can edit the summary.</span>
        </button>
      </div>

      {draft.path === "choose" ? (
        <p className="mt-6 text-sm text-ink-soft">Pick one to start. You are not stuck with it.</p>
      ) : null}

      {draft.path === "ava" && !showReview ? (
        <div className="mt-6 rounded-3xl border border-ink/10 bg-card p-5">
          <h2 className="font-serif text-2xl">Ava has the questions</h2>
          <p className="mt-2 text-sm text-ink-soft">
            She&apos;s the assistant in the corner. Turn on Voice in her chat if you want her to speak each question and listen for your answer. Typing still works. Her voice stays the same.
          </p>
          <button type="button" className="btn btn-signal mt-4" onClick={() => choosePath("ava")}>
            Talk with Ava
          </button>
          <AnswerList answers={draft.answers} />
          <button type="button" className="btn btn-ghost mt-4" onClick={() => patchSetupDraft({ path: "manual", step: questions.length })}>
            Review and edit on the form
          </button>
        </div>
      ) : null}

      {draft.path === "manual" && question && !showReview ? (
        <form
          className="mt-6 rounded-3xl border border-ink/10 bg-card p-5"
          onSubmit={(event) => {
            event.preventDefault()
            const data = new FormData(event.currentTarget)
            goNext(String(data.get("answer") ?? ""))
          }}
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-signal">
            Question {step + 1} of {questions.length}
          </p>
          <label htmlFor="setup-answer" className="mt-3 block font-serif text-2xl leading-snug">
            {question.ask}
          </label>
          <input
            id="setup-answer"
            name="answer"
            value={draft.answers[question.id] ?? ""}
            onChange={(event) => setAnswer(question.id, event.target.value)}
            data-ava-field={fillName(question.id)}
            autoComplete={question.id === "email" ? "email" : question.id === "name" ? "given-name" : "off"}
            className={`${inputClass} mt-4`}
          />
          {question.id === "roadblock" && isNoRoadblock(draft.answers.roadblock) ? (
            <p className="mt-2 text-sm text-ink-soft">I&apos;ll save this as: {NO_ROADBLOCK_NOTE}</p>
          ) : null}
          {question.suggestions.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {question.suggestions.map((suggestion) => (
                <button key={suggestion} type="button" className="rounded-full border border-ink/15 px-3 py-2 text-sm hover:border-signal" onClick={() => goNext(suggestion)}>
                  {suggestion}
                </button>
              ))}
            </div>
          ) : null}
          {error ? <p className="mt-3 text-sm text-signal" role="alert">{error}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="submit" className="btn btn-signal">{step + 1 === questions.length ? "Review" : "Next"}</button>
            {step > 0 ? (
              <button type="button" className="btn btn-ghost" onClick={() => patchSetupDraft({ step: step - 1 })}>
                Back
              </button>
            ) : null}
            <button type="button" className="btn btn-ghost" onClick={() => choosePath("ava")}>
              Switch to talking with Ava
            </button>
          </div>
        </form>
      ) : null}

      {showReview ? (
        <div className="mt-6 rounded-3xl border border-ink/10 bg-card p-5">
          <h2 className="font-serif text-2xl">{draft.phase === "saved" ? "Saved setup" : "Look this over"}</h2>
          <p className="mt-2 text-sm text-ink-soft">
            {draft.phase === "saved"
              ? "This is on your account. Change anything, then confirm again. Nothing is published from here."
              : draft.path === "ava"
                ? "Ava filled this from what you told her. Change anything, then confirm. You can also say yes in her chat. Nothing is written until then."
                : "These are your answers. Change anything, then confirm. Nothing is written until then."}
          </p>
          <div className="mt-4 grid gap-3">
            {questions.map((item) => (
              <label key={item.id} className="grid gap-1 text-sm" htmlFor={`review-${item.id}`}>
                <span className="font-medium">{questionLabel(item.id)}</span>
                <input
                  id={`review-${item.id}`}
                  value={draft.answers[item.id] ?? ""}
                  onChange={(event) => setAnswer(item.id, event.target.value)}
                  data-ava-field={fillName(item.id)}
                  className={inputClass}
                />
                {item.id === "roadblock" && isNoRoadblock(draft.answers.roadblock) ? (
                  <span className="text-xs text-ink-soft">Saved as: {NO_ROADBLOCK_NOTE}</span>
                ) : null}
              </label>
            ))}
            <label className="grid gap-1 text-sm" htmlFor="review-plan">
              <span className="font-medium">First growth plan</span>
              <textarea
                id="review-plan"
                rows={5}
                value={plan}
                onChange={(event) => writeSetupDraft({ ...readSetupDraft(), plan: event.target.value, planEdited: true })}
                className={`${inputClass} py-2`}
              />
            </label>
          </div>
          {error ? <p className="mt-3 text-sm text-signal" role="alert">{error}</p> : null}
          {notice ? <p className="mt-3 text-sm" role="status">{notice}</p> : null}
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" className="btn btn-signal" disabled={busy} onClick={() => void confirm()}>
              {busy ? "Saving…" : "Confirm and save"}
            </button>
            {draft.path === "manual" ? (
              <button type="button" className="btn btn-ghost" onClick={() => patchSetupDraft({ step: Math.max(0, questions.length - 1), phase: "asking" })}>
                Back to questions
              </button>
            ) : (
              <button type="button" className="btn btn-ghost" onClick={() => choosePath("ava")}>
                Keep talking with Ava
              </button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => choosePath(draft.path === "ava" ? "manual" : "ava")}>
              {draft.path === "ava" ? "Switch to the form" : "Switch to talking with Ava"}
            </button>
          </div>
          {draft.phase === "saved" ? (
            <p className="mt-4 text-sm text-ink-soft">
              <Link href="/studio" className="underline">Go to Today</Link>
              {" · "}
              <Link href="/studio/business" className="underline">Add the legal name and tax number later</Link>
              . Only you can see those.
            </p>
          ) : (
            <p className="mt-4 text-sm text-ink-soft">
              Need an account first? <Link href="/signup?next=/studio/setup" className="underline">Create one</Link> or <Link href="/login?next=/studio/setup" className="underline">sign in</Link>. Your answers stay in this browser until you confirm.
            </p>
          )}
        </div>
      ) : null}
    </section>
  )
}

function AnswerList({ answers }: { answers: Record<string, string> }) {
  const rows = visiblePlaybook(nicheBranch(answers.niche))
    .map((item) => ({ id: item.id, label: questionLabel(item.id), value: answers[item.id]?.trim() ?? "" }))
    .filter((item) => item.value)
  if (!rows.length) return <p className="mt-4 text-sm text-ink-soft">Your answers will show up here as you talk, so you can switch to the form without losing them.</p>
  return (
    <dl className="mt-4 grid gap-2" aria-live="polite">
      {rows.map((row) => (
        <div key={row.id}>
          <dt className="text-xs font-semibold uppercase tracking-[0.14em] text-signal">{row.label}</dt>
          <dd className="text-sm">{row.id === "roadblock" && isNoRoadblock(row.value) ? NO_ROADBLOCK_NOTE : row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

function fillName(id: string) {
  if (id === "name") return "name"
  if (id === "business_name") return "company"
  if (id === "email") return "email"
  if (id === "website") return "website"
  if (id === "service_area" || id === "ship_area") return "region"
  if (id === "goals") return "message"
  if (id === "offer") return "brief"
  return id
}
