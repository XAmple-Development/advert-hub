
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ErrorBoundary from "@/components/ErrorBoundary";
import KeyboardShortcuts from "@/components/KeyboardShortcuts";
import BottomNavigation from "@/components/BottomNavigation";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Listings from "./pages/Listings";
import Bots from "./pages/Bots";
import ListingDetail from "./pages/ListingDetail";
import Analytics from "./pages/Analytics";
import AdminDashboard from "./pages/AdminDashboard";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import Gamification from "./pages/Gamification";
import LiveActivity from "./pages/LiveActivity";
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
            <KeyboardShortcuts />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/listings" element={<Listings />} />
              <Route path="/bots" element={<Bots />} />
              <Route path="/listings/:id" element={<ListingDetail />} />
              <Route path="/profile/:userId" element={<Profile />} />
              <Route path="/profile/edit" element={<ProfileEdit />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/activity" element={<LiveActivity />} />
              <Route path="/moderation" element={<Moderation />} />
              <Route path="/events" element={<Events />} />
              <Route path="/forum" element={<Forum />} />
              <Route path="/forum/category/:id" element={<ForumCategory />} />
              <Route path="/forum/topic/:id" element={<ForumTopic />} />
              <Route path="/forum/create" element={<CreateForumTopic />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/subscription-success" element={<SubscriptionSuccess />} />
              <Route path="/admin/subscriptions" element={<AdminSubscriptions />} />
              <Route path="/api" element={<API />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNavigation />
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
