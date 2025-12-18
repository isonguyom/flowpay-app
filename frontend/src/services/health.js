import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const getHealth = () => {
  return axios.get(`${API_URL}/health`)
}
