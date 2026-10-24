"use client";

import { useState } from "react";

type Question = {
  key: string;
  label: string;
  required: boolean;
  placeholder?: string;
  suggestions?: string[];
  hint?: string;
  connectPlatform?: "facebook" | "instagram" | "google" | "website" | "linkedin" | "tiktok";
}

const questions: Question[] = [
  {
    key: "client_name",
    label: "What is your full name?",
    required: true,
    placeholder: "Jane Smith",
  },
  {
    key: "personal_email",
    label: "What is your personal email?",
    required: true,
    placeholder: "jane@example.com",
    hint: "This is where Ava sends your login and account updates.",
  },
  {
    key: "business_email",
    label: "What is your business email?",
    required: false,
    placeholder: "hello@yourbusiness.com",
    hint: "Skip if it's the same as your personal one.",
  },
  {
    key: "business_name",
    label: "What is your business or product name?",
    required: true,
    placeholder: "Acme Co",
  },
  {
    key: "personal_phone",
    label: "What is your personal cellphone number?",
    required: false,
    placeholder: "(555) 123-4567",
  },
  {
    key: "business_phone",
    label: "What is your business phone number?",
    required: false,
    placeholder: "(555) 987-6543",
    hint: "This is the number customers will call.",
  },
  {
    key: "business_address",
    label: "What is your business address?",
    required: false,
    placeholder: "123 Main St, Richmond, IN 47374",
  },
  {
    key: "business_website",
    label: "What is your business website?",
    required: true,
    placeholder: "https://yourbusiness.com",
    hint: "No site yet? Ava can build one for you after setup.",
    suggestions: ["I don't have one yet"],
    connectPlatform: "website",
  },
  {
    key: "facebook_url",
    label: "Please paste your Facebook page URL.",
    required: false,
    placeholder: "https://facebook.com/yourpage",
    hint: "Beginner tip: search your business name on Facebook, then copy the page link.",
    suggestions: ["I don't have a Facebook page", "Help me create one"],
    connectPlatform: "facebook",
  },
  {
    key: "instagram_url",
    label: "If you have Instagram, paste the URL.",
    required: false,
    placeholder: "https://instagram.com/yourhandle",
    hint: "Beginner tip: your handle is in your profile bio.",
    suggestions: ["I don't have Instagram", "Help me start one"],
    connectPlatform: "instagram",
  },
  {
    key: "google_business_url",
    label: "If you have a Google Business Profile, paste the link.",
    required: false,
    placeholder: "https://g.page/yourbusiness",
    hint: "Beginner tip: google 'your business name' and it usually appears as a card at the top.",
    suggestions: ["I don't have one", "Help me claim mine"],
    connectPlatform: "google",
  },
  {
    key: "linkedin_url",
    label: "Paste your LinkedIn profile or company page URL.",
    required: false,
    placeholder: "https://linkedin.com/in/yourname or /company/yourcompany",
    hint: "Beginner tip: linkedin.com/in/yourname for personal, /company/ for business.",
    suggestions: ["I don't have LinkedIn", "Help me set one up"],
    connectPlatform: "linkedin",
  },
  {
    key: "tiktok_url",
    label: "Paste your TikTok profile URL.",
    required: false,
    placeholder: "https://tiktok.com/@yourhandle",
    hint: "Beginner tip: your handle starts with @ and shows under your profile name.",
    suggestions: ["I don't have TikTok", "Help me start one"],
    connectPlatform: "tiktok",
  },
];

export default function OnboardingWizard({ userId }: { userId: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [connectStatus, setConnectStatus] = useState<Record<string, string>>({});

  const current = questions[step];

  const saveAnswer = async (updated: Record<string, string>) => {
    setSaving(true);
    await fetch("/api/onboarding/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, ...updated }),
    });
    setSaving(false);
  };

  const handleAnswer = async (value: string) => {
    if (!value.trim() && current.required) return;
    const updated = { ...answers, [current.key]: value.trim() };
    setAnswers(updated);
    await saveAnswer(updated);

    if (step + 1 >= questions.length) {
      setDone(true);
      for (const q of questions) {
        if (q.connectPlatform && updated[q.key] && !isSkipValue(updated[q.key])) {
          await triggerConnect(q.connectPlatform, updated[q.key]);
        }
      }
    } else {
      setStep(step + 1);
    }
  };

  const isSkipValue = (v: string) =>
    /^(i don't have|help me)/i.test(v.trim());

  const triggerConnect = async (
    platform: "facebook" | "instagram" | "google" | "website" | "linkedin" | "tiktok",
    url: string
  ) => {
    setConnectStatus((s) => ({ ...s, [platform]: "starting" }));
    const res = await fetch("/api/connect/social", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, platform, url }),
    });
    const data = await res.json();
    if (data.needsCredentials || data.missing) {
      setConnectStatus((s) => ({ ...s, [platform]: data.message || "Needs app credentials" }));
      return;
    }
    if (data.authUrl) {
      setConnectStatus((s) => ({ ...s, [platform]: "redirecting" }));
      window.location.href = data.authUrl;
    } else {
      setConnectStatus((s) => ({ ...s, [platform]: data.message || "ready" }));
    }
  };

  if (done) {
    return (
      <div className="p-6 max-w-md mx-auto">
        <h2 className="text-xl font-semibold mb-4">Setup complete</h2>
        <p>Ava has your profile. Platform connections are ready to activate once you approve each OAuth.</p>
        {Object.keys(connectStatus).length > 0 && (
          <ul className="mt-4 text-sm space-y-1">
            {Object.entries(connectStatus).map(([p, st]) => (
              <li key={p} className="capitalize">
                {p}: {st}
              </li>
            ))}
          </ul>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          You can update any field later by talking to Ava.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-4">
      <p className="text-lg">{current.label}</p>
      {current.hint && (
        <p className="text-sm text-muted-foreground">{current.hint}</p>
      )}
      <input
        type="text"
        className="w-full border rounded px-3 py-2"
        placeholder={current.placeholder || "Your answer"}
        defaultValue={answers[current.key] || ""}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.currentTarget.value.trim() || !current.required)) {
            handleAnswer(e.currentTarget.value);
          }
        }}
      />
      {current.suggestions && current.suggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {current.suggestions.map((s) => (
            <button
              key={s}
              type="button"
              className="text-xs border rounded-full px-3 py-1 hover:bg-muted"
              onClick={() => handleAnswer(s)}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <button
        className="bg-primary text-primary-foreground px-4 py-2 rounded"
        disabled={saving}
        onClick={(e) => {
          const input = e.currentTarget.previousElementSibling
            ?.previousElementSibling as (HTMLInputElement | null);
          const el = (e.currentTarget.previousElementSibling as HTMLInputElement) || input;
          if (el?.value.trim() || !current.required) handleAnswer(el?.value || "");
        }}
      >
        {saving ? "Saving…" : "Next"}
      </button>
      <p className="text-xs text-muted-foreground">
        Step {step + 1} of {questions.length}
        {current.required ? " · required" : " · optional"}
      </p>
    </div>
  );
}