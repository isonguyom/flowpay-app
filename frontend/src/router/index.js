import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      redirect: '/login',
    },
    { path: '/login', component: () => import('../views/LoginView.vue') },
    { path: '/dashboard', component: () => import('../views/DashboardView.vue') },
    { path: '/payment', component: () => import('../views/PaymentView.vue') },
    { path: '/transactions', component: () => import('../views/TransactionsView.vue') },
    { path: '/settings', component: () => import('../views/SettingsView.vue') },
  ],
})

export default router
