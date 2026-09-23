/** JECI route map: every member-facing page sits inside the shared social-network shell. */
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/AppLayout";
import { RequireAuth, RequireAdmin } from "@/components/RouteGuards";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import PostDetail from "./pages/PostDetail";
import Notifications from "./pages/Notifications";
import Events from "./pages/Events";
import EventDetail from "./pages/EventDetail";
import Directory from "./pages/Directory";
import Network from "./pages/Network";
import Organization from "./pages/Organization";
import UnitDetail from "./pages/UnitDetail";
import Communities from "./pages/Communities";
import CommunityDetail from "./pages/CommunityDetail";
import VoirJugerAgir from "./pages/VoirJugerAgir";
import Memory from "./pages/Memory";
import Opportunities from "./pages/Opportunities";
import Mentorship from "./pages/Mentorship";
import Messages from "./pages/Messages";
import Profile from "./pages/Profile";
import PublicProfile from "./pages/PublicProfile";
import Saved from "./pages/Saved";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Settings from "./pages/Settings";
import { AdminLayout } from "./components/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminVerifications from "./pages/admin/AdminVerifications";
import { AdminPublications, AdminReports } from "./pages/admin/AdminContent";
import { AdminEvents, AdminMentoring, AdminOpportunities, AdminProjects, AdminOrganization } from "./pages/admin/AdminOperations";
import AdminCommunications from "./pages/admin/AdminCommunications";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminOpportunityCreate from "./pages/admin/AdminOpportunityCreate";
import Login from "./pages/Login";

function Shell({ component: Component }: { component: React.ComponentType }) {
  return (
    <RequireAuth>
      <AppLayout>
        <Component />
      </AppLayout>
    </RequireAuth>
  );
}
function AdminShell({ component: Component }: { component: React.ComponentType }) {
  return (
    <RequireAdmin>
      <AdminLayout>
        <Component />
      </AdminLayout>
    </RequireAdmin>
  );
}
function Router() {
  return <Switch>
    <Route path="/admin/opportunities/new" component={() => <AdminShell component={AdminOpportunityCreate} />} />
    <Route path="/admin/membres" component={() => <AdminShell component={AdminMembers} />} />
    <Route path="/admin/verifications" component={() => <AdminShell component={AdminVerifications} />} />
    <Route path="/admin/organisation" component={() => <AdminShell component={AdminOrganization} />} />
    <Route path="/admin/publications" component={() => <AdminShell component={AdminPublications} />} />
    <Route path="/admin/opportunities" component={() => <AdminShell component={AdminOpportunities} />} />
    <Route path="/admin/mentoring" component={() => <AdminShell component={AdminMentoring} />} />
    <Route path="/admin/events" component={() => <AdminShell component={AdminEvents} />} />
    <Route path="/admin/reports" component={() => <AdminShell component={AdminReports} />} />
    <Route path="/admin/communications" component={() => <AdminShell component={AdminCommunications} />} />
    <Route path="/admin/projects" component={() => <AdminShell component={AdminProjects} />} />
    <Route path="/admin/settings" component={() => <AdminShell component={AdminSettings} />} />
    <Route path="/admin" component={() => <AdminShell component={AdminDashboard} />} />
    <Route path="/login" component={Login} />
    <Route path="/" component={() => <Shell component={Home} />} />
    <Route path="/publications/:id" component={() => <Shell component={PostDetail} />} />
    <Route path="/notifications" component={() => <Shell component={Notifications} />} />
    <Route path="/network" component={() => <Shell component={Network} />} />
    <Route path="/annuaire" component={() => <Shell component={Directory} />} />
    <Route path="/organisation/:id" component={() => <Shell component={UnitDetail} />} />
    <Route path="/organisation" component={() => <Shell component={Organization} />} />
    <Route path="/communautes/:id" component={() => <Shell component={CommunityDetail} />} />
    <Route path="/communautes" component={() => <Shell component={Communities} />} />
    <Route path="/voir-juger-agir" component={() => <Shell component={VoirJugerAgir} />} />
    <Route path="/memoire" component={() => <Shell component={Memory} />} />
    <Route path="/opportunites" component={() => <Shell component={Opportunities} />} />
    <Route path="/mentorat" component={() => <Shell component={Mentorship} />} />
    <Route path="/evenements/:id" component={() => <Shell component={EventDetail} />} />
    <Route path="/evenements" component={() => <Shell component={Events} />} />
    <Route path="/messages" component={() => <Shell component={Messages} />} />
    <Route path="/profil" component={() => <Shell component={Profile} />} />
    <Route path="/profil/:id" component={() => <Shell component={PublicProfile} />} />
    <Route path="/enregistres" component={() => <Shell component={Saved} />} />
    <Route path="/projets/:id" component={() => <Shell component={ProjectDetail} />} />
    <Route path="/projets" component={() => <Shell component={Projects} />} />
    <Route path="/parametres" component={() => <Shell component={Settings} />} />
    <Route path="/404" component={NotFound} />
    <Route component={() => <Shell component={NotFound} />} />
  </Switch>;
}

function App() { return <ErrorBoundary><ThemeProvider defaultTheme="light"><TooltipProvider><Toaster /><Router /></TooltipProvider></ThemeProvider></ErrorBoundary>; }
export default App;
