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

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated()

  // Home route logic
  if (to.path === '/') {
    return isAuthenticated ? next('/dashboard') : next('/login')
  }

  // Routes that require auth
  if (to.meta.requiresAuth && !isAuthenticated) {
    return next('/login')
  }

  // Guest-only routes (login/register)
  if (to.meta.guestOnly && isAuthenticated) {
    return next('/dashboard')
  }

  next()
})

export default router
