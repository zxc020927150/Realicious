const API_BASE = "http://localhost:3001";

export type ProductImage = {
  url: string;
  alt_text?: string | null;
  is_main: number;
};

export type Product = {
  id: number;
  name: string;
  price: number;
  discount: number;
  stock_qty: number;
  category_id: number;
  category_name: string;
  description?: string;
  main_img?: string;
  images?: ProductImage[];
};

export async function getProducts(params?: {
  page?: number;
  category_id?: string;
  keyword?: string;
}) {
  const query = new URLSearchParams();
  if (params?.page) query.set("page", String(params.page));
  if (params?.category_id) query.set("category_id", params.category_id);
  if (params?.keyword) query.set("keyword", params.keyword);

  const res = await fetch(`${API_BASE}/products?${query}`);
  return res.json();
}

export async function getProductById(id: string) {
  const res = await fetch(`${API_BASE}/products/${id}`);
  return res.json();
}
