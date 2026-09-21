import { apiFetch } from "../lib/api";
import {useQuery} from "@tanstack/react-query"
import {useSearchParams} from "react-router"

export function useHomeCatalog() {
  const [searchParams, setSearchParams] = useSearchParams()
  const categoryFilter = searchParams.get("category")?.trim() ??""
  const searchTerm = searchParams.get("q")?.trim() ?? ""

   const setCategory = (category) => {
    const next = new URLSearchParams(searchParams);

    if (!category) next.delete("category");
    else next.set("category", category);

    setSearchParams(next, { replace: true });
  };

   const setSearchTerm = (q) => {
    const next = new URLSearchParams(searchParams);

    if (!q) next.delete("q");
    else next.set("q", q);

    setSearchParams(next, { replace: true });
  };

   const { data: categoriesData, isLoading: loadingCategories } = useQuery({
     queryKey: ["product-categories"],
     queryFn: () => apiFetch("/api/products/categories"),
   });

     const {
       data: productsData,
       isLoading: loadingList,
       error,
     } = useQuery({
       queryKey: ["products", categoryFilter, searchTerm],
       queryFn: () => {
         const params = new URLSearchParams();
         if (categoryFilter) params.set("category", categoryFilter);
         if (searchTerm) params.set("q", searchTerm);
         const qs = params.toString();
         return apiFetch(qs ? `/api/products?${qs}` : "/api/products");
       },
     });

       const categories = categoriesData?.categories ?? [];
       const products = productsData?.products ?? [];
       const categoryChipsLoading =
         loadingCategories && categories.length === 0;

       return {
         categoryFilter,
         setCategory,
         searchTerm,
         setSearchTerm,
         categories,
         products,
         categoryChipsLoading,
         loadingCategories,
         loadingList,
         error,
       };
}