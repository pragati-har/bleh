
import React, { createContext, useContext, useState, useEffect } from "react";

// ==========================================
// 1. CONFIGURATION - CUSTOMISE THIS SECTION
// ==========================================

const CONFIG = {
  title: "Cafe Menu Management",
  itemName: "Cafe Item",
  storageKey: "cafeItems",

  fields: [
    { name: "name", label: "Item Name", type: "text" },
    { name: "category", label: "Category", type: "text" },
    { name: "price", label: "Price", type: "number" },
    { name: "description", label: "Description", type: "text" }
  ]
};

// ==========================================
// 2. CREATE CONTEXT
// ==========================================

const ItemContext = createContext();

// ==========================================
// 3. CONTEXT PROVIDER
// ==========================================

function ItemProvider({ children }) {

  const [items, setItems] = useState(() => {
    return JSON.parse(localStorage.getItem(CONFIG.storageKey)) || [];
  });

  // Save data whenever items change
  useEffect(() => {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(items));
  }, [items]);

  // ADD ITEM
  const addItem = (item) => {
    setItems(prev => [
      ...prev,
      { ...item, id: Date.now(), active: true }
    ]);
  };

  // DELETE ITEM
  const deleteItem = (id) => {
    setItems(prev => prev.filter(item => item.id !== id));
  };

  // UPDATE ITEM
  const updateItem = (id, updatedItem) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, ...updatedItem }
          : item
      )
    );
  };

  // TOGGLE CHECKBOX
  const toggleItem = (id) => {
    setItems(prev =>
      prev.map(item =>
        item.id === id
          ? { ...item, active: !item.active }
          : item
      )
    );
  };

  return (
    <ItemContext.Provider
      value={{ items, addItem, deleteItem, updateItem, toggleItem }}
    >
      {children}
    </ItemContext.Provider>
  );
}

// ==========================================
// 4. FORM COMPONENT
// ==========================================

function ItemForm({ editingItem, setEditingItem }) {

  const { addItem, updateItem } = useContext(ItemContext);

  const emptyForm = Object.fromEntries(
    CONFIG.fields.map(field => [field.name, ""])
  );

  const [form, setForm] = useState(emptyForm);

  // Load existing data when editing
  useEffect(() => {
    if (editingItem) {
      setForm({ ...editingItem });
    } else {
      setForm(emptyForm);
    }
  }, [editingItem]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Basic validation
    for (let field of CONFIG.fields) {
      if (!String(form[field.name] ?? "").trim()) {
        alert("Please fill all fields!");
        return;
      }
    }

    const finalData = { ...form };

    CONFIG.fields.forEach(field => {
      if (field.type === "number") {
        finalData[field.name] = Number(finalData[field.name]);
      }
    });

    if (editingItem) {
      updateItem(editingItem.id, finalData);
      setEditingItem(null);
    } else {
      addItem(finalData);
    }

    setForm(emptyForm);
  };

  return (
    <form onSubmit={handleSubmit} className="form">

      <h2>{editingItem ? "Edit" : "Add"} {CONFIG.itemName}</h2>

      {CONFIG.fields.map(field => (
        <input
          key={field.name}
          type={field.type}
          name={field.name}
          placeholder={field.label}
          value={form[field.name] ?? ""}
          onChange={handleChange}
          required
        />
      ))}

      <button type="submit">
        {editingItem ? "Update" : "Add"} Item
      </button>

      {editingItem && (
        <button
          type="button"
          onClick={() => setEditingItem(null)}
        >
          Cancel
        </button>
      )}

    </form>
  );
}

// ==========================================
// 5. LIST COMPONENT
// ==========================================

function ItemList({ setEditingItem }) {

  const { items, deleteItem, toggleItem } =
    useContext(ItemContext);

  const [search, setSearch] = useState("");

  // Search functionality
  const filteredItems = items.filter(item =>
    CONFIG.fields.some(field =>
      String(item[field.name] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase())
    )
  );

  return (
    <div className="list">

      <h2>{CONFIG.itemName} List ({items.length})</h2>

      <input
        type="text"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredItems.length === 0 ? (
        <p>No records found!</p>
      ) : (

        filteredItems.map(item => (

          <div className="card" key={item.id}>

            <div>
              {CONFIG.fields.map(field => (
                <p key={field.name}>
                  <strong>{field.label}:</strong>{" "}
                  {item[field.name]}
                </p>
              ))}

              <label>
                <input
                  type="checkbox"
                  checked={item.active}
                  onChange={() => toggleItem(item.id)}
                />
                Active
              </label>

            </div>

            <div className="actions">

              <button onClick={() => setEditingItem(item)}>
                Edit
              </button>

              <button onClick={() => deleteItem(item.id)}>
                Delete
              </button>

            </div>

          </div>

        ))

      )}

    </div>
  );
}

// ==========================================
// 6. MAIN DASHBOARD COMPONENT
// ==========================================

function Dashboard() {

  const [editingItem, setEditingItem] = useState(null);

  return (
    <div className="container">

      <h1>{CONFIG.title}</h1>

      <ItemForm
        editingItem={editingItem}
        setEditingItem={setEditingItem}
      />

      <ItemList setEditingItem={setEditingItem} />

    </div>
  );
}

// ==========================================
// 7. MAIN APP COMPONENT
// ==========================================

export default function App() {

  return (
    <ItemProvider>
      <Dashboard />
    </ItemProvider>
  );

}
