import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/lib/auth";
import Landing from "./pages/Landing";
import AuthPage from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Shell from "./components/Shell";
import Feed from "./pages/Feed";
import Opportunities from "./pages/Opportunities";
import Discover from "./pages/Discover";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route element={<Shell />}>
              <Route path="/feed" element={<Feed />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/discover" element={<Discover />} />
              <Route path="/messages" element={<Messages />} />
              <Route path="/messages/:otherId" element={<Messages />} />
              <Route path="/u/:handle" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
