
import { createContext, useContext, useState, useEffect } from "react";

// 1. CONFIGURATION
const CONFIG = {
  title: "Cafe Management System",
  itemName: "Cafe Item",
  storageKey: "cafeItems",
  fields: [
    { name: "name", label: "Item Name", type: "text" },
    { name: "category", label: "Category", type: "text" },
    { name: "price", label: "Price", type: "number" },
    { name: "description", label: "Description", type: "text" }
  ]
};

const createEmptyForm = () =>
  Object.fromEntries(CONFIG.fields.map(f => [f.name, ""]));

const ItemContext = createContext();

// 2. CONTEXT PROVIDER
function ItemProvider({ children }) {
  const [items, setItems] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(items));
  }, [items]);

  const addItem = item =>
    setItems(prev => [...prev, {
      ...item,
      id: Date.now(),
      active: true
    }]);

  const deleteItem = id =>
    setItems(prev => prev.filter(item => item.id !== id));

  const updateItem = (id, data) =>
    setItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, ...data } : item
      )
    );

  const toggleItem = id =>
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, active: !item.active }
          : item
      )
    );

  return (
    <ItemContext.Provider
      value={{ items, addItem, deleteItem, updateItem, toggleItem }}
    >
      {children}
    </ItemContext.Provider>
  );
}

// 3. FORM COMPONENT
function ItemForm({ editingItem, setEditingItem }) {
  const { addItem, updateItem } = useContext(ItemContext);
  const [form, setForm] = useState(createEmptyForm);

  useEffect(() => {
    if (editingItem) {
      setForm({ ...editingItem });
    } else {
      setForm(createEmptyForm());
    }
  }, [editingItem]);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = e => {
    e.preventDefault();

    for (let field of CONFIG.fields) {
      if (!String(form[field.name] ?? "").trim()) {
        alert("Please fill all fields!");
        return;
      }
    }

    const data = { ...form };

    CONFIG.fields.forEach(field => {
      if (field.type === "number") {
        data[field.name] = Number(data[field.name]);
      }
    });

    if (editingItem) {
      updateItem(editingItem.id, data);
      setEditingItem(null);
    } else {
      addItem(data);
    }

    setForm(createEmptyForm());
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
      <h2 className="text-xl font-bold text-gray-800 mb-5">
        {editingItem ? "Edit" : "Add New"} {CONFIG.itemName}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {CONFIG.fields.map(field => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {field.label}
            </label>

            <input
              type={field.type}
              name={field.name}
              placeholder={`Enter ${field.label.toLowerCase()}`}
              value={form[field.name] ?? ""}
              onChange={handleChange}
              required
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        ))}

        <div className="flex gap-3">
          <button
            type="submit"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700"
          >
            {editingItem ? "Update Item" : "Add Item"}
          </button>

          {editingItem && (
            <button
              type="button"
              onClick={() => setEditingItem(null)}
              className="bg-gray-500 text-white px-5 py-2.5 rounded-lg"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

// 4. LIST COMPONENT
function ItemList({ setEditingItem }) {
  const { items, deleteItem, toggleItem } = useContext(ItemContext);
  const [search, setSearch] = useState("");

  const filteredItems = items.filter(item =>
    CONFIG.fields.some(field =>
      String(item[field.name] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  );

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mt-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5">
        <h2 className="text-xl font-bold text-gray-800">
          {CONFIG.itemName} List
          <span className="text-blue-600 ml-2">({items.length})</span>
        </h2>

        <input
          type="text"
          placeholder="Search records..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {filteredItems.length === 0 ? (
        <p className="text-center text-gray-500 py-8">
          No records found!
        </p>
      ) : (
        filteredItems.map(item => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 mb-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 hover:shadow-sm"
          >
            <div className="space-y-1">
              {CONFIG.fields.map(field => (
                <p key={field.name} className="text-gray-700 text-sm">
                  <strong>{field.label}:</strong> {item[field.name]}
                </p>
              ))}

              <span className={`inline-block text-xs px-3 py-1 rounded-full ${
                item.active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {item.active ? "Active" : "Inactive"}
              </span>

              <label className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={() => toggleItem(item.id)}
                />
                Change Status
              </label>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditingItem(item)}
                className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600"
              >
                Edit
              </button>

              <button
                onClick={() => deleteItem(item.id)}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// 5. DASHBOARD
function Dashboard() {
  const [editingItem, setEditingItem] = useState(null);
  const { items } = useContext(ItemContext);

  return (
    <div className="min-h-screen bg-slate-100 p-4 sm:p-8">
      <div className="max-w-5xl mx-auto">

        <div className="bg-blue-700 text-white p-6 rounded-xl mb-6 shadow-sm">
          <h1 className="text-3xl font-bold">
            {CONFIG.title}
          </h1>
          <p className="text-blue-100 mt-2">
            Manage and organize your records easily.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm">Total Records</p>
            <h2 className="text-3xl font-bold text-blue-700 mt-1">
              {items.length}
            </h2>
          </div>

          <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
            <p className="text-gray-500 text-sm">Active Records</p>
            <h2 className="text-3xl font-bold text-green-600 mt-1">
              {items.filter(item => item.active).length}
            </h2>
          </div>
        </div>

        <ItemForm
          editingItem={editingItem}
          setEditingItem={setEditingItem}
        />

        <ItemList setEditingItem={setEditingItem} />

        <p className="text-center text-gray-400 text-sm mt-6">
          {CONFIG.title} | React Application
        </p>

      </div>
    </div>
  );
}

// 6. MAIN APP
export default function App() {
  return (
    <ItemProvider>
      <Dashboard />
    </ItemProvider>
  );
}
