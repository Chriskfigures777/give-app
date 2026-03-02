# Email Marketing MCP Options

Reference for email platforms with MCP (Model Context Protocol) that work with Cursor, Claude, and other AI tools.

---

## Brevo MCP Server (Early Access)

**Base URL:** `https://mcp.brevo.com/v1/`  
**Auth:** MCP token from Brevo account settings  
**Status:** Early access only

### Service Coverage

| Area | Endpoint | Description |
| ---- | -------- | ----------- |
| Account Management | `/brevo_accounts/mcp/{token}` | Account and sub-account operations |
| Attributes | `/brevo_attributes/mcp/{token}` | Contact and CRM attribute management |
| Campaign Analytics | `/brevo_campaign_analytics/mcp/{token}` | Performance metrics and reporting |
| Companies | `/brevo_companies/mcp/{token}` | CRM company management |
| Contact Import/Export | `/brevo_contact_import_export/mcp/{token}` | Bulk contact operations |
| Contacts | `/brevo_contacts/mcp/{token}` | Contact database management |
| Deals | `/brevo_deals/mcp/{token}` | Sales pipeline and deal tracking |
| Domains | `/brevo_domains/mcp/{token}` | Domain configuration and verification |
| **Email Campaigns** | `/brevo_email_campaign_management/mcp/{token}` | Email marketing campaigns |
| External Feeds | `/brevo_external_feeds/mcp/{token}` | Dynamic content integration |
| Folders | `/brevo_folders/mcp/{token}` | Contact organization structure |
| Groups | `/brevo_groups/mcp/{token}` | Sub-account group management |
| IP Management | `/brevo_ips/mcp/{token}` | Dedicated IP configuration |
| Lists | `/brevo_lists/mcp/{token}` | Contact list management |
| Notes | `/brevo_notes/mcp/{token}` | CRM communication history |
| Pipelines | `/brevo_pipelines/mcp/{token}` | Deal pipeline configuration |
| Processes | `/brevo_processes/mcp/{token}` | Background operation monitoring |
| Segments | `/brevo_segments/mcp/{token}` | Dynamic contact segmentation |
| Senders | `/brevo_senders/mcp/{token}` | Email sender management |
| SMS Campaigns | `/brevo_sms_campaigns/mcp/{token}` | SMS marketing operations |
| Tasks | `/brevo_tasks/mcp/{token}` | CRM task and activity management |
| Templates | `/brevo_templates/mcp/{token}` | Email template management |
| **Transactional Templates** | `/brevo_transac_templates/mcp/{token}` | Automated email templates |
| Users | `/brevo_users/mcp/{token}` | User and permission management |
| WhatsApp Campaigns | `/brevo_whatsapp_campaigns/mcp/{token}` | WhatsApp business messaging |
| **All Services** | `/brevo/mcp/{token}` | Complete Brevo API access |

### What Brevo MCP Covers

- **Account & Organization** — Sub-accounts, permissions, billing
- **Contact & CRM** — Contacts, companies, deals, tasks, notes
- **Email Marketing** — Campaigns, templates, A/B tests, analytics, transactional automation
- **Multi-Channel** — SMS, WhatsApp, cross-channel analytics
- **Technical** — Domains, IPs, sender reputation, process monitoring

---

## Other Email MCP Options

| Platform | MCP | Best For |
| -------- | --- | -------- |
| **Brevo** | Yes (early access) | Full CRM + email + SMS + WhatsApp |
| **MailerLite** | Yes | Workflows, sequences, triggers via natural language |
| **Mailchimp** | Yes (Zapier / community) | Campaigns, lists |
| **Resend** | Yes | Transactional email (receipts, confirmations) |
| **Mailgun** | Yes | Transactional + marketing |
| **Zapier** | Yes | Connect 8,000+ apps; build Zaps |

---

## For Give App

| Use Case | Recommended |
| -------- | ----------- |
| Transactional (receipts, confirmations) | Resend or Brevo transactional templates |
| Marketing (newsletters, campaigns) | Brevo or MailerLite |
| Full CRM + email + automation | Brevo |
| AI-created workflows via MCP | MailerLite or Brevo |
