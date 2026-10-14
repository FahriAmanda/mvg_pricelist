import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface MvgUser {
  id: string
  username: string
  name: string
  email?: string | null
  roleName?: string | null
  unitBisnis?: string | null
}

const TOKEN_KEY = 'mvg_pricelist_token_v1'
const USER_KEY = 'mvg_pricelist_user_v1'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(null)
  const user = ref<MvgUser | null>(null)
  const isLoading = ref<boolean>(false)
  const isInitialized = ref<boolean>(false)
  const logoutReason = ref<string | null>(null)

  // Helper to parse JWT payload exp
  function parseJwtExp(jwtToken: string): number | null {
    try {
      const parts = jwtToken.split('.')
      if (parts.length !== 3) return null
      const payloadBase64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
      const payloadJson = decodeURIComponent(
        atob(payloadBase64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      )
      const payload = JSON.parse(payloadJson)
      return typeof payload.exp === 'number' ? payload.exp : null
    } catch {
      return null
    }
  }

  const isTokenExpired = computed(() => {
    if (!token.value) return true
    const exp = parseJwtExp(token.value)
    if (!exp) return false
    // Buffer 10 seconds before actual expiry
    return Date.now() >= (exp - 10) * 1000
  })

  const isAuthenticated = computed(() => {
    return !!token.value && !isTokenExpired.value
  })

  // Initialize store from localStorage and verify session with BE_MVG
  async function initialize(): Promise<boolean> {
    if (typeof window === 'undefined') return false
    if (isInitialized.value) return isAuthenticated.value

    isLoading.value = true

    try {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      const storedUser = localStorage.getItem(USER_KEY)

      if (!storedToken) {
        token.value = null
        user.value = null
        isInitialized.value = true
        isLoading.value = false
        return false
      }

      // Check local expiration first
      const exp = parseJwtExp(storedToken)
      if (exp && Date.now() >= exp * 1000) {
        await logout('Sesi login Anda telah berakhir. Silakan login kembali.')
        isInitialized.value = true
        isLoading.value = false
        return false
      }

      token.value = storedToken
      if (storedUser) {
        try {
          user.value = JSON.parse(storedUser)
        } catch {
          user.value = null
        }
      }

      // Verify token with BE_MVG
      const verifyRes = await fetch('/api/auth/verify', {
        headers: {
          Authorization: `Bearer ${storedToken}`
        }
      })

      if (!verifyRes.ok) {
        await logout('Sesi login tidak valid atau telah berakhir di server BE_MVG.')
        isInitialized.value = true
        isLoading.value = false
        return false
      }

      const verifyData = await verifyRes.json()
      if (verifyData.status !== 'success') {
        await logout('Sesi login Anda tidak valid. Silakan login kembali.')
        isInitialized.value = true
        isLoading.value = false
        return false
      }

      // If BE refreshed the token, update it
      if (verifyData.refreshedToken) {
        token.value = verifyData.refreshedToken
        localStorage.setItem(TOKEN_KEY, verifyData.refreshedToken)
      }

      isInitialized.value = true
      isLoading.value = false
      return true
    } catch (err) {
      console.error('[authStore] Initialize error:', err)
      await logout('Terjadi kesalahan memvalidasi sesi. Silakan login kembali.')
      isInitialized.value = true
      isLoading.value = false
      return false
    }
  }

  // Login action
  async function login(usernameInput: string, passwordInput: string): Promise<boolean> {
    isLoading.value = true
    logoutReason.value = null

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: usernameInput.trim(),
          password: passwordInput
        })
      })

      const data = await res.json()

      if (!res.ok || data.status !== 'success' || !data.token) {
        const errorMsg = data.statusMessage || data.message || 'Username atau password salah'
        throw new Error(errorMsg)
      }

      token.value = data.token
      user.value = data.user || {
        id: 'user',
        username: usernameInput,
        name: usernameInput,
        roleName: 'Mitra Visual Group'
      }

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem(TOKEN_KEY, data.token)
        localStorage.setItem(USER_KEY, JSON.stringify(user.value))
      }

      isInitialized.value = true
      isLoading.value = false
      return true
    } catch (err: any) {
      isLoading.value = false
      throw err
    }
  }

  // Logout action: clears all storage and redirects to /login
  async function logout(reason?: string) {
    if (reason) {
      logoutReason.value = reason
    }

    const currentToken = token.value

    // Clear state
    token.value = null
    user.value = null

    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
    }

    // Call server logout
    if (currentToken) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${currentToken}`
        }
      }).catch(() => {})
    }

    // Redirect to login page
    if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
      const router = useRouter?.()
      if (router) {
        router.push('/login')
      } else {
        window.location.href = '/login'
      }
    }
  }

  // Periodic or navigation check
  async function validateActiveSession(): Promise<boolean> {
    if (!token.value || isTokenExpired.value) {
      await logout('Sesi login telah kedaluwarsa. Silakan login kembali.')
      return false
    }
    return true
  }

  return {
    token,
    user,
    isLoading,
    isInitialized,
    logoutReason,
    isTokenExpired,
    isAuthenticated,
    initialize,
    login,
    logout,
    validateActiveSession
  }
})
