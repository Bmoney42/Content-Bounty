// Secure admin configuration
// Only specific email addresses should be granted admin access

/**
 * CRITICAL SECURITY: Admin Access Control
 * 
 * This file defines who has admin access to the platform.
 * Only add trusted email addresses to this list.
 * 
 * NEVER use pattern matching or wildcards for admin access.
 * Each admin must be explicitly listed here.
 */

// List of authorized admin email addresses
const AUTHORIZED_ADMIN_EMAILS: string[] = [
  'brandon@themoneyfriends.com',
  // Add additional admin emails here as needed
  // 'admin@creatorbounty.xyz',
  // 'security@creatorbounty.xyz',
]

/**
 * Check if an email address is authorized for admin access
 * @param email - The email address to check
 * @returns true if the email is authorized for admin access
 */
export function isAuthorizedAdmin(email: string): boolean {
  if (!email || typeof email !== 'string') {
    return false
  }

  // Normalize email to lowercase for comparison
  const normalizedEmail = email.toLowerCase().trim()
  
  // Check against authorized list
  return AUTHORIZED_ADMIN_EMAILS.map(admin => admin.toLowerCase()).includes(normalizedEmail)
}

/**
 * Check if a user object has admin privileges
 * SECURITY: Admin access is ONLY granted through Firebase backend
 * Client-side code cannot grant admin access
 * @param user - User object with email and other properties
 * @returns true if the user has admin access
 */
export function hasAdminAccess(user: { email: string; isAdmin?: boolean }): boolean {
  if (!user || !user.email) {
    return false
  }

  // SECURITY: Admin access must be explicitly set in Firebase
  // No automatic granting based on email patterns
  // Admin flag must be set manually in Firebase console/admin SDK
  return user.isAdmin === true
}

/**
 * Get the list of authorized admin emails (for display purposes only)
 * Returns masked emails for security
 */
export function getAuthorizedAdminEmails(): string[] {
  return AUTHORIZED_ADMIN_EMAILS.map(email => {
    const [username, domain] = email.split('@')
    const maskedUsername = username.length > 2 
      ? username.substring(0, 2) + '*'.repeat(username.length - 2)
      : '*'.repeat(username.length)
    return `${maskedUsername}@${domain}`
  })
}

// Export the count for transparency
export const ADMIN_COUNT = AUTHORIZED_ADMIN_EMAILS.length

// Security logging
console.log(`🔐 SECURITY: Admin system initialized - access controlled by Firebase only`)
console.log(`📊 ${ADMIN_COUNT} email(s) documented as authorized (manual Firebase setup required)`)

export default {
  isAuthorizedAdmin,
  hasAdminAccess,
  getAuthorizedAdminEmails,
  ADMIN_COUNT
}