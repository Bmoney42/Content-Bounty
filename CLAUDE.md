# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 🚀 **Current Status: ENTERPRISE-READY** ✅

**Phase 1 & 2 Complete** - Database transactions, audit logging, state machine, dispute resolution, task queue system, error monitoring  
**Last Updated:** December 2024

## Development Commands

- `npm run dev` - Start development server (runs on port 3000, auto-opens browser)
- `npm run build` - Build for production (TypeScript compilation + Vite build)
- `npm run build:clean` - Clean build with removed dist directory
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint with TypeScript support
- `npm run type-check` - Run TypeScript type checking without emitting files

## Architecture Overview

This is a modern content bounty platform built with React, TypeScript, and Firebase. The application connects businesses with content creators through a bounty system.

### Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, Framer Motion
- **Backend**: Firebase (Auth, Firestore)
- **State Management**: React Context + TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Routing**: React Router DOM v7
- **Payments**: Stripe integration with escrow system
- **Social Media**: YouTube OAuth integration via Google APIs
- **Icons**: Lucide React
- **Enterprise Services**: Task queue, error monitoring, audit logging, state machine

### Key Architecture Patterns

**Firebase Integration with Fallback Mode**: The app is designed to work both with and without Firebase connectivity. All Firebase operations include retry logic and fallback to mock data when connections fail. See `src/services/firebase.ts` for the hybrid data approach.

**Enterprise-Grade Services**: The platform now includes enterprise-level reliability features:
- **Task Queue System** (`src/services/taskQueue.ts`) - Background job processing with retry logic
- **Error Monitoring** (`src/services/errorMonitoring.ts`) - Sentry integration with performance tracking
- **Audit Logging** (`src/services/auditLogger.ts`) - Tamper-proof audit trails
- **State Machine** (`src/services/stateMachine.ts`) - Business rule validation
- **Dispute Resolution** (`src/services/disputeResolution.ts`) - Formal dispute workflow
- **Enhanced Firebase** (`src/services/enhancedFirebase.ts`) - Transaction wrapper with all enterprise features

**Dual User Types**: The application supports two distinct user types (`creator` | `business`) with different dashboards, permissions, and workflows. User type switching is handled through the AuthContext.

**Protected Route System**: Routes are protected using `ProtectedRoute` and `PublicRoute` components that redirect based on authentication state. Public routes redirect authenticated users to dashboard, protected routes redirect unauthenticated users to login.

**Social Media Integration**: The platform integrates with social platforms via OAuth. YouTube integration uses Google OAuth with `youtube.readonly` scope for creator verification and audience metrics. OAuth flows handle COOP (Cross-Origin-Opener-Policy) restrictions with popup detection fallbacks.

**Payment System**: Stripe powers the payment infrastructure with escrow functionality. Payments are held until bounty completion and include platform commission calculations. The system supports milestone-based payments and automatic fund releases.

**Legal Compliance**: Privacy Policy and Terms of Service pages are accessible at `/privacy` and `/terms` for Google OAuth verification and legal compliance.

### File Structure

```
src/
├── components/
│   ├── bounty/         # Bounty-related components (BountyCard, BountyList, etc.)
│   ├── dashboard/      # User type specific dashboards
│   ├── layout/         # Layout components (Header, Sidebar, Layout wrapper)
│   └── ui/            # Reusable UI components (Button, Card, Input)
├── config/            # Firebase configuration
├── contexts/          # React contexts (AuthContext for user state)
├── hooks/             # Custom React hooks (useAuth)
├── pages/             # Route-level page components
├── services/          # Firebase service functions with retry logic
├── types/             # TypeScript type definitions
└── styles/            # Global CSS styles
```

### Authentication System

The authentication system in `src/contexts/AuthContext.tsx` is robust and includes:
- Firebase Auth integration with fallback to demo accounts
- Automatic user document creation in Firestore
- Retry logic for Firestore operations with exponential backoff
- Demo accounts: `creator@demo.com` / `password` and `business@demo.com` / `password`

### Firebase Services

All Firebase operations are centralized in `src/services/firebase.ts` and include:
- **Retry Logic**: Failed operations retry up to 3 times with exponential backoff
- **Connection Testing**: `firebaseTest.testConnection()` verifies Firestore connectivity
- **Hybrid Data**: `hybridData.getUserStats()` falls back to mock data when real data unavailable
- **Error Handling**: All operations include comprehensive error logging

### Type System

The application uses comprehensive TypeScript types defined in `src/types/`:
- `bounty.ts`: Complete bounty system types including categories, requirements, payments, and submissions
- `auth.ts`: User authentication and profile types

### Environment Configuration

**Firebase Variables** (required for authentication and data):
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

**Google OAuth Variables** (for social media integration):
- `VITE_GOOGLE_CLIENT_ID` - Required for YouTube OAuth integration

**Optional API Keys**:
- `VITE_YOUTUBE_API_KEY` - For enhanced YouTube data access
- `VITE_STRIPE_PUBLISHABLE_KEY` - For payment processing

### Path Aliases

The project uses `@/*` path aliases that resolve to `./src/*` for cleaner imports.

### Key Services

**Social Media Service** (`src/services/socialMedia.ts`):
- Manages OAuth flows for social platform connections
- Handles YouTube API integration for creator metrics
- Provides COOP-compliant popup management for OAuth
- Stores and retrieves social connection data in Firestore

**Stripe Service** (`src/services/stripe.ts`):
- Handles subscription checkout sessions
- Manages escrow payments for bounty transactions
- Calculates platform commissions and creator payouts
- Integrates with Firestore for payment tracking

**Firebase Service** (`src/services/firebase.ts`):
- Centralized Firebase operations with retry logic
- Hybrid data approach with mock fallbacks
- Connection testing and error handling
- User stats aggregation and caching

### Development Notes

- The application gracefully handles Firebase connection issues by displaying warnings and using fallback data
- OAuth integrations include fallback detection for COOP policy restrictions
- The bounty system supports complex requirements and milestone-based payments
- UI components follow Tailwind CSS patterns with consistent styling
- All payments use escrow system to protect both creators and businesses
- Social media connections are verified and stored securely in Firestore

## 🚧 **CRITICAL DEVELOPMENT GAPS IDENTIFIED**

### **High Priority Issues**
1. **Database Concurrency** - No protection against race conditions in bounty operations
2. **State Management** - No atomic state transitions or rollback capabilities
3. **Dispute Resolution** - No formal system for handling disputes between parties
4. **Audit Logging** - Insufficient immutable audit trails for dispute resolution
5. **Content Verification** - Relies entirely on manual review without automation

### **Medium Priority Issues**
1. **Task Queue Reliability** - Single point of failure in escrow release cron jobs
2. **Error Monitoring** - No comprehensive error tracking or performance monitoring
3. **Analytics Infrastructure** - No conversion tracking or ROI measurement
4. **API Rate Limiting** - Only client-side protection, no server-side rate limiting

### **Development Roadmap**
See [DEVELOPMENT_ROADMAP.md](./DEVELOPMENT_ROADMAP.md) for comprehensive implementation plan:
- **Phase 1**: Core security and reliability improvements (100% codeable)
- **Phase 2**: Business logic and dispute resolution (100% codeable)
- **Phase 3**: External integrations and advanced features (requires setup)

### **Immediate Development Priorities**
1. Implement Firebase transactions for all critical operations
2. Add optimistic concurrency control with version fields
3. Build comprehensive audit logging system
4. Create proper state machine with atomic transitions
5. Integrate professional error monitoring (Sentry)