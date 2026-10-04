# Connected Ava rollout

This change is a first-stage implementation, not proof of a working cross-site system.

- Set NEXT_PUBLIC_AVA_SITE=studio at build time for AvaSkye's personal creative studio. Leave unset for DigiMark101.
- Both applications must use the SAME Supabase project and matching public keys; do not mix integration prefixes from different databases. The current client and server use the digimark101-prefixed configuration first.
- Both applications must use the same Pinecone index and embedding model. Retrieval namespaces use the authenticated Supabase user ID, never a browser-provided ID.
- Apply the reviewed ava_documents and ava_workspace_messages migration in Supabase. The app needs RLS policies and tables before chat can work.
- Set Supabase Authentication > URL Configuration site URL and allowed redirects for both HTTPS websites. Both sites share an identity, but separate browser origins may require separate sign-in.
- Supabase Authentication > Users > Invite user can send the founder setup invitation. A sign-in invitation does NOT grant administrator privileges. Founder roles require a server-controlled membership model and cannot be inferred from email or editable user metadata.
- Chat now retrieves the most recent 12 messages for the authenticated account. This is bounded conversation memory, not a full long-term summarization engine. Knowledge documents remain per-user.
- Project handoff explicitly saves only an approved brief into the same user's knowledge base; it does not migrate code, provision a business, or publish.
- The layout-level companion offers authenticated text chat, browser voice input, and browser speech output. Voice is off by default. Wake-word and automatic alternating conversation are NOT implemented; microphone speech is initiated by a click. Test on real browsers before launch.
- The existing avatar is a letter A placeholder. Supply the original Ava asset and transparent DigiMark logo before final branding. Do not claim these images have been implemented.

Production routing should remain unchanged until both previews, database RLS, cross-account isolation, email delivery, voice permissions, and shared-project handoff have been tested.
