

interface GoHighLevelContact {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  customField?: Record<string, any>
}

interface GoHighLevelAutomation {
  trigger: string
  data: Record<string, any>
}

export class GoHighLevelService {
  private apiKey: string
  private baseUrl: string

  constructor() {
    this.apiKey = process.env.GOHIGHLEVEL_API_KEY || ''
    this.baseUrl = 'https://api.gohighlevel.com/v1'
  }

  async createOrUpdateContact(contact: GoHighLevelContact) {
    if (!this.apiKey) {
      console.log('GoHighLevel API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: contact.email,
          firstName: contact.firstName || '',
          lastName: contact.lastName || '',
          phone: contact.phone || '',
          customField: contact.customField || {}
        })
      })

      if (!response.ok) {
        throw new Error(`GoHighLevel API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error creating/updating GoHighLevel contact:', error)
      return null
    }
  }

  async triggerAutomation(automation: GoHighLevelAutomation) {
    if (!this.apiKey) {
      console.log('GoHighLevel API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/automations/trigger`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          trigger: automation.trigger,
          data: automation.data
        })
      })

      if (!response.ok) {
        throw new Error(`GoHighLevel API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error triggering GoHighLevel automation:', error)
      return null
    }
  }

  async sendEmail(to: string, subject: string, body: string, templateId?: string) {
    if (!this.apiKey) {
      console.log('GoHighLevel API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/emails/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to,
          subject,
          body,
          templateId
        })
      })

      if (!response.ok) {
        throw new Error(`GoHighLevel API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error sending GoHighLevel email:', error)
      return null
    }
  }

  async addToWorkflow(contactId: string, workflowId: string) {
    if (!this.apiKey) {
      console.log('GoHighLevel API key not configured')
      return null
    }

    try {
      const response = await fetch(`${this.baseUrl}/workflows/${workflowId}/contacts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contactId
        })
      })

      if (!response.ok) {
        throw new Error(`GoHighLevel API error: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error adding contact to GoHighLevel workflow:', error)
      return null
    }
  }

  // Platform-specific automation triggers
  async handleBountyApplication(user: any, bounty: any) {
    const contact = await this.createOrUpdateContact({
      email: user.email,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      customField: {
        platform_role: user.role,
        platform_user_id: user.id,
        bounty_title: bounty.title,
        bounty_reward: bounty.reward
      }
    })

    if (contact) {
      await this.triggerAutomation({
        trigger: 'bounty_application_submitted',
        data: {
          contactId: contact.id,
          bountyId: bounty.id,
          bountyTitle: bounty.title,
          reward: bounty.reward
        }
      })
    }
  }

  async handleBountyApproval(user: any, bounty: any) {
    const contact = await this.createOrUpdateContact({
      email: user.email,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      customField: {
        platform_role: user.role,
        platform_user_id: user.id,
        bounty_title: bounty.title,
        bounty_reward: bounty.reward,
        status: 'approved'
      }
    })

    if (contact) {
      await this.triggerAutomation({
        trigger: 'bounty_application_approved',
        data: {
          contactId: contact.id,
          bountyId: bounty.id,
          bountyTitle: bounty.title,
          reward: bounty.reward
        }
      })
    }
  }

  async handlePaymentReceived(user: any, earning: any) {
    const contact = await this.createOrUpdateContact({
      email: user.email,
      firstName: user.name?.split(' ')[0] || '',
      lastName: user.name?.split(' ').slice(1).join(' ') || '',
      customField: {
        platform_role: user.role,
        platform_user_id: user.id,
        total_earnings: earning.amount,
        payment_status: 'received'
      }
    })

    if (contact) {
      await this.triggerAutomation({
        trigger: 'payment_received',
        data: {
          contactId: contact.id,
          earningId: earning.id,
          amount: earning.amount,
          currency: earning.currency
        }
      })
    }
  }

  async handleNewBountyCreated(business: any, bounty: any) {
    const contact = await this.createOrUpdateContact({
      email: business.email,
      firstName: business.name?.split(' ')[0] || '',
      lastName: business.name?.split(' ').slice(1).join(' ') || '',
      customField: {
        platform_role: business.role,
        platform_user_id: business.id,
        bounty_title: bounty.title,
        bounty_reward: bounty.reward,
        business_type: 'bounty_creator'
      }
    })

    if (contact) {
      await this.triggerAutomation({
        trigger: 'new_bounty_created',
        data: {
          contactId: contact.id,
          bountyId: bounty.id,
          bountyTitle: bounty.title,
          reward: bounty.reward
        }
      })
    }
  }
}

export const goHighLevelService = new GoHighLevelService()
