import { useState } from "react";
import { useParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "../lib/api";
import { useCart } from "../store/cart";

export function useProductPage() {
  const { slug } = useParams();
  const [quantity, setQuantity] = useState(1);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [autoSelectedFor, setAutoSelectedFor] = useState(null);
  const addItem = useCart((s) => s.addItem);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["product", slug],
    queryFn: () => apiFetch(`/api/products/${encodeURIComponent(slug)}`),
  });

  const product = data?.product ?? null;

  // Auto-select the first in-stock variant once the product loads (and
  // reset when navigating to a different product) — adjusting state during
  // render, not an effect, same pattern used elsewhere in this app (e.g.
  // CheckoutPage's default-address autofill).
  if (product && autoSelectedFor !== product.id) {
    setAutoSelectedFor(product.id);
    const variants = product.variants ?? [];
    const firstAvailable = variants.find((v) => v.stockQuantity == null || v.stockQuantity > 0);
    setSelectedVariantId(firstAvailable?.id ?? variants[0]?.id ?? null);
    setQuantity(1);
  }

  const { data: categoryData } = useQuery({
    queryKey: ["products", product?.category ?? null],
    queryFn: () =>
      apiFetch(`/api/products?category=${encodeURIComponent(product.category)}`),
    enabled: Boolean(product?.category),
  });

  const relatedProducts = (categoryData?.products ?? []).filter(
    (p) => p.id !== product?.id,
  );

  const selectedVariant = product?.variants?.find((v) => v.id === selectedVariantId) ?? null;

  function addToCart() {
    if (!product) return;
    addItem(product.id, quantity, selectedVariantId);
  }

  return {
    product,
    relatedProducts,
    isLoading,
    isError,
    quantity,
    setQuantity,
    selectedVariantId,
    setSelectedVariantId,
    selectedVariant,
    addToCart,
  };
}
