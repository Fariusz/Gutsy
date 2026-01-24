import { d as createComponent, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CtBMo58e.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { I as Input, B as Button } from '../chunks/input_BsqBHpNT.mjs';
export { renderers } from '../renderers.mjs';

function RegisterForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState({});
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setValidationErrors({});
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (!response.ok) {
        if (data.error?.details && Array.isArray(data.error.details)) {
          const errors = {};
          data.error.details.forEach((detail) => {
            errors[detail.field] = detail.message;
          });
          setValidationErrors(errors);
        } else {
          setError(data.error?.message || "Registration failed");
        }
        return;
      }
      globalThis.location.href = "/logs";
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Create Account" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-2", children: "Join Gutsy to track your food triggers" })
    ] }),
    error && /* @__PURE__ */ jsx("div", { className: "bg-red-50 border border-red-200 rounded-md p-3", children: /* @__PURE__ */ jsx("p", { className: "text-red-800 text-sm", children: error }) }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "email", className: "block text-sm font-medium text-gray-700 mb-1", children: "Email Address" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "email",
            name: "email",
            type: "email",
            value: formData.email,
            onChange: handleChange,
            required: true,
            disabled: isSubmitting,
            className: validationErrors.email ? "border-red-300 focus:border-red-500" : ""
          }
        ),
        validationErrors.email && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: validationErrors.email })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "password",
            name: "password",
            type: "password",
            value: formData.password,
            onChange: handleChange,
            required: true,
            disabled: isSubmitting,
            className: validationErrors.password ? "border-red-300 focus:border-red-500" : ""
          }
        ),
        validationErrors.password && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: validationErrors.password }),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Must be 8+ characters with uppercase, lowercase, number, and special character" })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "confirmPassword", className: "block text-sm font-medium text-gray-700 mb-1", children: "Confirm Password" }),
        /* @__PURE__ */ jsx(
          Input,
          {
            id: "confirmPassword",
            name: "confirmPassword",
            type: "password",
            value: formData.confirmPassword,
            onChange: handleChange,
            required: true,
            disabled: isSubmitting,
            className: validationErrors.confirmPassword ? "border-red-300 focus:border-red-500" : ""
          }
        ),
        validationErrors.confirmPassword && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: validationErrors.confirmPassword })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: isSubmitting, children: isSubmitting ? "Creating account..." : "Create account" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-gray-600", children: [
      "Already have an account?",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/login", className: "font-medium text-blue-600 hover:text-blue-500", children: "Sign in here" })
    ] })
  ] });
}

const $$Register = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Register - Gutsy", "hideFloatingButton": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"> <div class="w-full max-w-md"> ${renderComponent($$result2, "RegisterForm", RegisterForm, { "client:idle": true, "client:component-hydration": "idle", "client:component-path": "C:/Projekty/Gutsy/src/components/RegisterForm.tsx", "client:component-export": "default" })} </div> </main> ` })}`;
}, "C:/Projekty/Gutsy/src/pages/register.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/register.astro";
const $$url = "/register";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Register,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
