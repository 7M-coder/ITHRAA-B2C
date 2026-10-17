import axios, { type AxiosInstance } from 'axios'
import { APP_CONFIG } from '@/config/app.config'
/** Create a JSON client. The supplied URL is used without locale or auth assumptions. */
const axiosClient = (baseURL = APP_CONFIG.API.BASE_URL): AxiosInstance =>
  axios.create({
    baseURL,
    timeout: APP_CONFIG.API.TIMEOUT,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' }
  })
export default axiosClient
