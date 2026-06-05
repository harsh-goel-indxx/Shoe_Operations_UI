import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { colorsApi, partiesApi, subPartiesApi, productsApi, orderItemsApi, ordersApi } from "../api";

// ── Colors ─────────────────────────────────────────────────────────────
export const useColors = () =>
  useQuery({ queryKey: ["colors"], queryFn: () => colorsApi.getAll().then(r => r.data) });

export const useColorMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries(["colors"]);
  return {
    create: useMutation({ mutationFn: colorsApi.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }) => colorsApi.update(id, data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: colorsApi.remove, onSuccess: invalidate }),
  };
};

// ── Parties ────────────────────────────────────────────────────────────
export const useParties = () =>
  useQuery({ queryKey: ["parties"], queryFn: () => partiesApi.getAll().then(r => r.data) });

export const usePartyMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries(["parties"]);
  return {
    create: useMutation({ mutationFn: partiesApi.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }) => partiesApi.update(id, data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: partiesApi.remove, onSuccess: invalidate }),
  };
};

// ── Sub Parties ────────────────────────────────────────────────────────
export const useSubParties = (partyId) =>
  useQuery({
    queryKey: ["sub-parties", partyId],
    queryFn:  () => (partyId
      ? partiesApi.getSubParties(partyId).then(r => r.data)
      : subPartiesApi.getAll().then(r => r.data)),
  });

export const useSubPartyMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries(["sub-parties"]);
  return {
    create: useMutation({ mutationFn: subPartiesApi.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }) => subPartiesApi.update(id, data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: subPartiesApi.remove, onSuccess: invalidate }),
  };
};

// ── Products ───────────────────────────────────────────────────────────
export const useProducts = () =>
  useQuery({ queryKey: ["products"], queryFn: () => productsApi.getAll().then(r => r.data) });

export const useProductMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries(["products"]);
  return {
    create: useMutation({ mutationFn: productsApi.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }) => productsApi.update(id, data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: productsApi.remove, onSuccess: invalidate }),
  };
};

// ── Orders ─────────────────────────────────────────────────────────────
export const useOrders = () =>
  useQuery({ queryKey: ["orders"], queryFn: () => ordersApi.getAll().then(r => r.data) });

export const useOrderMutations = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries(["orders"]);
  return {
    create: useMutation({ mutationFn: ordersApi.create, onSuccess: invalidate }),
    update: useMutation({ mutationFn: ({ id, data }) => ordersApi.update(id, data), onSuccess: invalidate }),
    remove: useMutation({ mutationFn: ordersApi.remove, onSuccess: invalidate }),
  };
};