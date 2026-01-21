import { lazy, Suspense } from 'react'
import { Route, Switch } from 'wouter'
import { Layout } from '@/components/Layout'
import { LocalWalletProvider } from '@/lib/useLocalWallet'
import { LanguageProvider } from '@/lib/useLanguage'
import { Loader2 } from 'lucide-react'

// Lazy load pages for better initial load performance
const Home = lazy(() => import('@/pages/Home').then(m => ({ default: m.Home })))
const Metrics = lazy(() => import('@/pages/Metrics').then(m => ({ default: m.Metrics })))
const UseCases = lazy(() => import('@/pages/UseCases').then(m => ({ default: m.UseCases })))

// Loading fallback component
function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function App() {
  return (
    <LanguageProvider>
      <LocalWalletProvider>
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={Home} />
              <Route path="/metrics" component={Metrics} />
              <Route path="/use-cases" component={UseCases} />
              <Route>
                <div className="text-center py-16">
                  <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
                </div>
              </Route>
            </Switch>
          </Suspense>
        </Layout>
      </LocalWalletProvider>
    </LanguageProvider>
  )
}

export default App
