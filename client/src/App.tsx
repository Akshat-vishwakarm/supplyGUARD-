import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SidebarLayout from "@/components/sidebar-layout";
import MainDashboard from "@/pages/main-dashboard";
import SecurityEventsPage from "@/pages/security-events";
import SectorImpactPage from "@/pages/sector-impact";
import RecommendationsPage from "@/pages/recommendations";
import ScenarioLabPage from "@/pages/scenario-lab";
import ReportsPage from "@/pages/reports";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <SidebarLayout>
      <Switch>
        <Route path="/" component={MainDashboard} />
        <Route path="/security-events" component={SecurityEventsPage} />
        <Route path="/sector-impact" component={SectorImpactPage} />
        <Route path="/recommendations" component={RecommendationsPage} />
        <Route path="/scenario-lab" component={ScenarioLabPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route component={NotFound} />
      </Switch>
    </SidebarLayout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
