import { useState, useEffect } from "react";

// ============ CONFIG: change only this to adapt the app ============
const CONFIG = {
  title: "Task Manager",
  storageKey: "universal-todo-tasks",
  categories: ["Study", "Work", "Personal", "Health"], // rename for other use cases
  priorities: ["High", "Medium", "Low"],
};

const PRIORITY_COLORS = {
  High: "bg-red-100 text-red-700",
  Medium: "bg-amber-100 text-amber-700",
  Low: "bg-green-100 text-green-700",
};

const emptyForm = {
  title: "",
  priority: "Medium",
  category: CONFIG.categories[0],
  dueDate: "",
};

function loadTasks() {
  try {
    const saved = localStorage.getItem(CONFIG.storageKey);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

// Today's date as YYYY-MM-DD (local time), used to detect overdue tasks
function todayString() {
  return new Date().toLocaleDateString("en-CA");
}

export default function UniversalTodo() {
  const [tasks, setTasks] = useState(loadTasks);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // "all" | "pending" | "completed"

  // Save to localStorage whenever tasks change
  useEffect(() => {
    localStorage.setItem(CONFIG.storageKey, JSON.stringify(tasks));
  }, [tasks]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (error) setError("");
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const title = form.title.trim();

    if (title === "") {
      setError("Task title is required.");
      return;
    }
    if (title.length < 3) {
      setError("Task title must be at least 3 characters.");
      return;
    }

    if (editingId !== null) {
      // EDIT: update the matching task, keep its completed status
      setTasks(tasks.map((t) => (t.id === editingId ? { ...t, ...form, title } : t)));
    } else {
      // ADD
      setTasks([...tasks, { id: Date.now(), ...form, title, completed: false }]);
    }
    resetForm();
  };

  const handleEdit = (task) => {
    setForm({
      title: task.title,
      priority: task.priority,
      category: task.category,
      dueDate: task.dueDate,
    });
    setEditingId(task.id);
    setError("");
  };

  const handleDelete = (id) => {
    setTasks(tasks.filter((t) => t.id !== id));
    if (editingId === id) resetForm();
  };

  // COMPLETE: flip the completed flag of one task
  const toggleComplete = (id) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)));
  };

  const clearCompleted = () => {
    setTasks(tasks.filter((t) => !t.completed));
  };

  // Counts (derived from tasks, so there is no extra state to keep in sync)
  const totalCount = tasks.length;
  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = totalCount - completedCount;

  // SEARCH + FILTER together
  const query = search.trim().toLowerCase();
  const visibleTasks = tasks.filter((task) => {
    const matchesFilter =
      filter === "all" ||
      (filter === "pending" && !task.completed) ||
      (filter === "completed" && task.completed);
    const matchesSearch =
      task.title.toLowerCase().includes(query) || task.category.toLowerCase().includes(query);
    return matchesFilter && matchesSearch;
  });

  const filterButtons = [
    { key: "all", label: `All (${totalCount})` },
    { key: "pending", label: `Pending (${pendingCount})` },
    { key: "completed", label: `Completed (${completedCount})` },
  ];

  const inputClass =
    "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400";

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-6 text-2xl font-bold text-slate-800 sm:text-3xl">{CONFIG.title}</h1>

        {/* Task counts */}
        <div className="mb-6 grid grid-cols-3 gap-3 text-center">
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-2xl font-bold text-slate-800">{totalCount}</p>
            <p className="text-xs text-slate-500">Total</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-2xl font-bold text-amber-600">{pendingCount}</p>
            <p className="text-xs text-slate-500">Pending</p>
          </div>
          <div className="rounded-xl bg-white p-3 shadow">
            <p className="text-2xl font-bold text-green-600">{completedCount}</p>
            <p className="text-xs text-slate-500">Completed</p>
          </div>
        </div>

        {/* Add / Edit form */}
        <form onSubmit={handleSubmit} className="mb-6 rounded-xl bg-white p-5 shadow">
          <h2 className="mb-3 text-lg font-semibold text-slate-700">
            {editingId !== null ? "Edit Task" : "Add New Task"}
          </h2>

          <input
            type="text"
            name="title"
            placeholder="What needs to be done?"
            value={form.title}
            onChange={handleChange}
            className={`${inputClass} ${error ? "border-red-500" : ""}`}
          />
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Priority</label>
              <select name="priority" value={form.priority} onChange={handleChange} className={inputClass}>
                {CONFIG.priorities.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Category</label>
              <select name="category" value={form.category} onChange={handleChange} className={inputClass}>
                {CONFIG.categories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-slate-500">Due date (optional)</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="mt-4 flex gap-3">
            <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {editingId !== null ? "Update Task" : "Add Task"}
            </button>
            {editingId !== null && (
              <button type="button" onClick={resetForm} className="rounded-lg bg-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300">
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Search and filters */}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`rounded-full px-4 py-1 text-sm font-medium ${
                  filter === btn.key ? "bg-indigo-600 text-white" : "bg-white text-slate-600 shadow hover:bg-slate-100"
                }`}
              >
                {btn.label}
              </button>
            ))}
          </div>
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 sm:w-56"
          />
        </div>

        {/* Task list */}
        {tasks.length === 0 ? (
          <p className="rounded-xl bg-white py-10 text-center text-slate-500 shadow">
            No tasks yet. Add your first task above.
          </p>
        ) : visibleTasks.length === 0 ? (
          <p className="rounded-xl bg-white py-10 text-center text-slate-500 shadow">
            No tasks match your search or filter.
          </p>
        ) : (
          <ul className="space-y-3">
            {visibleTasks.map((task) => {
              const overdue = task.dueDate && !task.completed && task.dueDate < todayString();
              return (
                <li key={task.id} className="flex flex-col gap-3 rounded-xl bg-white p-4 shadow sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={task.completed}
                      onChange={() => toggleComplete(task.id)}
                      className="mt-1 h-4 w-4"
                    />
                    <div>
                      <p className={`font-medium ${task.completed ? "text-slate-400 line-through" : "text-slate-800"}`}>
                        {task.title}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className={`rounded-full px-2 py-0.5 font-medium ${PRIORITY_COLORS[task.priority]}`}>
                          {task.priority}
                        </span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-slate-600">{task.category}</span>
                        {task.dueDate && (
                          <span className={overdue ? "font-medium text-red-600" : "text-slate-500"}>
                            Due: {task.dueDate} {overdue && "(overdue)"}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleEdit(task)} className="rounded bg-amber-100 px-3 py-1 text-sm text-amber-800 hover:bg-amber-200">
                      Edit
                    </button>
                    <button onClick={() => handleDelete(task.id)} className="rounded bg-red-100 px-3 py-1 text-sm text-red-700 hover:bg-red-200">
                      Delete
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {completedCount > 0 && (
          <button onClick={clearCompleted} className="mt-4 text-sm text-red-600 hover:underline">
            Clear all completed tasks
          </button>
        )}
      </div>
    </div>
  );
}
