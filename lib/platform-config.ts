// Product scope, not a statement that integrations are live.
export const platform = {
  name: 'DigiMark101',
  stage: 'Private beta preparation',
  offers: [
    { name: 'Ava Skye', description: 'Your marketing partner: plan your next steps and grow into the agency platform.' },
    { name: 'DigiMark101', description: 'An Ava-led workspace for websites, marketing, sales, and business automation.' },
  ],
  modules: [
    { name: 'Ava workspace', description: 'Guided onboarding, brand context, and client-isolated memory.' },
    { name: 'Website builder', description: 'Create and refine your business website with Ava.' },
    { name: 'Connected marketing', description: 'Authorized email, social, and business-channel workflows.' },
    { name: 'Ava Studio', description: 'Video creation, recorded-footage editing, and production workflows.' },
  ],
  usageCategories: ['AI text and agents', 'Voice', 'Images', 'Video', 'Email and SMS'],
} as const
