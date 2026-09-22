import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

// Cada rota no seu próprio chunk — sem isso, quem abre só a página de venda
// (o caso mais comum, vindo de anúncio) baixava também o código do Quiz,
// da Index e do Result, que nunca usa. Reduziu o "JavaScript não usado"
// apontado pelo PageSpeed Insights (2026-09-19).
const Redirect = lazy(() => import("./pages/Redirect.tsx"));
const Index = lazy(() => import("./pages/Index.tsx"));
const Result = lazy(() => import("./pages/Result.tsx"));
const Quiz = lazy(() => import("./pages/Quiz.tsx"));
const Oferta5Fornecedores = lazy(() => import("./pages/Oferta5Fornecedores.tsx"));
const RemarketingFornecedores = lazy(() => import("./pages/RemarketingFornecedores.tsx"));
const RemarketingGrupo = lazy(() => import("./pages/RemarketingGrupo.tsx"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// QueryClientProvider/Toaster/Sonner/TooltipProvider removidos em 2026-09-19 —
// nenhuma página do site usa react-query, toast ou tooltip (herança do
// template shadcn), e eles pesavam no bundle carregado ANTES de qualquer
// conteúdo aparecer, direto no caminho crítico do LCP.
const App = () => (
  <BrowserRouter>
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Redirect />} />
        <Route path="/lp" element={<Index />} />
        <Route path="/resultado" element={<Result />} />
        <Route path="/q/:slug" element={<Quiz />} />
        <Route path="/oferta/5-fornecedores" element={<Oferta5Fornecedores />} />
        <Route path="/remarketing/5-fornecedores" element={<RemarketingFornecedores />} />
        <Route path="/remarketing/grupo-5-fornecedores" element={<RemarketingGrupo />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </BrowserRouter>
);

export default App;
