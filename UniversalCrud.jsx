import { useState, useEffect } from "react";

// ============ CONFIG: change only this to adapt the app ============
const CONFIG = {
  title: "Student Management",
  itemName: "Student",
  storageKey: "universal-crud-students", // use a different key for each practice topic
  fields: [
    { name: "name", label: "Full Name", type: "text", required: true, minLength: 3 },
    { name: "email", label: "Email", type: "email", required: true },
    { name: "age", label: "Age", type: "number", required: true, min: 1, max: 100 },
    {
      name: "course",
      label: "Course",
      type: "select",
      required: true,
      options: ["IT", "Computer", "Mechanical", "Civil"],
    },
    { name: "address", label: "Address", type: "textarea", required: false },
  ],
};

// Creates { name: "", email: "", ... } from CONFIG
function buildEmptyForm() {
  const empty = {};
  CONFIG.fields.forEach((field) => {
    empty[field.name] = "";
  });
  return empty;
}

// Reads saved records from localStorage (used as the initial state)
function loadRecords() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Returns an object like { email: "Email is invalid" }. Empty object = no errors.
function validate(values) {
  const newErrors = {};
  CONFIG.fields.forEach((field) => {
    const value = String(values[field.name]).trim();

    if (field.required && value === "") {
      newErrors[field.name] = `${field.label} is required`;
      return;
    }
    if (value === "") return; // optional and empty: nothing more to check

    if (field.type === "email" && !/^\S+@\S+\.\S+$/.test(value)) {
      newErrors[field.name] = "Enter a valid email address";
    }
    if (field.minLength && value.length < field.minLength) {
      newErrors[field.name] = `${field.label} must be at least ${field.minLength} characters`;
    }
    if (field.type === "number") {
      const num = Number(value);
      if (Number.isNaN(num)) {
        newErrors[field.name] = `${field.label} must be a number`;
      } else if (field.min !== undefined && num < field.min) {
        newErrors[field.name] = `${field.label} must be at least ${field.min}`;
      } else if (field.max !== undefined && num > field.max) {
        newErrors[field.name] = `${field.label} must be at most ${field.max}`;
      }
    }
  });
  return newErrors;
}

export default function UniversalCRUD() {
  // useState: values that change and re-render the screen
  const [records, setRecords] = useState(loadRecords); // lazy initial state from localStorage
  const [form, setForm] = useState(buildEmptyForm());
  const [errors, setErrors] = useState({});
  const [editingId, setEditingId] = useState(null); // null = add mode, id = edit mode
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState(null); // { type: "success" | "error", text }

  // useEffect: runs after render. Saves records whenever they change.
  useEffect(() => {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(records));
  }, [records]);

  // Hides the feedback message after 3 seconds
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => setMessage(null), 3000);
    return () => clearTimeout(timer); // cleanup
  }, [message]);

  // Controlled inputs: the input's value always comes from state
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  const resetForm = () => {
    setForm(buildEmptyForm());
    setErrors({});
    setEditingId(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault(); // stop the page from reloading
    const newErrors = validate(form);
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      setMessage({ type: "error", text: "Please fix the errors in the form." });
      return;
    }

    // Trim every value before saving
    const cleaned = {};
    CONFIG.fields.forEach((field) => {
      cleaned[field.name] = String(form[field.name]).trim();
    });

    if (editingId !== null) {
      // UPDATE: replace only the matching record
      setRecords(records.map((r) => (r.id === editingId ? { ...r, ...cleaned } : r)));
      setMessage({ type: "success", text: `${CONFIG.itemName} updated successfully.` });
    } else {
      // CREATE: add a new record with a unique id
      setRecords([...records, { id: Date.now(), ...cleaned }]);
      setMessage({ type: "success", text: `${CONFIG.itemName} added successfully.` });
    }
    resetForm();
  };

  const handleEdit = (record) => {
    const values = {};
    CONFIG.fields.forEach((field) => {
      values[field.name] = record[field.name] ?? "";
    });
    setForm(values);
    setErrors({});
    setEditingId(record.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = (id) => {
    if (!window.confirm(`Delete this ${CONFIG.itemName.toLowerCase()}?`)) return;
    setRecords(records.filter((r) => r.id !== id));
    if (editingId === id) resetForm();
    setMessage({ type: "success", text: `${CONFIG.itemName} deleted.` });
  };

  // SEARCH: keep records where any field contains the search text
  const query = search.trim().toLowerCase();
  const filteredRecords = records.filter((record) =>
    CONFIG.fields.some((field) =>
      String(record[field.name] ?? "").toLowerCase().includes(query)
    )
  );

  // Picks the right input element for each field type
  const renderInput = (field) => {
    const inputClass = `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
      errors[field.name] ? "border-red-500" : "border-slate-300"
    }`;

    if (field.type === "select") {
      return (
        <select id={field.name} name={field.name} value={form[field.name]} onChange={handleChange} className={inputClass}>
          <option value="">-- Select --</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }
    if (field.type === "textarea") {
      return (
        <textarea id={field.name} name={field.name} rows="3" value={form[field.name]} onChange={handleChange} className={inputClass} />
      );
    }
    return (
      <input
        id={field.name}
        name={field.name}
        type={field.type}
        min={field.min}
        max={field.max}
        value={form[field.name]}
        onChange={handleChange}
        className={inputClass}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800 sm:text-3xl">{CONFIG.title}</h1>

        {/* Success / error feedback */}
        {message && (
          <div
            className={`mb-4 rounded-lg px-4 py-3 text-sm font-medium ${
              message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* FORM (Create + Update) */}
        <form onSubmit={handleSubmit} noValidate className="mb-8 rounded-xl bg-white p-5 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">
            {editingId !== null ? `Edit ${CONFIG.itemName}` : `Add ${CONFIG.itemName}`}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {CONFIG.fields.map((field) => (
              <div key={field.name} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
                <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-slate-600">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </label>
                {renderInput(field)}
                {errors[field.name] && <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>}
              </div>
            ))}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {editingId !== null ? "Update" : "Add"}
            </button>
            <button type="button" onClick={resetForm} className="rounded-lg bg-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300">
              {editingId !== null ? "Cancel Edit" : "Clear Form"}
            </button>
          </div>
        </form>

        {/* LIST (Read + Search) */}
        <div className="rounded-xl bg-white p-5 shadow">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-lg font-semibold text-slate-700">
              All Records ({filteredRecords.length})
            </h2>
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:w-64"
            />
          </div>

          {/* Empty states */}
          {records.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              No records yet. Add your first {CONFIG.itemName.toLowerCase()} using the form above.
            </p>
          ) : filteredRecords.length === 0 ? (
            <p className="py-10 text-center text-slate-500">No records match "{search}".</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-left text-sm">
                <thead>
                  <tr className="border-b bg-slate-100 text-slate-600">
                    {CONFIG.fields.map((field) => (
                      <th key={field.name} className="px-3 py-2">{field.label}</th>
                    ))}
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="border-b hover:bg-slate-50">
                      {CONFIG.fields.map((field) => (
                        <td key={field.name} className="px-3 py-2">{record[field.name] || "-"}</td>
                      ))}
                      <td className="px-3 py-2">
                        <button onClick={() => handleEdit(record)} className="mr-2 rounded bg-amber-100 px-3 py-1 text-amber-800 hover:bg-amber-200">
                          Edit
                        </button>
                        <button onClick={() => handleDelete(record.id)} className="rounded bg-red-100 px-3 py-1 text-red-700 hover:bg-red-200">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
