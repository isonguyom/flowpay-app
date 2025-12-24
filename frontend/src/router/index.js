import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: { requiresAuth: false },
    },

    {
      path: '/login',
      meta: { guestOnly: true },
      component: () => import('@/views/LoginView.vue'),
    },

    {
      path: '/register',
      meta: { guestOnly: true },
      component: () => import('@/views/RegisterView.vue'),
    },

    {
      path: '/dashboard',
      meta: { requiresAuth: true },
      component: () => import('@/views/DashboardView.vue'),
    },

    {
      path: '/wallets/create',
      meta: { requiresAuth: true },
      component: () => import('@/views/CreateWalletView.vue'),
    },
    {
      path: '/payment',
      meta: { requiresAuth: true },
      component: () => import('@/views/PaymentView.vue'),
    },

    {
      path: '/transactions',
      meta: { requiresAuth: true },
      component: () => import('@/views/TransactionsView.vue'),
    },

    {
      path: '/settings',
      meta: { requiresAuth: true },
      component: () => import('@/views/SettingsView.vue'),
    },
  ],
})

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // Ensure user info is loaded if token exists
  if (authStore.token && !authStore.user) {
    try {
      await authStore.fetchMe()
    } catch {
      authStore.logout()
      return next('/login')
    }
  }

  const isAuthenticated = authStore.isAuthenticated()

  // Home route
  if (to.path === '/') {
    return isAuthenticated ? next('/dashboard') : next('/login')
  }

  // Auth-protected routes
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next({ path: '/login', query: { redirect: to.fullPath } })
  }

  // Guest-only routes
  if (to.meta.guestOnly && isAuthenticated) {
    return next('/dashboard')
  }

  next()
})


export default router
