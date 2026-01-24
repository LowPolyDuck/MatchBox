import { wagmiConfig } from "@/config/wagmi"
import { GaugeProfilesProvider } from "@/contexts/GaugeProfilesContext"
import { NetworkProvider } from "@/contexts/NetworkContext"
import {
  ThemeProvider,
  getThemeObject,
  useTheme,
} from "@/contexts/ThemeContext"
import { ClayProvider } from "@mezo-org/mezo-clay"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { AppProps } from "next/app"
import { WagmiProvider } from "wagmi"
import { SunsetBackground } from "./SunsetBackground"

const queryClient = new QueryClient()

type ClientAppProps = Pick<AppProps, "Component" | "pageProps">

import { Layout } from "./Layout"

function ThemedApp({ Component, pageProps }: ClientAppProps) {
  const { theme } = useTheme()
  const themeObject = getThemeObject(theme)

  return (
    <ClayProvider theme={themeObject}>
      <SunsetBackground />
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </ClayProvider>
  )
}

export function ClientApp({ Component, pageProps }: ClientAppProps) {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider>
          <NetworkProvider>
            <GaugeProfilesProvider>
              <ThemedApp Component={Component} pageProps={pageProps} />
            </GaugeProfilesProvider>
          </NetworkProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
