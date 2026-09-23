import { useEffect } from "react";
import { useLocation } from "react-router";

// Client-side navigation never resets scroll position the way a real page
// load does — clicking a footer link while scrolled down (the common case:
// footer links live at the bottom of the page) swaps in the new page's
// content but leaves the viewport right where it was, so nothing visibly
// confirms the navigation happened without scrolling up manually. Keyed on
// pathname only, not the full location, so query-param-only changes (the
// catalog's category/search filters) don't get yanked back to the top.
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);

  return null;
}

export default ScrollToTop;
