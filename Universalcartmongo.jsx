
import React, { createContext, useContext, useEffect, useState } from "react";

// ---------------- CONFIGURATION ----------------

const CONFIG = {
  shopName: "Campus Cafe",
  currency: "₹",
  taxRate: 5,
  apiUrl: "http://localhost:5000/api/records",
  recordType: "Product"
};

// ---------------- CART CONTEXT ----------------

const CartContext = createContext();

function CartProvider({ children }) {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // Fetch products from MongoDB
  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(CONFIG.apiUrl);

      if (!response.ok) {
        throw new Error("Could not fetch products");
      }

      const data = await response.json();

      const filteredProducts = data
        .filter(item => item.category === CONFIG.recordType)
        .map(item => ({
          id: item._id,
          name: item.name,
          price: Number(item.details?.price || 0),
          stock: Number(item.details?.stock || 0),
          category: item.details?.category || "General"
        }));

      setProducts(filteredProducts);
    } catch (err) {
      setError(err.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Add a product to MongoDB
  const addProduct = async (product) => {
    try {
      setSaving(true);
      setError("");

      const response = await fetch(CONFIG.apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          name: product.name,
          category: CONFIG.recordType,
          details: {
            price: Number(product.price),
            stock: Number(product.stock),
            category: product.category
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not add product");
      }

      await fetchProducts();
      setNotice("Product added successfully!");
      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Add product to cart
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    const quantity = existing ? existing.quantity : 0;

    if (quantity >= product.stock) {
      setNotice("No more stock available!");
      return;
    }

    if (existing) {
      setCart(prev =>
        prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart(prev => [...prev, { ...product, quantity: 1 }]);
    }

    setNotice("Added to cart!");
  };

  // Increase quantity
  const increaseQty = (id) => {
    const product = products.find(item => item.id === id);
    const item = cart.find(item => item.id === id);

    if (!product || !item || item.quantity >= product.stock) {
      setNotice("Stock limit reached!");
      return;
    }

    setCart(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  };

  // Decrease quantity
  const decreaseQty = (id) => {
    setCart(prev =>
      prev
        .map(item =>
          item.id === id
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter(item => item.quantity > 0)
    );
  };

  // Remove item
  const removeItem = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  // Clear cart
  const clearCart = () => {
    setCart([]);
  };

  // Calculate total
  const subtotal = cart.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const tax = subtotal * CONFIG.taxRate / 100;
  const total = subtotal + tax;

  return (
    <CartContext.Provider value={{
      products,
      cart,
      loading,
      saving,
      error,
      notice,
      setNotice,
      fetchProducts,
      addProduct,
      addToCart,
      increaseQty,
      decreaseQty,
      removeItem,
      clearCart,
      subtotal,
      tax,
      total
    }}>
      {children}
    </CartContext.Provider>
  );
}

function useCart() {
  return useContext(CartContext);
}

// ---------------- HEADER ----------------

function Header() {
  const { cart } = useCart();

  const count = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  return (
    <header className="bg-indigo-700 text-white px-6 py-5 flex justify-between items-center">
      <h1 className="text-2xl font-bold">
        {CONFIG.shopName}
      </h1>

      <div className="font-semibold">
        🛒 Cart ({count})
      </div>
    </header>
  );
}

// ---------------- ADD PRODUCT FORM ----------------

function AddProductForm() {
  const { addProduct, saving } = useCart();

  const [form, setForm] = useState({
    name: "",
    price: "",
    stock: "",
    category: ""
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (
      !form.name.trim() ||
      !form.category.trim() ||
      form.price === "" ||
      form.stock === "" ||
      Number(form.price) < 0 ||
      Number(form.stock) < 0
    ) {
      alert("Please enter valid product details");
      return;
    }

    const success = await addProduct(form);

    if (success) {
      setForm({
        name: "",
        price: "",
        stock: "",
        category: ""
      });
    }
  };

  return (
    <section className="bg-white rounded-xl shadow p-6 mb-8">
      <h2 className="text-xl font-bold mb-4">
        Add New Product
      </h2>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Product Name"
          className="border p-3 rounded-lg"
          required
        />

        <input
          name="price"
          type="number"
          min="0"
          value={form.price}
          onChange={handleChange}
          placeholder="Price"
          className="border p-3 rounded-lg"
          required
        />

        <input
          name="stock"
          type="number"
          min="0"
          value={form.stock}
          onChange={handleChange}
          placeholder="Available Stock"
          className="border p-3 rounded-lg"
          required
        />

        <input
          name="category"
          value={form.category}
          onChange={handleChange}
          placeholder="Category (e.g. Snacks)"
          className="border p-3 rounded-lg"
          required
        />

        <button
          type="submit"
          disabled={saving}
          className="sm:col-span-2 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Adding..." : "Add Product"}
        </button>

      </form>
    </section>
  );
}

// ---------------- PRODUCT CARD ----------------

function ProductCard({ product }) {
  const { addToCart, cart } = useCart();

  const cartItem = cart.find(item => item.id === product.id);
  const quantity = cartItem ? cartItem.quantity : 0;
  const available = product.stock - quantity;

  return (
    <div className="bg-white rounded-xl shadow p-5">
      <h3 className="text-lg font-bold">
        {product.name}
      </h3>

      <p className="text-gray-500 text-sm mt-1">
        {product.category}
      </p>

      <p className="text-indigo-700 text-xl font-bold mt-3">
        {CONFIG.currency}{product.price}
      </p>

      <p className="text-sm text-gray-500 mt-1">
        Available: {available}
      </p>

      <button
        onClick={() => addToCart(product)}
        disabled={available <= 0}
        className="mt-4 w-full bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
      >
        {available <= 0 ? "Out of Stock" : "Add to Cart"}
      </button>
    </div>
  );
}

// ---------------- PRODUCT LIST ----------------

function ProductList() {
  const { products, loading, error, fetchProducts } = useCart();

  if (loading) {
    return <p className="text-center py-6">Loading products...</p>;
  }

  if (error && products.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-red-600">{error}</p>
        <button
          onClick={fetchProducts}
          className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <p className="text-center text-gray-500 py-6">
        No products available. Add your first product above!
      </p>
    );
  }

  return (
    <section>
      <h2 className="text-xl font-bold mb-4">
        Our Products
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map(product => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

// ---------------- CART ITEM ----------------

function CartItem({ item }) {
  const { increaseQty, decreaseQty, removeItem } = useCart();

  return (
    <div className="flex justify-between items-center border-b py-4 gap-3">
      <div>
        <h3 className="font-semibold">{item.name}</h3>
        <p className="text-gray-500 text-sm">
          {CONFIG.currency}{item.price} × {item.quantity}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => decreaseQty(item.id)}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          -
        </button>

        <span>{item.quantity}</span>

        <button
          onClick={() => increaseQty(item.id)}
          className="bg-gray-200 px-3 py-1 rounded"
        >
          +
        </button>

        <button
          onClick={() => removeItem(item.id)}
          className="text-red-600 ml-2"
        >
          Remove
        </button>
      </div>
    </div>
  );
}

// ---------------- CART ----------------

function Cart() {
  const {
    cart,
    subtotal,
    tax,
    total,
    clearCart
  } = useCart();

  return (
    <section className="bg-white rounded-xl shadow p-6 mt-8">
      <h2 className="text-xl font-bold mb-4">
        Your Shopping Cart
      </h2>

      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          {cart.map(item => (
            <CartItem key={item.id} item={item} />
          ))}

          <div className="mt-5 space-y-2 text-right">
            <p>Subtotal: {CONFIG.currency}{subtotal.toFixed(2)}</p>
            <p>Tax ({CONFIG.taxRate}%): {CONFIG.currency}{tax.toFixed(2)}</p>

            <p className="text-xl font-bold">
              Total: {CONFIG.currency}{total.toFixed(2)}
            </p>
          </div>

          <button
            onClick={clearCart}
            className="mt-5 bg-red-600 text-white px-5 py-2 rounded-lg"
          >
            Clear Cart
          </button>
        </>
      )}
    </section>
  );
}

// ---------------- MAIN APP ----------------

function UniversalCart() {
  const { notice, setNotice, error } = useCart();

  return (
    <div className="min-h-screen bg-slate-100">
      <Header />

      <main className="max-w-6xl mx-auto p-5 sm:p-8">

        {notice && (
          <div className="bg-green-100 text-green-800 p-3 rounded-lg mb-5 flex justify-between">
            {notice}
            <button onClick={() => setNotice("")}>✕</button>
          </div>
        )}

        {error && (
          <p className="text-red-600 mb-4">{error}</p>
        )}

        <AddProductForm />

        <ProductList />

        <Cart />

      </main>
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <UniversalCart />
    </CartProvider>
  );
}
