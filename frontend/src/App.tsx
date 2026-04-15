import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { MainLayout } from "@/components/layout/MainLayout";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const Career = lazy(() => import("./pages/Career"));
const Championships = lazy(() => import("./pages/Championships"));
const ChampionshipDetail = lazy(() => import("./pages/ChampionshipDetail"));
const Organizer = lazy(() => import("./pages/Organizer"));
const Events = lazy(() => import("./pages/Events"));
const EventDetail = lazy(() => import("./pages/EventDetail"));
const Pilots = lazy(() => import("./pages/Pilots"));
const PilotDetail = lazy(() => import("./pages/PilotDetail"));
const Standings = lazy(() => import("./pages/Standings"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Auth = lazy(() => import("./pages/Auth"));
const Admin = lazy(() => import("./pages/Admin"));
const NotFound = lazy(() => import("./pages/NotFound"));
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <MainLayout>
            <Suspense fallback={<div className="flex items-center justify-center h-full"><span className="text-muted-foreground">Carregando...</span></div>}>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/career" element={<Career />} />
                <Route path="/championships" element={<Championships />} />
                <Route path="/championships/:id" element={<ChampionshipDetail />} />
                <Route path="/organizer" element={<Organizer />} />
                <Route path="/events" element={<Events />} />
                <Route path="/events/:id" element={<EventDetail />} />
                <Route path="/pilots" element={<Pilots />} />
                <Route path="/pilots/:id" element={<PilotDetail />} />
                <Route path="/standings" element={<Standings />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </MainLayout>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
