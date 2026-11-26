import { createContext, useContext, useState } from "react";

// ============ CONFIG: change only this to adapt the app ============
const CONFIG = {
  shopName: "Campus Cafe",
  currency: "₹",
  taxRate: 5, // percent. Set to 0 for no tax
  products: [
    { id: 1, name: "Veg Sandwich", price: 80, stock: 5, category: "Snacks" },
    { id: 2, name: "Masala Dosa", price: 120, stock: 3, category: "Meals" },
    { id: 3, name: "Cold Coffee", price: 90, stock: 10, category: "Drinks" },
    { id: 4, name: "Brownie", price: 60, stock: 2, category: "Dessert" },
    { id: 5, name: "Fresh Lime Soda", price: 50, stock: 8, category: "Drinks" },
    { id: 6, name: "Pasta", price: 150, stock: 0, category: "Meals" }, // out of stock example
  ],
};

// 1. CREATE the context. It starts empty; the Provider fills it with data.
const CartContext = createContext();

// 2. PROVIDER component: holds the cart state and shares it with all children.
function CartProvider({ children }) {
  const [cart, setCart] = useState([]); // each item: { id, name, price, stock, qty }
  const [notice, setNotice] = useState("");

  const addToCart = (product) => {
    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      if (existing.qty >= product.stock) {
        setNotice(`Only ${product.stock} of ${product.name} available.`);
        return;
      }
      setCart(cart.map((item) => (item.id === product.id ? { ...item, qty: item.qty + 1 } : item)));
    } else {
      if (product.stock < 1) {
        setNotice(`${product.name} is out of stock.`);
        return;
      }
      setCart([...cart, { id: product.id, name: product.name, price: product.price, stock: product.stock, qty: 1 }]);
    }
    setNotice("");
  };

  const increaseQty = (id) => {
    const item = cart.find((i) => i.id === id);
    if (item.qty >= item.stock) {
      setNotice(`Only ${item.stock} of ${item.name} available.`);
      return;
    }
    setCart(cart.map((i) => (i.id === id ? { ...i, qty: i.qty + 1 } : i)));
    setNotice("");
  };

  const decreaseQty = (id) => {
    const item = cart.find((i) => i.id === id);
    if (item.qty === 1) {
      removeItem(id); // quantity would become 0, so remove the item
      return;
    }
    setCart(cart.map((i) => (i.id === id ? { ...i, qty: i.qty - 1 } : i)));
    setNotice("");
  };

  const removeItem = (id) => {
    setCart(cart.filter((item) => item.id !== id));
    setNotice("");
  };

  const clearCart = () => {
    setCart([]);
    setNotice("");
  };

  // Totals calculated with reduce(): (accumulator, currentItem) => newAccumulator
  const totalItems = cart.reduce((sum, item) => sum + item.qty, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = (subtotal * CONFIG.taxRate) / 100;
  const grandTotal = subtotal + tax;

  // Everything children are allowed to use
  const value = {
    cart, notice, totalItems, subtotal, tax, grandTotal,
    addToCart, increaseQty, decreaseQty, removeItem, clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

const money = (amount) => `${CONFIG.currency}${amount.toFixed(2)}`;

// ----- Consumer 1: header shows the item count -----
function Header() {
  const { totalItems } = useContext(CartContext); // 3. CONSUME the context
  return (
    <header className="mb-6 flex items-center justify-between rounded-xl bg-indigo-600 px-5 py-4 text-white shadow">
      <h1 className="text-xl font-bold sm:text-2xl">{CONFIG.shopName}</h1>
      <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-indigo-700">
        Cart: {totalItems}
      </span>
    </header>
  );
}

// ----- Consumer 2: one product card -----
function ProductCard({ product }) {
  const { cart, addToCart } = useContext(CartContext);
  const inCart = cart.find((item) => item.id === product.id);
  const qtyInCart = inCart ? inCart.qty : 0;
  const remaining = product.stock - qtyInCart;

  let buttonText = "Add to Cart";
  if (product.stock === 0) buttonText = "Out of Stock";
  else if (remaining === 0) buttonText = "Max Quantity Added";

  return (
    <div className="rounded-xl bg-white p-4 shadow">
      <span className="text-xs font-medium uppercase text-slate-400">{product.category}</span>
      <h3 className="text-lg font-semibold text-slate-800">{product.name}</h3>
      <p className="text-slate-600">{money(product.price)}</p>
      <p className="mb-3 text-xs text-slate-500">
        {product.stock === 0 ? "Not available" : `${remaining} left in stock`}
      </p>
      <button
        onClick={() => addToCart(product)}
        disabled={remaining <= 0}
        className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {buttonText}
      </button>
    </div>
  );
}

// ----- Product listing -----
function ProductList() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">
      {CONFIG.products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

// ----- One row inside the cart -----
function CartItem({ item }) {
  const { increaseQty, decreaseQty, removeItem } = useContext(CartContext);
  return (
    <li className="border-b py-3">
      <div className="flex justify-between">
        <span className="font-medium text-slate-800">{item.name}</span>
        <span className="font-medium text-slate-800">{money(item.price * item.qty)}</span>
      </div>
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => decreaseQty(item.id)} className="h-7 w-7 rounded bg-slate-200 font-bold hover:bg-slate-300">-</button>
          <span className="w-6 text-center text-sm">{item.qty}</span>
          <button onClick={() => increaseQty(item.id)} className="h-7 w-7 rounded bg-slate-200 font-bold hover:bg-slate-300">+</button>
          <span className="text-xs text-slate-500">@ {money(item.price)}</span>
        </div>
        <button onClick={() => removeItem(item.id)} className="text-sm text-red-600 hover:underline">Remove</button>
      </div>
    </li>
  );
}

// ----- Cart panel with totals -----
function Cart() {
  const { cart, notice, subtotal, tax, grandTotal, clearCart } = useContext(CartContext);

  return (
    <aside className="h-fit rounded-xl bg-white p-5 shadow">
      <h2 className="mb-3 text-lg font-semibold text-slate-700">Your Cart</h2>

      {notice && <p className="mb-3 rounded bg-amber-100 px-3 py-2 text-sm text-amber-800">{notice}</p>}

      {cart.length === 0 ? (
        <p className="py-8 text-center text-slate-500">Your cart is empty. Add something tasty!</p>
      ) : (
        <>
          <ul>
            {cart.map((item) => (
              <CartItem key={item.id} item={item} />
            ))}
          </ul>

          <div className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{money(subtotal)}</span>
            </div>
            {CONFIG.taxRate > 0 && (
              <div className="flex justify-between text-slate-600">
                <span>Tax ({CONFIG.taxRate}%)</span>
                <span>{money(tax)}</span>
              </div>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold text-slate-800">
              <span>Grand Total</span>
              <span>{money(grandTotal)}</span>
            </div>
          </div>

          <button onClick={clearCart} className="mt-4 w-full rounded-lg bg-red-100 py-2 text-sm font-medium text-red-700 hover:bg-red-200">
            Clear Cart
          </button>
        </>
      )}
    </aside>
  );
}

// Root component: wraps everything in the Provider so all children can use the cart
export default function UniversalCart() {
  return (
    <CartProvider>
      <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
        <div className="mx-auto max-w-6xl">
          <Header />
          <div className="grid gap-6 lg:grid-cols-3">
            <ProductList />
            <Cart />
          </div>
        </div>
      </div>
    </CartProvider>
  );
}
