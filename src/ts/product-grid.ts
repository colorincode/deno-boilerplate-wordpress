// product-grid.ts
async function loadCategoryProducts(category: string, containerId: string) {
  try {
    const res = await fetch(`http://localhost:8000/src/get-products.php?category=${category}`);
    const products = await res.json();

    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = products
      .map(
        (p: any) => `
      <div class="product-card">
        <img src="${p.image}" alt="${p.name}" />
        <h3>${p.name}</h3>
        <p>$${p.price.toFixed(2)}</p>
      </div>
    `
      )
      .join('');
  } catch (err) {
    console.error('Error loading products:', err);
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const container = document.getElementById('product-grid-container');
  if (!container) return;

  const category = container.dataset.category; // data-category="prints"
  if (category) {
    loadCategoryProducts(category, 'product-grid-container');
  }
});
