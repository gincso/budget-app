import type { CapacitorConfig } from "@capacitor/cli"

const config: CapacitorConfig = {
  appId: "tech.gincso.budget",
  appName: "BudgetApp",
  webDir: ".next",
  server: {
    url: "https://budget.gincso.tech",
    cleartext: false,
    allowNavigation: ["budget.gincso.tech"],
  },
  android: {
    allowMixedContent: false,
  },
}

export default config
