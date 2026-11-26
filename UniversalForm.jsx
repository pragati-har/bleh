import { useState } from "react";

// ============ CONFIG: change only this to adapt the form ============
// Supported types: text, email, number, date, select, radio, checkbox, textarea
// checkbox WITH options = group of checkboxes (value is an array)
// checkbox WITHOUT options = single tick box (value is true/false)
const CONFIG = {
  title: "Student Registration",
  submitLabel: "Register",
  fields: [
    { name: "fullName", label: "Full Name", type: "text", required: true, placeholder: "Enter your name" },
    { name: "email", label: "Email", type: "email", required: true, placeholder: "you@example.com" },
    { name: "age", label: "Age", type: "number", required: true, min: 16, max: 60 },
    { name: "dob", label: "Date of Birth", type: "date", required: true },
    { name: "gender", label: "Gender", type: "radio", required: true, options: ["Male", "Female", "Other"] },
    {
      name: "branch",
      label: "Branch",
      type: "select",
      required: true,
      options: ["IT", "Computer", "Mechanical", "Civil"],
    },
    { name: "skills", label: "Skills", type: "checkbox", required: true, options: ["React", "Node.js", "MongoDB", "Python"] },
    { name: "about", label: "About Yourself", type: "textarea", required: false, placeholder: "Write a few lines..." },
    { name: "agree", label: "I agree to the terms and conditions", type: "checkbox", required: true },
  ],
};

// Creates the starting values: "" for most fields, [] for checkbox groups, false for single checkbox
function buildInitialValues() {
  const initial = {};
  CONFIG.fields.forEach((field) => {
    if (field.type === "checkbox") {
      initial[field.name] = field.options ? [] : false;
    } else {
      initial[field.name] = "";
    }
  });
  return initial;
}

// Returns an errors object. Empty object means the form is valid.
function validate(values) {
  const errors = {};
  CONFIG.fields.forEach((field) => {
    const value = values[field.name];

    // Required check (depends on the field type)
    if (field.required) {
      if (field.type === "checkbox" && field.options && value.length === 0) {
        errors[field.name] = `Select at least one option for ${field.label}`;
        return;
      }
      if (field.type === "checkbox" && !field.options && value === false) {
        errors[field.name] = "You must accept this to continue";
        return;
      }
      if (field.type !== "checkbox" && String(value).trim() === "") {
        errors[field.name] = `${field.label} is required`;
        return;
      }
    }

    // Format checks (only when something was typed)
    if (field.type === "email" && value !== "" && !/^\S+@\S+\.\S+$/.test(value.trim())) {
      errors[field.name] = "Enter a valid email address";
    }
    if (field.type === "number" && value !== "") {
      const num = Number(value);
      if (field.min !== undefined && num < field.min) {
        errors[field.name] = `${field.label} must be at least ${field.min}`;
      } else if (field.max !== undefined && num > field.max) {
        errors[field.name] = `${field.label} must be at most ${field.max}`;
      }
    }
  });
  return errors;
}

// Formats a value for the "submitted data" table
function formatValue(value) {
  if (Array.isArray(value)) return value.length > 0 ? value.join(", ") : "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value).trim() === "" ? "-" : value;
}

export default function UniversalForm() {
  const [values, setValues] = useState(buildInitialValues);
  const [errors, setErrors] = useState({});
  const [submittedData, setSubmittedData] = useState(null); // null = nothing submitted yet

  // Update one field's value and clear its error
  const setValue = (name, newValue) => {
    setValues({ ...values, [name]: newValue });
    if (errors[name]) setErrors({ ...errors, [name]: "" });
  };

  // For checkbox groups: add the option if missing, remove it if present
  const toggleOption = (name, option) => {
    const current = values[name];
    const updated = current.includes(option)
      ? current.filter((o) => o !== option)
      : [...current, option];
    setValue(name, updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate(values);
    setErrors(newErrors);
    if (Object.keys(newErrors).length === 0) {
      setSubmittedData(values); // show the data
    } else {
      setSubmittedData(null);
    }
  };

  const handleReset = () => {
    setValues(buildInitialValues());
    setErrors({});
    setSubmittedData(null);
  };

  // Decides which HTML element to draw for each field type
  const renderField = (field) => {
    const value = values[field.name];
    const inputClass = `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
      errors[field.name] ? "border-red-500" : "border-slate-300"
    }`;

    if (field.type === "select") {
      return (
        <select id={field.name} value={value} onChange={(e) => setValue(field.name, e.target.value)} className={inputClass}>
          <option value="">-- Select --</option>
          {field.options.map((opt) => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          id={field.name}
          rows="3"
          placeholder={field.placeholder}
          value={value}
          onChange={(e) => setValue(field.name, e.target.value)}
          className={inputClass}
        />
      );
    }

    if (field.type === "radio") {
      return (
        <div className="flex flex-wrap gap-4">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="radio"
                name={field.name}
                value={opt}
                checked={value === opt}
                onChange={(e) => setValue(field.name, e.target.value)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    if (field.type === "checkbox" && field.options) {
      return (
        <div className="flex flex-wrap gap-4">
          {field.options.map((opt) => (
            <label key={opt} className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => toggleOption(field.name, opt)}
              />
              {opt}
            </label>
          ))}
        </div>
      );
    }

    if (field.type === "checkbox") {
      // single checkbox (true/false)
      return (
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={value}
            onChange={(e) => setValue(field.name, e.target.checked)}
          />
          {field.label}
        </label>
      );
    }

    // text, email, number, date
    return (
      <input
        id={field.name}
        type={field.type}
        min={field.min}
        max={field.max}
        placeholder={field.placeholder}
        value={value}
        onChange={(e) => setValue(field.name, e.target.value)}
        className={inputClass}
      />
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
        {/* FORM */}
        <form onSubmit={handleSubmit} noValidate className="rounded-xl bg-white p-5 shadow">
          <h1 className="mb-5 text-2xl font-bold text-slate-800">{CONFIG.title}</h1>

          <div className="space-y-4">
            {CONFIG.fields.map((field) => {
              const isSingleCheckbox = field.type === "checkbox" && !field.options;
              return (
                <div key={field.name}>
                  {/* single checkbox draws its own label next to the box */}
                  {!isSingleCheckbox && (
                    <label htmlFor={field.name} className="mb-1 block text-sm font-medium text-slate-600">
                      {field.label}
                      {field.required && <span className="text-red-500"> *</span>}
                    </label>
                  )}
                  {renderField(field)}
                  {errors[field.name] && <p className="mt-1 text-xs text-red-600">{errors[field.name]}</p>}
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <button type="submit" className="rounded-lg bg-indigo-600 px-5 py-2 text-sm font-medium text-white hover:bg-indigo-700">
              {CONFIG.submitLabel}
            </button>
            <button type="button" onClick={handleReset} className="rounded-lg bg-slate-200 px-5 py-2 text-sm font-medium text-slate-700 hover:bg-slate-300">
              Reset
            </button>
          </div>
        </form>

        {/* SUBMITTED DATA */}
        <div className="h-fit rounded-xl bg-white p-5 shadow">
          <h2 className="mb-4 text-lg font-semibold text-slate-700">Submitted Data</h2>
          {submittedData === null ? (
            <p className="py-8 text-center text-slate-500">Nothing submitted yet. Fill the form and submit.</p>
          ) : (
            <>
              <p className="mb-3 rounded bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
                Form submitted successfully!
              </p>
              <dl className="divide-y text-sm">
                {CONFIG.fields.map((field) => (
                  <div key={field.name} className="flex flex-col gap-1 py-2 sm:flex-row sm:justify-between">
                    <dt className="font-medium text-slate-600">{field.label}</dt>
                    <dd className="text-slate-800 sm:text-right">{formatValue(submittedData[field.name])}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
