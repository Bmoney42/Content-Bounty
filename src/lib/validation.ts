import DOMPurify from 'isomorphic-dompurify'

export interface ValidationResult {
  isValid: boolean
  error?: string
  sanitizedValue?: string
}

export class InputValidator {
  static sanitizeString(input: string): string {
    if (!input) return ''
    return DOMPurify.sanitize(input.trim())
  }

  static validateEmail(email: string): ValidationResult {
    const sanitizedEmail = this.sanitizeString(email)
    
    if (!sanitizedEmail) {
      return { isValid: false, error: 'Email is required' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(sanitizedEmail)) {
      return { isValid: false, error: 'Invalid email format' }
    }

    // Check for common malicious patterns
    if (sanitizedEmail.includes('<script>') || sanitizedEmail.includes('javascript:')) {
      return { isValid: false, error: 'Invalid email format' }
    }

    // Block demo accounts
    if (sanitizedEmail.toLowerCase().includes('demo') || 
        sanitizedEmail.toLowerCase().includes('test') ||
        sanitizedEmail === 'creator@demo.com' ||
        sanitizedEmail === 'business@demo.com') {
      return { isValid: false, error: 'Demo accounts are not allowed' }
    }

    return { isValid: true, sanitizedValue: sanitizedEmail }
  }

  static validatePassword(password: string): ValidationResult {
    if (!password) {
      return { isValid: false, error: 'Password is required' }
    }

    if (password.length < 8) {
      return { isValid: false, error: 'Password must be at least 8 characters long' }
    }

    if (password.length > 128) {
      return { isValid: false, error: 'Password is too long' }
    }

    // Check for common weak passwords
    const weakPasswords = [
      'password', '123456', 'qwerty', 'admin', 'demo', 'test',
      'password123', '123456789', 'abc123', 'letmein', 'welcome',
      'monkey', 'dragon', 'master', 'hello', 'freedom', 'whatever',
      'qazwsx', 'trustno1', 'jordan', 'joshua', 'michael', 'michelle',
      'charlie', 'andrew', 'matthew', 'access', 'yankees', 'dallas',
      'jessica', 'pepper', '111111', '131313', 'freedom', 'shadow',
      'michael', 'hunter', 'soccer', 'tigger', 'charlie', 'shelby',
      'angels', 'fish', 'patrick', 'anthony', 'tiger', 'thomas',
      'soccer', 'basketball', 'michelle', 'charlie', 'andrew', 'daniel',
      'basketball', 'joshua', 'tiger', 'hunter', 'michelle', 'charlie',
      'andrew', 'daniel', 'basketball', 'joshua', 'tiger', 'hunter'
    ]
    
    if (weakPasswords.includes(password.toLowerCase())) {
      return { isValid: false, error: 'Password is too weak. Please choose a stronger password.' }
    }

    // Require at least one uppercase letter, one lowercase letter, and one number
    const hasUpperCase = /[A-Z]/.test(password)
    const hasLowerCase = /[a-z]/.test(password)
    const hasNumbers = /\d/.test(password)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
      return { isValid: false, error: 'Password must contain at least one uppercase letter, one lowercase letter, and one number' }
    }

    return { isValid: true, sanitizedValue: password }
  }

  static validateName(name: string): ValidationResult {
    const sanitizedName = this.sanitizeString(name)
    
    if (!sanitizedName) {
      return { isValid: false, error: 'Name is required' }
    }

    if (sanitizedName.length < 2) {
      return { isValid: false, error: 'Name must be at least 2 characters long' }
    }

    if (sanitizedName.length > 100) {
      return { isValid: false, error: 'Name is too long' }
    }

    // Check for potentially malicious content
    if (sanitizedName.includes('<script>') || sanitizedName.includes('javascript:')) {
      return { isValid: false, error: 'Invalid name format' }
    }

    // Block demo-related names
    if (sanitizedName.toLowerCase().includes('demo') || 
        sanitizedName.toLowerCase().includes('test') ||
        sanitizedName.toLowerCase() === 'demo user' ||
        sanitizedName.toLowerCase() === 'test user') {
      return { isValid: false, error: 'Demo names are not allowed' }
    }

    return { isValid: true, sanitizedValue: sanitizedName }
  }

  static validateBountyTitle(title: string): ValidationResult {
    const sanitizedTitle = this.sanitizeString(title)
    
    if (!sanitizedTitle) {
      return { isValid: false, error: 'Bounty title is required' }
    }

    if (sanitizedTitle.length < 5) {
      return { isValid: false, error: 'Bounty title must be at least 5 characters long' }
    }

    if (sanitizedTitle.length > 200) {
      return { isValid: false, error: 'Bounty title is too long' }
    }

    // Block demo-related titles
    if (sanitizedTitle.toLowerCase().includes('demo') || 
        sanitizedTitle.toLowerCase().includes('test')) {
      return { isValid: false, error: 'Demo content is not allowed' }
    }

    return { isValid: true, sanitizedValue: sanitizedTitle }
  }

  static validateBountyDescription(description: string): ValidationResult {
    const sanitizedDescription = this.sanitizeString(description)
    
    if (!sanitizedDescription) {
      return { isValid: false, error: 'Bounty description is required' }
    }

    if (sanitizedDescription.length < 10) {
      return { isValid: false, error: 'Bounty description must be at least 10 characters long' }
    }

    if (sanitizedDescription.length > 2000) {
      return { isValid: false, error: 'Bounty description is too long' }
    }

    // Block demo-related descriptions
    if (sanitizedDescription.toLowerCase().includes('demo') || 
        sanitizedDescription.toLowerCase().includes('test')) {
      return { isValid: false, error: 'Demo content is not allowed' }
    }

    return { isValid: true, sanitizedValue: sanitizedDescription }
  }

  static validateAmount(amount: number): ValidationResult {
    if (typeof amount !== 'number' || isNaN(amount)) {
      return { isValid: false, error: 'Invalid amount' }
    }

    if (amount <= 0) {
      return { isValid: false, error: 'Amount must be greater than 0' }
    }

    if (amount > 1000000) {
      return { isValid: false, error: 'Amount is too high' }
    }

    return { isValid: true, sanitizedValue: amount.toString() }
  }

  static validateRole(role: string): ValidationResult {
    const validRoles = ['CREATOR', 'BUSINESS', 'DEMO']
    
    if (!validRoles.includes(role)) {
      return { isValid: false, error: 'Invalid role' }
    }

    return { isValid: true, sanitizedValue: role }
  }
}
