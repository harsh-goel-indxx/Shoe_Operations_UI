import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AppShell      from "./components/layout/AppShell";
import DashboardPage from "./pages/Dashboard";
import OrdersPage    from "./pages/Orders";
import ProductsPage  from "./pages/Products";
import PartiesPage   from "./pages/Parties";
import ColorsPage    from "./pages/Colors";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry:              1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppShell>
          <Routes>
            <Route path="/"         element={<DashboardPage />} />
            <Route path="/orders"   element={<OrdersPage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/parties"  element={<PartiesPage />} />
            <Route path="/colors"   element={<ColorsPage />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </QueryClientProvider>
  );
}