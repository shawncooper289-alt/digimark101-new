export const skills = [
  'Marketing strategy', 'Websites and funnels', 'Social strategy', 'Content and creative briefs',
  'Client onboarding and retention', 'Specialist delegation and quality review',
  'Sales discovery and qualification', 'Administration and CRM planning',
  'Campaign measurement and optimization', 'Studio storyboards and production planning',
] as const
export function capabilityStatus(config: Record<string, string | undefined>) {
  return {
    skills: skills.map(name => ({ name, mode: 'advisory' })),
    integrations: {
      ai: { status: 'requires_live_test', model: config.AVA_MODEL || 'openai/gpt-4.1-mini' },
      semanticMemory: { status: config.PINECONE_API_KEY && config.PINECONE_INDEX_HOST ? 'configured_not_verified' : 'not_configured' },
      xResearch: { status: config.X_BEARER_TOKEN ? 'configured_not_verified' : 'not_configured', access: 'read_only' },
      websiteReader: { status: config.FIRECRAWL_API_KEY ? 'configured_not_verified' : 'not_configured' },
      calls: { status: 'not_implemented' }, publishing: { status: 'not_implemented' },
      payments: { status: 'not_implemented' }, automationExecution: { status: 'not_implemented' },
      studioRendering: { status: 'not_implemented' },
    },
  }
}
