import { createContext, useContext, useState } from "react";

// Text for each language (language preference demo)
const TRANSLATIONS = {
  en: { welcome: "Welcome", guest: "Guest", counter: "Shared Counter", login: "Login", logout: "Logout", namePlaceholder: "Enter your name", theme: "Theme", loggedAs: "Logged in as" },
  hi: { welcome: "स्वागत है", guest: "अतिथि", counter: "साझा काउंटर", login: "लॉगिन", logout: "लॉगआउट", namePlaceholder: "अपना नाम लिखें", theme: "थीम", loggedAs: "लॉग इन किया है:" },
  mr: { welcome: "स्वागत आहे", guest: "पाहुणा", counter: "सामायिक काउंटर", login: "लॉगिन", logout: "लॉगआउट", namePlaceholder: "तुमचे नाव लिहा", theme: "थीम", loggedAs: "लॉगिन केलेले:" },
};

// STEP 1: Create the context
const AppContext = createContext(null);

// STEP 2: Create the Provider. It owns the state and the functions that change it.
function AppProvider({ children }) {
  const [theme, setTheme] = useState("light");
  const [language, setLanguage] = useState("en");
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(null); // null = logged out

  // Functions that components can call to change the shared state
  const toggleTheme = () => setTheme(theme === "light" ? "dark" : "light");
  const increment = () => setCount(count + 1);
  const decrement = () => setCount(count - 1);
  const resetCount = () => setCount(0);
  const login = (name) => setUser({ name: name, role: "Student" });
  const logout = () => setUser(null);

  // Values calculated from state can be shared too
  const t = TRANSLATIONS[language]; // current language text
  const cardClass =
    theme === "dark"
      ? "bg-slate-800 text-white border border-slate-700"
      : "bg-white text-slate-800 border border-slate-200";

  // Everything the children can use
  const value = {
    theme, toggleTheme,
    language, setLanguage, t,
    count, increment, decrement, resetCount,
    user, login, logout,
    cardClass,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ---------- Consumer 1: Navbar (theme, language, counter badge) ----------
function Navbar() {
  const { theme, toggleTheme, language, setLanguage, t, count } = useContext(AppContext);
  return (
    <nav className="mb-6 flex flex-col gap-3 rounded-xl bg-indigo-600 px-5 py-4 text-white shadow sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-xl font-bold">Context API Demo</h1>
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-indigo-700">
          {t.counter}: {count}
        </span>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="rounded-lg bg-white px-2 py-1 text-sm text-slate-800"
        >
          <option value="en">English</option>
          <option value="hi">हिन्दी</option>
          <option value="mr">मराठी</option>
        </select>
        <button onClick={toggleTheme} className="rounded-lg bg-white px-3 py-1 text-sm font-medium text-indigo-700 hover:bg-indigo-100">
          {theme === "light" ? "Dark Mode" : "Light Mode"}
        </button>
      </div>
    </nav>
  );
}

// ---------- Consumer 2: Counter card (changes the shared count) ----------
function CounterCard() {
  const { count, increment, decrement, resetCount, t, cardClass } = useContext(AppContext);
  return (
    <section className={`rounded-xl p-5 shadow ${cardClass}`}>
      <h2 className="mb-3 text-lg font-semibold">{t.counter}</h2>
      <p className="mb-4 text-5xl font-bold">{count}</p>
      <div className="flex gap-2">
        <button onClick={decrement} className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600">-</button>
        <button onClick={increment} className="rounded-lg bg-green-500 px-4 py-2 text-white hover:bg-green-600">+</button>
        <button onClick={resetCount} className="rounded-lg bg-slate-500 px-4 py-2 text-white hover:bg-slate-600">Reset</button>
      </div>
    </section>
  );
}

// ---------- Consumer 3: Auth / profile card ----------
function AuthCard() {
  const { user, login, logout, t, cardClass } = useContext(AppContext);
  const [nameInput, setNameInput] = useState(""); // local state: only this component needs it

  const handleLogin = (e) => {
    e.preventDefault();
    if (nameInput.trim() === "") return;
    login(nameInput.trim());
    setNameInput("");
  };

  return (
    <section className={`rounded-xl p-5 shadow ${cardClass}`}>
      <h2 className="mb-3 text-lg font-semibold">
        {t.welcome}, {user ? user.name : t.guest}!
      </h2>

      {user ? (
        <div>
          <p className="mb-3 text-sm">
            {t.loggedAs} <strong>{user.name}</strong> ({user.role})
          </p>
          <button onClick={logout} className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">
            {t.logout}
          </button>
        </div>
      ) : (
        <form onSubmit={handleLogin} className="flex flex-col gap-2 sm:flex-row">
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder={t.namePlaceholder}
            className="flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
          <button type="submit" className="rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-700">
            {t.login}
          </button>
        </form>
      )}
    </section>
  );
}

// ---------- Consumer 4: read-only status card (shows all shared values) ----------
function StatusCard() {
  const { theme, language, count, user, cardClass, t } = useContext(AppContext);
  return (
    <section className={`rounded-xl p-5 shadow ${cardClass}`}>
      <h2 className="mb-3 text-lg font-semibold">Current Shared State</h2>
      <ul className="space-y-1 text-sm">
        <li>{t.theme}: <strong>{theme}</strong></li>
        <li>Language: <strong>{language}</strong></li>
        <li>Count: <strong>{count}</strong></li>
        <li>User: <strong>{user ? user.name : "Not logged in"}</strong></li>
      </ul>
    </section>
  );
}

// Page layout: reads the theme from context to colour the background
function Page() {
  const { theme } = useContext(AppContext);
  return (
    <div className={`min-h-screen p-4 sm:p-8 ${theme === "dark" ? "bg-slate-900" : "bg-slate-50"}`}>
      <div className="mx-auto max-w-4xl">
        <Navbar />
        <div className="grid gap-4 sm:grid-cols-2">
          <CounterCard />
          <AuthCard />
          <StatusCard />
        </div>
      </div>
    </div>
  );
}

// STEP 3: Wrap the components in the Provider
export default function UniversalContext() {
  return (
    <AppProvider>
      <Page />
    </AppProvider>
  );
}
