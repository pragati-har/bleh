
import { createContext, useContext, useState } from "react";

// 1. PRODUCTS
const products = [
  { id: 1, name: "Wireless Mouse", price: 599 },
  { id: 2, name: "Keyboard", price: 999 },
  { id: 3, name: "Headphones", price: 1499 },
  { id: 4, name: "USB Cable", price: 199 }
];

// 2. CREATE CONTEXT
const CartContext = createContext();

// 3. CONTEXT PROVIDER
function CartProvider({ children }) {
  const [cart, setCart] = useState([]);

  const addToCart = (product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);

      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const total = cart.reduce(
    (sum, item) => sum + item.price * item.quantity, 0
  );

  return (
    <CartContext.Provider
      value={{ cart, addToCart, removeFromCart, total }}
    >
      {children}
    </CartContext.Provider>
  );
}

// 4. PRODUCT LIST
function ProductList() {
  const { addToCart } = useContext(CartContext);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Available Products</h2>

      {products.map(product => (
        <div key={product.id}
          className="flex justify-between items-center border-b py-4 gap-3">

          <div>
            <h3 className="font-semibold">{product.name}</h3>
            <p className="text-gray-500">₹{product.price}</p>
          </div>

          <button
            onClick={() => addToCart(product)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg">
            Add to Cart
          </button>
        </div>
      ))}
    </div>
  );
}

// 5. CART COMPONENT
function Cart() {
  const { cart, removeFromCart, total } = useContext(CartContext);

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h2 className="text-xl font-bold mb-4">Shopping Cart</h2>

      {cart.length === 0 ? (
        <p className="text-gray-500">Your cart is empty!</p>
      ) : (
        cart.map(item => (
          <div key={item.id}
            className="flex justify-between items-center border-b py-4 gap-3">

            <div>
              <h3 className="font-semibold">{item.name}</h3>
              <p className="text-gray-500">
                ₹{item.price} × {item.quantity}
              </p>
            </div>

            <div className="text-right">
              <p className="font-semibold">
                ₹{item.price * item.quantity}
              </p>

              <button
                onClick={() => removeFromCart(item.id)}
                className="text-red-600 text-sm">
                Remove
              </button>
            </div>
          </div>
        ))
      )}

      <div className="flex justify-between mt-5">
        <h3 className="font-bold text-lg">Total Amount</h3>
        <h3 className="font-bold text-xl text-blue-700">₹{total}</h3>
      </div>
    </div>
  );
}

// 6. MAIN DASHBOARD
function Dashboard() {
  return (
    <div className="min-h-screen bg-slate-100 p-6">
      <div className="max-w-5xl mx-auto">

        <div className="bg-blue-700 text-white p-6 rounded-xl mb-6">
          <h1 className="text-3xl font-bold">Product Cart</h1>
          <p className="mt-2 text-blue-100">
            Browse products and manage your shopping cart.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ProductList />
          <Cart />
        </div>

      </div>
    </div>
  );
}

// 7. APP COMPONENT
export default function App() {
  return (
    <CartProvider>
      <Dashboard />
    </CartProvider>
  );
}
