// supabase/functions/ava/onboarding.ts
// Conversational onboarding script for Ava Skye
// Deploy as edge function or call from API

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const questions = [
  { key: "client_name", question: "What is your full name?", required: true },
  { key: "personal_email", question: "What is your personal email?", required: true },
  { key: "business_email", question: "What is your business email?", required: false },
  { key: "business_name", question: "What is your business or product name?", required: true },
  { key: "personal_phone", question: "What is your personal cellphone number?", required: false },
  { key: "business_phone", question: "What is your business phone number?", required: false },
  { key: "business_address", question: "What is your business address?", required: false },
  { key: "business_website", question: "What is your business website?", required: true },
  { key: "facebook_url", question: "Please paste your Facebook page URL.", required: false },
  { key: "instagram_url", question: "If you have Instagram, paste the URL.", required: false },
  { key: "google_business_url", question: "If you have a Google Business Profile, paste the link.", required: false },
];

export async function handleOnboarding(userId: string, currentStep: number, answer?: string) {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  if (answer && currentStep > 0 && currentStep <= questions.length) {
    const field = questions[currentStep - 1].key;
    const { error } = await supabase
      .from("client_onboarding")
      .upsert(
        {
          user_id: userId,
          [field]: answer,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      );
    if (error) throw error;
  }

  const nextStep = currentStep + (answer ? 1 : 0);
  if (nextStep > questions.length) {
    await supabase
      .from("client_onboarding")
      .update({ onboarding_complete: true })
      .eq("user_id", userId);
    return { done: true, message: "Onboarding complete. Ready to connect your platforms." };
  }

  return {
    done: false,
    step: nextStep,
    question: questions[nextStep - 1].question,
    field: questions[nextStep - 1].key,
  };
}