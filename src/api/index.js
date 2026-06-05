import apiClient from "./client";

export const colorsApi = {
  getAll:    ()         => apiClient.get("colors/"),
  getOne:    (id)       => apiClient.get(`colors/${id}/`),
  create:    (data)     => apiClient.post("colors/", data),
  update:    (id, data) => apiClient.put(`colors/${id}/`, data),
  remove:    (id)       => apiClient.delete(`colors/${id}/`),
};

export const partiesApi = {
  getAll:        ()         => apiClient.get("parties/"),
  getOne:        (id)       => apiClient.get(`parties/${id}/`),
  create:        (data)     => apiClient.post("parties/", data),
  update:        (id, data) => apiClient.put(`parties/${id}/`, data),
  remove:        (id)       => apiClient.delete(`parties/${id}/`),
  getSubParties: (id)       => apiClient.get(`parties/${id}/sub-parties/`),
};

export const subPartiesApi = {
  getAll:    ()         => apiClient.get("sub-parties/"),
  getOne:    (id)       => apiClient.get(`sub-parties/${id}/`),
  create:    (data)     => apiClient.post("sub-parties/", data),
  update:    (id, data) => apiClient.put(`sub-parties/${id}/`, data),
  remove:    (id)       => apiClient.delete(`sub-parties/${id}/`),
};

export const productsApi = {
  getAll:          ()         => apiClient.get("products/"),
  getOne:          (id)       => apiClient.get(`products/${id}/`),
  create:          (data)     => apiClient.post("products/", data),
  update:          (id, data) => apiClient.put(`products/${id}/`, data),
  remove:          (id)       => apiClient.delete(`products/${id}/`),
  getColors:       (id)       => apiClient.get(`products/${id}/available-colors/`),
};

export const orderItemsApi = {
  getAll:    ()         => apiClient.get("order-items/"),
  getOne:    (id)       => apiClient.get(`order-items/${id}/`),
  create:    (data)     => apiClient.post("order-items/", data),
  update:    (id, data) => apiClient.put(`order-items/${id}/`, data),
  remove:    (id)       => apiClient.delete(`order-items/${id}/`),
};

export const ordersApi = {
  getAll:      ()         => apiClient.get("orders/"),
  getOne:      (id)       => apiClient.get(`orders/${id}/`),
  create:      (data)     => apiClient.post("orders/", data),
  update:      (id, data) => apiClient.put(`orders/${id}/`, data),
  remove:      (id)       => apiClient.delete(`orders/${id}/`),
  getItems:    (id)       => apiClient.get(`orders/${id}/order-items/`),
};