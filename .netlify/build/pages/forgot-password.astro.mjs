import { d as createComponent, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CtBMo58e.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
import { B as Button, I as Input } from '../chunks/input_BsqBHpNT.mjs';
export { renderers } from '../renderers.mjs';

function ForgotPasswordForm({ onSuccess }) {
  const [formData, setFormData] = useState({
    email: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
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
    setIsLoading(true);
    setError(null);
    setValidationErrors({});
    try {
      const response = await fetch("/api/auth/request-password-reset", {
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
          setError(data.error?.message || "Password reset request failed");
        }
        return;
      }
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };
  if (success) {
    return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md mx-auto space-y-6", children: [
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("div", { className: "w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center", children: /* @__PURE__ */ jsx("svg", { className: "w-8 h-8 text-green-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: "2", d: "M5 13l4 4L19 7" }) }) }),
        /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Check Your Email" }),
        /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-2", children: "If an account with this email exists, you will receive a password reset link." })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
        /* @__PURE__ */ jsx("p", { className: "text-sm text-gray-500 mb-4", children: "Didn't receive an email? Check your spam folder or try again." }),
        /* @__PURE__ */ jsx(
          Button,
          {
            variant: "outline",
            onClick: () => {
              setSuccess(false);
              setFormData({ email: "" });
            },
            children: "Send Another Email"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-gray-600", children: [
        "Remember your password?",
        " ",
        /* @__PURE__ */ jsx("a", { href: "/login", className: "font-medium text-blue-600 hover:text-blue-500", children: "Sign in here" })
      ] })
    ] });
  }
  return /* @__PURE__ */ jsxs("div", { className: "w-full max-w-md mx-auto space-y-6", children: [
    /* @__PURE__ */ jsxs("div", { className: "text-center", children: [
      /* @__PURE__ */ jsx("h1", { className: "text-2xl font-bold text-gray-900", children: "Forgot Password?" }),
      /* @__PURE__ */ jsx("p", { className: "text-gray-600 mt-2", children: "Enter your email address and we'll send you a link to reset your password." })
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
            disabled: isLoading,
            className: validationErrors.email ? "border-red-300 focus:border-red-500" : "",
            placeholder: "Enter your email address"
          }
        ),
        validationErrors.email && /* @__PURE__ */ jsx("p", { className: "text-red-600 text-sm mt-1", children: validationErrors.email })
      ] }),
      /* @__PURE__ */ jsx(Button, { type: "submit", className: "w-full", disabled: isLoading, children: isLoading ? "Sending Reset Link..." : "Send Reset Link" })
    ] }),
    /* @__PURE__ */ jsxs("p", { className: "text-center text-sm text-gray-600", children: [
      "Remember your password?",
      " ",
      /* @__PURE__ */ jsx("a", { href: "/login", className: "font-medium text-blue-600 hover:text-blue-500", children: "Sign in here" })
    ] })
  ] });
}

const $$ForgotPassword = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Forgot Password - Gutsy", "hideFloatingButton": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"> <div class="w-full max-w-md"> ${renderComponent($$result2, "ForgotPasswordForm", ForgotPasswordForm, { "client:idle": true, "client:component-hydration": "idle", "client:component-path": "C:/Projekty/Gutsy/src/components/ForgotPasswordForm.tsx", "client:component-export": "default" })} </div> </main> ` })}`;
}, "C:/Projekty/Gutsy/src/pages/forgot-password.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/forgot-password.astro";
const $$url = "/forgot-password";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$ForgotPassword,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
