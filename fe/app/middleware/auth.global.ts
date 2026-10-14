import { defineNuxtRouteMiddleware, navigateTo } from '#app'
import { useAuthStore } from '~/stores/auth'

export default defineNuxtRouteMiddleware(async (to) => {
  // Public routes that don't require authentication
  if (to.path === '/login') {
    const authStore = useAuthStore()
    if (!authStore.isInitialized) {
      await authStore.initialize()
    }
    if (authStore.isAuthenticated) {
      return navigateTo('/')
    }
    return
  }

  const authStore = useAuthStore()

  // Ensure store is initialized from storage and validated with BE_MVG
  if (!authStore.isInitialized) {
    const isValid = await authStore.initialize()
    if (!isValid || !authStore.isAuthenticated) {
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  } else {
    // Check if session has expired
    if (!authStore.isAuthenticated || authStore.isTokenExpired) {
      await authStore.logout('Sesi login telah kedaluwarsa. Silakan login kembali.')
      return navigateTo({
        path: '/login',
        query: { redirect: to.fullPath }
      })
    }
  }
})
