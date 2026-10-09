export const apps = [
 { id: 'business-phone', name: 'Business phone', description: 'Plan a business number, routing, office hours, voicemail and consent requirements.', fields: ['Country', 'Preferred area code', 'Office hours', 'Call routing', 'Recording consent policy'] },
 { id: 'ai-staff', name: 'AI administrator, secretary & sales assistant', description: 'Design optional reception, scheduling, administration and sales-qualification assistants. No live calls or guaranteed sales.', fields: ['Role', 'Business duties', 'Approved offers', 'Qualification questions', 'Human handoff', 'Actions requiring approval'] },
 { id: 'bot-builder', name: 'AI bot builder', description: 'Save bot specifications for chat, email, SMS, support and marketing. Specifications are not deployed agents.', fields: ['Bot name', 'Channel', 'Purpose', 'Approved knowledge', 'Allowed actions', 'Escalation rules'] },
 { id: 'crm', name: 'CRM & pipelines', description: 'Contacts, opportunities, segmentation and lead ownership.', fields: ['Pipeline stages', 'Lead sources', 'Owner rules'] },
 { id: 'websites', name: 'Websites & funnels', description: 'Pages, forms, surveys and conversion paths.', fields: ['Offer', 'Pages needed', 'Conversion goal'] },
 { id: 'campaigns', name: 'Email & SMS campaigns', description: 'Permission-based sequences and follow-up.', fields: ['Audience', 'Consent source', 'Sequence', 'Unsubscribe process'] },
 { id: 'calendar', name: 'Calendars & appointments', description: 'Availability, booking and reminders.', fields: ['Availability', 'Appointment types', 'Reminder policy'] },
 { id: 'automations', name: 'Workflow automations', description: 'Design trigger, conditions, actions, approvals and failure handling.', fields: ['Trigger', 'Conditions', 'Actions', 'Failure handling'] },
 { id: 'social', name: 'Social & reputation', description: 'Plan social content, review requests and responses.', fields: ['Channels', 'Content plan', 'Review policy'] },
 { id: 'ads', name: 'Paid ads', description: 'Available to plan from the start; launch requires offer, landing-page, tracking, budget and follow-up readiness.', fields: ['Offer readiness', 'Landing page', 'Conversion tracking', 'Budget limit', 'Follow-up plan'] },
 { id: 'commerce', name: 'Payments, courses & memberships', description: 'Plan offers, invoices and access rules.', fields: ['Products', 'Prices', 'Access rules', 'Refund policy'] },
 { id: 'reporting', name: 'Reporting', description: 'Define outcomes, attribution and operating metrics.', fields: ['Goals', 'Metrics', 'Data sources'] },
] as const
