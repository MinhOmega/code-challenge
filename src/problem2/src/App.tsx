import { SwapForm } from '@/components/swap';
import { Toaster } from '@/components/ui/sonner';

function App() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-br from-background via-background to-muted/50 p-4">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Currency Swap</h1>
        <p className="mt-2 text-muted-foreground">
          Swap tokens instantly at the best rates
        </p>
      </div>
      <SwapForm />
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;