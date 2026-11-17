/// <reference types="vite/client" />
import type { ZivaApi } from '@shared/ipc-contract'

declare global {
  interface Window {
    ziva: ZivaApi
  }
}
