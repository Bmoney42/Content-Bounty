import { getAuth } from 'firebase/auth'

/**
 * Get authentication headers for API calls
 * Includes Firebase ID token for backend verification
 */
export async function getAuthHeaders(): Promise<{ [key: string]: string }> {
  const auth = getAuth()
  const user = auth.currentUser

  if (!user) {
    throw new Error('User not authenticated')
  }

  try {
    // Get fresh ID token
    const idToken = await user.getIdToken(true)
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${idToken}`
    }
  } catch (error) {
    console.error('Failed to get auth token:', error)
    throw new Error('Failed to get authentication token')
  }
}

/**
 * Make authenticated API call with automatic token handling
 */
export async function authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    const authHeaders = await getAuthHeaders()
    
    const response = await fetch(url, {
      ...options,
      headers: {
        ...authHeaders,
        ...options.headers,
      }
    })

    // Handle authentication errors
    if (response.status === 401) {
      // Token might be expired, try to refresh
      const auth = getAuth()
      const user = auth.currentUser
      
      if (user) {
        try {
          const freshToken = await user.getIdToken(true)
          const retryHeaders = {
            ...authHeaders,
            'Authorization': `Bearer ${freshToken}`,
            ...options.headers,
          }
          
          // Retry with fresh token
          return await fetch(url, {
            ...options,
            headers: retryHeaders
          })
        } catch (refreshError) {
          console.error('Token refresh failed:', refreshError)
          throw new Error('Authentication failed. Please log in again.')
        }
      } else {
        throw new Error('User session expired. Please log in again.')
      }
    }

    return response
  } catch (error) {
    console.error('Authenticated fetch failed:', error)
    throw error
  }
}

/**
 * Handle API response with error checking
 */
export async function handleApiResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`
    
    try {
      const errorData = await response.json()
      errorMessage = errorData.error || errorMessage
    } catch (parseError) {
      // Use default error message if JSON parsing fails
    }
    
    throw new Error(errorMessage)
  }

  try {
    return await response.json()
  } catch (parseError) {
    throw new Error('Failed to parse response')
  }
}