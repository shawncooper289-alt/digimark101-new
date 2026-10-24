"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";

const questions = [
  { key: "client_name", label: "What is your full name?", required: true },
  { key: "personal_email", label: "What is your personal email?", required: true },
  { key: "business_email", label: "What is your business email?", required: false },
  { key: "business_name", label: "What is your business or product name?", required: true },
  { key: "personal_phone", label: "What is your personal cellphone number?", required: false },
  { key: "business_phone", label: "What is your business phone number?", required: false },
  { key: "business_address", label: "What is your business address?", required: false },
  { key: "business_website", label: "What is your business website?", required: true },
  { key: "facebook_url", label: "Please paste your Facebook page URL.", required: false },
  { key: "instagram_url", label: "If you have Instagram, paste the URL.", required: false },
  { key: "google_business_url", label: "If you have a Google Business Profile, paste the link.", required: false },
];

export default function OnboardingWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const current = questions[step];

  const handleAnswer = async (value: string) => {
    const updated = { ...answers, [current.key]: value };
    setAnswers(updated);
    setSaving(true);

    // Auto-fill / save progressively
    await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...updated }),
    });

    setSaving(false);

    if (step + 1 >= questions.length) {
      setDone(true);
      // Trigger connects if URLs present
      if (updated.facebook_url) {
        await fetch("/api/connect/social", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ user_id: userId, platform: "facebook", url: updated.facebook_url }),
        });
      }
      // Similar for others...
    } else {
      setStep(step + 1);
    }
  };

  if (done) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Setup complete</h2>
        <p>Ava has your profile. Platform connections are ready to activate once you approve each OAuth.</p>
        <p className="mt-4 text-sm text-muted-foreground">
          You can update any field later by talking to Ava.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <p className="text-lg">{current.label}</p>
      <input
        type="text"
        className="w-full border rounded px-3 py-2"
        placeholder="Your answer"
        defaultValue={answers[current.key] || ""}
        onKeyDown={(e) => {
          if (e.key === "Enter" && e.currentTarget.value.trim()) {
            handleAnswer(e.currentTarget.value.trim());
          }
        }}
      />
      <button
        className="bg-primary text-primary-foreground px-4 py-2 rounded"
        disabled={saving}
        onClick={(e) => {
          const input = e.currentTarget.previousElementSibling as HTMLInputElement;
          if (input?.value.trim()) handleAnswer(input.value.trim());
        }}
      >
        {saving ? "Saving…" : "Next"}
      </button>
      <p className="text-xs text-muted-foreground">
        Step {step + 1} of {questions.length}
      </p>
    </div>
  );
}