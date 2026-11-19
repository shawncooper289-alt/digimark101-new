# Phone calls for Ava

Ava can call a number, and she can answer the business line, after the steps below. Until then, `POST /api/ava/initiate-call` still answers that phone calling is not connected. No call is placed.

Calls use the ElevenLabs agent (the same ElevenLabs account as Ava's voice) and a Twilio phone number. The site does not store Twilio or ElevenLabs secrets in git.

## What the site will and will not do

- A visitor who is not signed in as the owner cannot start a call, even if they know the API address.
- The owner must send `consent: true` with the number. That means the person agreed to be called.
- The number must be on `AVA_CALL_ALLOWLIST`. Any other number is refused.
- The same person can only try a few times in ten minutes.
- A call is written to the existing Supabase table `ava_voice_calls` when the service role key is set. No new database migration is required.
- Texting is still not connected.

## Variables

Set these on the **digimark101.com** Vercel project (the repository root), for Production and Preview. They are server-only. Do not prefix them with `NEXT_PUBLIC_`.

| Variable | Where it comes from |
| --- | --- |
| `ELEVENLABS_API_KEY` | Already used for Ava's voice. ElevenLabs → Developers → API keys. The key needs Agents access. |
| `ELEVENLABS_AGENT_ID` | The agent id from the ElevenLabs Agents dashboard. |
| `ELEVENLABS_AGENT_PHONE_NUMBER_ID` | The id ElevenLabs shows after you import the Twilio number. |
| `AVA_CALL_ALLOWLIST` | Numbers Ava may dial, with the country code, separated by commas. Example: `+15551234567,+15557654321`. |
| `AVA_CALL_WEBHOOK_SECRET` | A long random string you invent. ElevenLabs sends it on inbound calls. |
| `ELEVENLABS_WEBHOOK_SECRET` | The signing secret ElevenLabs shows when you create the post-call webhook. |
| `TWILIO_ACCOUNT_SID` | Twilio console → Account Info. It starts with `AC`. |
| `TWILIO_AUTH_TOKEN` | Twilio console → Account Info. Used to hang up a call from the site. |

`ELEVENLABS_API_KEY` is the only one that is also needed on the office project, and only because the office already speaks with it. The phone routes live on digimark101.com.

## One-time setup

1. In [Twilio](https://console.twilio.com/), buy a phone number that can make and receive calls. Copy the Account SID and Auth Token into the Vercel variables above. Do not paste them into chat or into this repo.
2. In [ElevenLabs Agents](https://elevenlabs.io/app/agents), create an agent for Ava. Set her first sentence in the agent, for example: "Hi, this is Ava from DigiMark101. How can I help?" Use the same voice id as `ELEVENLABS_VOICE_ID` or `AVA_VOICE_CLONE_ID`. Leave required dynamic variables empty so a call can start without extra fields. Turn on the End call tool.
3. In the agent's phone numbers settings, import the Twilio number. Choose Twilio, enter the number, the Account SID, and the Auth Token. Assign that number to Ava's agent so inbound calls are answered by her. Copy the phone number id into `ELEVENLABS_AGENT_PHONE_NUMBER_ID`, and the agent id into `ELEVENLABS_AGENT_ID`.
4. On the agent's Security tab, turn on fetching conversation initiation data from a webhook. Set the URL to `https://www.digimark101.com/api/ava/calls/inbound`. Add a header named `x-ava-call-secret` whose value is `AVA_CALL_WEBHOOK_SECRET`.
5. In ElevenLabs Agents settings, add a post-call webhook (transcription) aimed at `https://www.digimark101.com/api/ava/calls/events`. Copy the webhook signing secret into `ELEVENLABS_WEBHOOK_SECRET`.
6. Put every number Ava is allowed to dial into `AVA_CALL_ALLOWLIST`. Redeploy the customer site after the variables are saved.

## How a call is started

The owner, signed in on digimark101.com, sends:

`POST /api/ava/initiate-call`

```json
{ "to": "+15551234567", "consent": true }
```

A successful answer includes `callSid` and `conversationId`. The outbound request already includes conversation data, so ElevenLabs does not also treat that call as someone dialing in. To hang up from the site, the owner sends those ids to `POST /api/ava/end-call`. The person on the phone can also hang up. Inbound calls are answered by ElevenLabs on the Twilio number. The site only checks the secret, writes the call down, and lets Ava speak.
