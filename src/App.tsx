import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Cada rota no seu próprio chunk — sem isso, quem abre só a página de venda
// (o caso mais comum, vindo de anúncio) baixava também o código do Quiz,
// da Index e do Result, que nunca usa. Reduziu o "JavaScript não usado"
// apontado pelo PageSpeed Insights (2026-09-19).
const Redirect = lazy(() => import("./pages/Redirect.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const Result = lazy(() => import("./pages/Result.tsx"));
const Quiz = lazy(() => import("./pages/Quiz.tsx"));
const Oferta5Fornecedores = lazy(() => import("./pages/Oferta5Fornecedores.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={null}>
          <Routes>
            <Route path="/" element={<Redirect />} />
            <Route path="/lp" element={<Index />} />
            <Route path="/resultado" element={<Result />} />
            <Route path="/q/:slug" element={<Quiz />} />
            <Route path="/oferta/5-fornecedores" element={<Oferta5Fornecedores />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
