import { createRootRoute, createRoute, createRouter, redirect } from "@tanstack/react-router";
import AppShell from "@/components/layout/AppShell";
import AdminPage from "@/pages/AdminPage";
import IntakePage from "@/pages/IntakePage";
import InventoryPage from "@/pages/InventoryPage";
import ItemDetailPage from "@/pages/ItemDetailPage";
import LocationsPage, { LocationDetailPage } from "@/pages/LocationsPage";
import MaintenancePage from "@/pages/MaintenancePage";
import ScanPage from "@/pages/ScanPage";
import SystemPage from "@/pages/SystemPage";

const rootRoute = createRootRoute({
  component: AppShell
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  beforeLoad: () => {
    throw redirect({ to: "/scan" });
  }
});

const scanRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/scan",
  component: ScanPage
});

const locationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations",
  component: LocationsPage
});

const locationDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations/$locationId",
  component: LocationDetailPage
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items",
  component: InventoryPage
});

const itemDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/$itemId",
  component: ItemDetailPage
});

const intakeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/intake",
  component: IntakePage
});

const maintenanceRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/maintenance",
  component: MaintenancePage
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage
});

const systemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/system",
  component: SystemPage
});

const routeTree = rootRoute.addChildren([
  indexRoute,
  scanRoute,
  locationsRoute,
  locationDetailRoute,
  inventoryRoute,
  itemDetailRoute,
  intakeRoute,
  maintenanceRoute,
  adminRoute,
  systemRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
