const API_BASE = "http://localhost:3001";

export type Favorite = {
  id: number;
  product_id: number;
  created_at: string;
  product_name: string;
  product_price: number;
  product_img: string | null;
};

export async function getFavorites(userId: number) {
  const res = await fetch(`${API_BASE}/favorites?user_id=${userId}`);
  return res.json();
}

export async function addFavorite(userId: number, productId: number) {
  const res = await fetch(`${API_BASE}/favorites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: userId, product_id: productId }),
  });
  return res.json();
}

export async function removeFavorite(userId: number, productId: number) {
  const res = await fetch(`${API_BASE}/favorites/${productId}?user_id=${userId}`, {
    method: "DELETE",
  });
  return res.json();
}
