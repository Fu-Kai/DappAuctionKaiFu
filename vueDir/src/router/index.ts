import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'
import Home from '../views/Home.vue'

const routes: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/myself',
    name: 'myself',
    component: () => import('../views/Myself.vue')
  },
  {
    path: '/Auction/:id',
    name: 'Auction',
    component: () => import('../views/Auction.vue')
  }
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
