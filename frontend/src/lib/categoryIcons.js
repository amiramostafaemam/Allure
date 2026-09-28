import {
  BackpackIcon,
  CameraIcon,
  FootprintsIcon,
  GemIcon,
  HeadphonesIcon,
  HomeIcon,
  LayoutGridIcon,
  MonitorIcon,
  ShirtIcon,
  SprayCanIcon,
  WatchIcon,
  WifiIcon,
} from "lucide-react";

// A category is just {name, nameAr} from the API (see productController.ts's
// getCategories) with nothing visual attached — this maps the known English
// names (the canonical key used everywhere) to a representative icon, with a
// sensible fallback for any category added later that isn't in the list yet.
export const CATEGORY_ICONS = {
  Accessories: GemIcon,
  Apparel: ShirtIcon,
  Audio: HeadphonesIcon,
  Beauty: SprayCanIcon,
  Cameras: CameraIcon,
  Footwear: FootprintsIcon,
  Fragrance: SprayCanIcon,
  Home: HomeIcon,
  Travel: BackpackIcon,
  Watches: WatchIcon,
  Wearables: WifiIcon,
  Workspace: MonitorIcon,
};

export const DEFAULT_CATEGORY_ICON = LayoutGridIcon;
