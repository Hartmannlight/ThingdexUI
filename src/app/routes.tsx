import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import Shell from "@/app/Shell";
import InventoryPage from "@/features/inventory/InventoryPage";
import ItemDetailPage from "@/features/inventory/ItemDetailPage";
import ItemTypesPage from "@/features/itemTypes/ItemTypesPage";
import CreateItemTypePage from "@/features/itemTypes/CreateItemTypePage";
import CreateItemsPage from "@/features/items/CreateItemsPage";
import ListItemsPage from "@/features/items/ListItemsPage";
import MissingLocationPage from "@/features/items/MissingLocationPage";
import UpdateItemPage from "@/features/items/UpdateItemPage";
import UpdateItemPropsPage from "@/features/items/UpdateItemPropsPage";
import CreateSnapshotPage from "@/features/items/CreateSnapshotPage";
import ItemHistoryPage from "@/features/items/ItemHistoryPage";
import ItemSnapshotsPage from "@/features/items/ItemSnapshotsPage";
import MoveItemPage from "@/features/move/MoveItemPage";
import SearchPage from "@/features/search/SearchPage";
import LocationsPage from "@/features/locations/LocationsPage";
import UpdateLocationPage from "@/features/locations/UpdateLocationPage";
import MoveLocationPage from "@/features/locations/MoveLocationPage";
import AttachItemPage from "@/features/relations/AttachItemPage";
import DetachRelationPage from "@/features/relations/DetachRelationPage";
import UpdateRelationPage from "@/features/relations/UpdateRelationPage";
import LabelReprintPage from "@/features/labels/LabelReprintPage";
import CreateHubPage from "@/features/hubs/CreateHubPage";
import EditHubPage from "@/features/hubs/EditHubPage";
import DeleteItemPage from "@/features/admin/DeleteItemPage";
import DeleteLocationPage from "@/features/admin/DeleteLocationPage";
import DeleteRelationPage from "@/features/admin/DeleteRelationPage";
import DeleteItemTypePage from "@/features/admin/DeleteItemTypePage";

const rootRoute = createRootRoute({
  component: Shell
});

const inventoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: InventoryPage
});

const itemDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/$itemId",
  component: ItemDetailPage
});

const itemTypesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/item-types",
  component: ItemTypesPage
});

const createItemTypeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/item-types/create",
  component: CreateItemTypePage
});

const deleteItemTypeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/item-types/delete",
  component: DeleteItemTypePage
});

const createItemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create-items",
  component: CreateItemsPage
});

const listItemsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/list",
  component: ListItemsPage
});

const deleteItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/delete",
  component: DeleteItemPage
});

const missingLocationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/missing-location",
  component: MissingLocationPage
});

const updateItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/update",
  component: UpdateItemPage
});

const updateItemPropsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/props",
  component: UpdateItemPropsPage
});

const itemHistoryRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/history",
  component: ItemHistoryPage
});

const itemSnapshotsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/snapshots/list",
  component: ItemSnapshotsPage
});

const createSnapshotRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/items/snapshots",
  component: CreateSnapshotPage
});

const moveItemRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/move",
  component: MoveItemPage
});

const moveLocationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations/move",
  component: MoveLocationPage
});

const locationsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations",
  component: LocationsPage
});

const updateLocationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations/update",
  component: UpdateLocationPage
});

const deleteLocationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/locations/delete",
  component: DeleteLocationPage
});

const attachRelationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/relations/attach",
  component: AttachItemPage
});

const detachRelationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/relations/detach",
  component: DetachRelationPage
});

const updateRelationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/relations/update",
  component: UpdateRelationPage
});

const deleteRelationRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/relations/delete",
  component: DeleteRelationPage
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/search",
  component: SearchPage
});

const labelReprintRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/labels/reprint",
  component: LabelReprintPage
});

const createHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/create",
  component: CreateHubPage
});

const editHubRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/edit",
  component: EditHubPage
});

const routeTree = rootRoute.addChildren([
  inventoryRoute,
  itemDetailRoute,
  itemTypesRoute,
  createItemTypeRoute,
  deleteItemTypeRoute,
  createItemsRoute,
  listItemsRoute,
  deleteItemRoute,
  missingLocationRoute,
  updateItemRoute,
  updateItemPropsRoute,
  itemHistoryRoute,
  itemSnapshotsRoute,
  createSnapshotRoute,
  moveItemRoute,
  moveLocationRoute,
  locationsRoute,
  updateLocationRoute,
  deleteLocationRoute,
  attachRelationRoute,
  detachRelationRoute,
  updateRelationRoute,
  deleteRelationRoute,
  searchRoute,
  labelReprintRoute,
  createHubRoute,
  editHubRoute
]);

export const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
