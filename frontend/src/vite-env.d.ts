/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string
  readonly VITE_STANDARD_PLAN_PRICE: string
  readonly VITE_PRO_PLAN_PRICE: string
  // 可以在这里添加更多环境变量类型定义
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
