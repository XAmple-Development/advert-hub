
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import MaintenanceMode from "./components/MaintenanceMode";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import BottomNavigation from "@/components/BottomNavigation";
import ProtectedRoute from "@/components/ProtectedRoute";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Listings from "./pages/Listings";
import ListingDetail from "./pages/ListingDetail";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Gamification from "./pages/Gamification";

import Moderation from "./pages/Moderation";
import Events from "./pages/Events";
import Forum from "./pages/Forum";
import ForumCategory from "./pages/ForumCategory";
import ForumTopic from "./pages/ForumTopic";
import CreateForumTopic from "./pages/CreateForumTopic";
import Pricing from "./pages/Pricing";
import SubscriptionSuccess from "./pages/SubscriptionSuccess";
import AdminSubscriptions from "./pages/AdminSubscriptions";
import API from "./pages/API";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <MaintenanceMode>
              <KeyboardShortcuts />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/listings/:id" element={<ListingDetail />} />
                <Route path="/profile/:userId" element={<Profile />} />
                <Route path="/profile/edit" element={<ProfileEdit />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/admin" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/gamification" element={<Gamification />} />
                
                <Route path="/moderation" element={<Moderation />} />
                <Route path="/events" element={<Events />} />
                <Route path="/forum" element={<Forum />} />
                <Route path="/forum/category/:id" element={<ForumCategory />} />
                <Route path="/forum/topic/:id" element={<ForumTopic />} />
                <Route path="/forum/create" element={<CreateForumTopic />} />
                <Route path="/pricing" element={<Pricing />} />
                <Route path="/subscription-success" element={<SubscriptionSuccess />} />
                <Route path="/admin/subscriptions" element={
                  <ProtectedRoute requireAdmin={true}>
                    <AdminSubscriptions />
                  </ProtectedRoute>
                } />
                <Route path="/api" element={<API />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
              <BottomNavigation />
            </MaintenanceMode>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
