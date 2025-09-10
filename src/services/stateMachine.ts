import { AuditLogger } from './auditLogger'
import { StateTransition } from '../types/transaction'

export interface StateMachineConfig {
  initialState: string
  finalStates: string[]
  transitions: StateTransitionRule[]
  validationRules?: StateValidationRule[]
}

export interface StateTransitionRule {
  from: string
  to: string
  condition?: (context: any) => boolean
  action?: (context: any) => Promise<void>
  requiresApproval?: boolean
  allowedRoles?: string[]
}

export interface StateValidationRule {
  state: string
  validator: (data: any) => boolean
  errorMessage: string
}

export interface StateMachineContext {
  userId: string
  resourceId: string
  resourceType: string
  currentData: any
  metadata?: Record<string, any>
}

export class StateMachine {
  private config: StateMachineConfig
  private resourceType: string

  constructor(resourceType: string, config: StateMachineConfig) {
    this.resourceType = resourceType
    this.config = config
  }

  /**
   * Validate if a state transition is allowed
   */
  canTransition(from: string, to: string, context: StateMachineContext): boolean {
    // Check if transition exists
    const transition = this.config.transitions.find(t => t.from === from && t.to === to)
    if (!transition) {
      return false
    }

    // Check role permissions
    if (transition.allowedRoles && !transition.allowedRoles.includes(context.userId)) {
      return false
    }

    // Check custom condition
    if (transition.condition && !transition.condition(context)) {
      return false
    }

    return true
  }

  /**
   * Execute a state transition with validation and logging
   */
  async transition(
    from: string,
    to: string,
    context: StateMachineContext,
    reason?: string
  ): Promise<StateTransition> {
    // Validate transition
    if (!this.canTransition(from, to, context)) {
      throw new Error(`Invalid state transition from ${from} to ${to}`)
    }

    // Validate target state
    const validationRule = this.config.validationRules?.find(r => r.state === to)
    if (validationRule && !validationRule.validator(context.currentData)) {
      throw new Error(validationRule.errorMessage)
    }

    // Find transition rule
    const transitionRule = this.config.transitions.find(t => t.from === from && t.to === to)
    if (!transitionRule) {
      throw new Error(`No transition rule found from ${from} to ${to}`)
    }

    // Execute transition action if defined
    if (transitionRule.action) {
      try {
        await transitionRule.action(context)
      } catch (error) {
        throw new Error(`Transition action failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    // Create state transition record
    const stateTransition: StateTransition = {
      from,
      to,
      timestamp: new Date().toISOString(),
      userId: context.userId,
      reason,
      metadata: {
        resourceType: this.resourceType,
        resourceId: context.resourceId,
        ...context.metadata
      }
    }

    // Log the state transition
    await AuditLogger.logEvent(
      context.userId,
      'state_transition',
      this.resourceType,
      context.resourceId,
      { status: from },
      { status: to },
      {
        reason,
        transition: `${from} -> ${to}`,
        ...context.metadata
      }
    )

    return stateTransition
  }

  /**
   * Get all possible transitions from a given state
   */
  getPossibleTransitions(from: string, context: StateMachineContext): string[] {
    return this.config.transitions
      .filter(t => t.from === from)
      .filter(t => this.canTransition(from, t.to, context))
      .map(t => t.to)
  }

  /**
   * Check if a state is final
   */
  isFinalState(state: string): boolean {
    return this.config.finalStates.includes(state)
  }

  /**
   * Get the initial state
   */
  getInitialState(): string {
    return this.config.initialState
  }
}

/**
 * Bounty State Machine Configuration
 */
export const BOUNTY_STATE_MACHINE_CONFIG: StateMachineConfig = {
  initialState: 'pending',
  finalStates: ['completed', 'cancelled'],
  transitions: [
    // Pending -> Active (when paid)
    {
      from: 'pending',
      to: 'active',
      condition: (context) => context.currentData.paymentStatus === 'held_in_escrow',
      action: async (context) => {
        // Additional validation for payment
        if (!context.currentData.escrowPaymentId) {
          throw new Error('Escrow payment required to activate bounty')
        }
      }
    },
    // Pending -> Cancelled (if not paid within time limit)
    {
      from: 'pending',
      to: 'cancelled',
      condition: (context) => {
        const createdAt = new Date(context.currentData.createdAt)
        const now = new Date()
        const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)
        return hoursSinceCreation > 24 // 24 hours to pay
      }
    },
    // Active -> In-Progress (when applications limit reached)
    {
      from: 'active',
      to: 'in-progress',
      condition: (context) => {
        const { applicationsCount, maxApplications } = context.currentData
        return maxApplications && applicationsCount >= maxApplications
      }
    },
    // Active -> In-Progress (when max creators selected)
    {
      from: 'active',
      to: 'in-progress',
      condition: (context) => {
        const { maxCreators } = context.currentData
        // Check if we have accepted applications equal to maxCreators
        return maxCreators && context.metadata?.acceptedApplicationsCount >= maxCreators
      }
    },
    // In-Progress -> Completed (when all creators paid)
    {
      from: 'in-progress',
      to: 'completed',
      condition: (context) => {
        const { paidCreatorsCount, maxCreators, remainingBudget } = context.currentData
        return (maxCreators && paidCreatorsCount >= maxCreators) || 
               (remainingBudget !== undefined && remainingBudget <= 0)
      }
    },
    // Any state -> Cancelled (admin action)
    {
      from: 'pending',
      to: 'cancelled',
      allowedRoles: ['admin']
    },
    {
      from: 'active',
      to: 'cancelled',
      allowedRoles: ['admin']
    },
    {
      from: 'in-progress',
      to: 'cancelled',
      allowedRoles: ['admin']
    }
  ],
  validationRules: [
    {
      state: 'active',
      validator: (data) => data.paymentStatus === 'held_in_escrow',
      errorMessage: 'Bounty must have escrow payment to be active'
    },
    {
      state: 'in-progress',
      validator: (data) => data.applicationsCount > 0,
      errorMessage: 'Bounty must have applications to be in progress'
    },
    {
      state: 'completed',
      validator: (data) => data.paidCreatorsCount > 0,
      errorMessage: 'Bounty must have paid creators to be completed'
    }
  ]
}

/**
 * Application State Machine Configuration
 */
export const APPLICATION_STATE_MACHINE_CONFIG: StateMachineConfig = {
  initialState: 'pending',
  finalStates: ['accepted', 'rejected', 'withdrawn'],
  transitions: [
    // Pending -> Accepted (business approval)
    {
      from: 'pending',
      to: 'accepted',
      allowedRoles: ['business', 'admin']
    },
    // Pending -> Rejected (business rejection)
    {
      from: 'pending',
      to: 'rejected',
      allowedRoles: ['business', 'admin']
    },
    // Pending -> Withdrawn (creator withdrawal)
    {
      from: 'pending',
      to: 'withdrawn',
      allowedRoles: ['creator']
    },
    // Accepted -> Withdrawn (creator withdrawal after acceptance)
    {
      from: 'accepted',
      to: 'withdrawn',
      allowedRoles: ['creator']
    }
  ],
  validationRules: [
    {
      state: 'accepted',
      validator: (data) => data.bountyId && data.creatorId,
      errorMessage: 'Application must have valid bounty and creator IDs'
    }
  ]
}

/**
 * Payment State Machine Configuration
 */
export const PAYMENT_STATE_MACHINE_CONFIG: StateMachineConfig = {
  initialState: 'pending',
  finalStates: ['completed', 'failed', 'refunded'],
  transitions: [
    // Pending -> Processing (when payment initiated)
    {
      from: 'pending',
      to: 'processing',
      condition: (context) => context.currentData.stripePaymentIntentId
    },
    // Processing -> Held in Escrow (when payment successful)
    {
      from: 'processing',
      to: 'held_in_escrow',
      condition: (context) => context.currentData.stripePaymentIntentStatus === 'succeeded'
    },
    // Held in Escrow -> Released (when escrow released)
    {
      from: 'held_in_escrow',
      to: 'released',
      allowedRoles: ['business', 'admin', 'system']
    },
    // Any state -> Failed (payment failure)
    {
      from: 'pending',
      to: 'failed'
    },
    {
      from: 'processing',
      to: 'failed'
    },
    // Any state -> Refunded (refund processed)
    {
      from: 'held_in_escrow',
      to: 'refunded',
      allowedRoles: ['business', 'admin']
    },
    {
      from: 'released',
      to: 'refunded',
      allowedRoles: ['admin']
    }
  ],
  validationRules: [
    {
      state: 'held_in_escrow',
      validator: (data) => data.amount > 0 && data.currency,
      errorMessage: 'Payment must have valid amount and currency'
    },
    {
      state: 'released',
      validator: (data) => data.creatorId && data.stripeTransferId,
      errorMessage: 'Released payment must have creator and transfer ID'
    }
  ]
}

/**
 * Factory function to create state machines
 */
export function createStateMachine(resourceType: string): StateMachine {
  switch (resourceType) {
    case 'bounty':
      return new StateMachine('bounty', BOUNTY_STATE_MACHINE_CONFIG)
    case 'application':
      return new StateMachine('application', APPLICATION_STATE_MACHINE_CONFIG)
    case 'payment':
      return new StateMachine('payment', PAYMENT_STATE_MACHINE_CONFIG)
    default:
      throw new Error(`Unknown resource type: ${resourceType}`)
  }
}
