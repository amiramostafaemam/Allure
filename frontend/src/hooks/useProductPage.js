import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useCart } from "../store/cart";

export function useProductPage() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const addItem = useCart((s) => s.addItem);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => apiFetch(`/api/products/${encodeURIComponent(slug)}`),
  });

  const product = data?.product ?? null;

  const { data: categoryData } = useQuery({
    queryKey: ["products", product?.category ?? null],
    queryFn: () =>
      apiFetch(`/api/products?category=${encodeURIComponent(product.category)}`),
    enabled: Boolean(product?.category),
  });

  const relatedProducts = (categoryData?.products ?? []).filter(
    (p) => p.id !== product?.id,
  );

  function addToCart() {
    if (!product) return;
    addItem(product.id, quantity);
  }

  return {
    product,
    relatedProducts,
    isLoading,
    isError,
    quantity,
    setQuantity,
    addToCart,
  };
}
