import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CtBMo58e.mjs';
import { jsxs, jsx } from 'react/jsx-runtime';
import { useState } from 'react';
export { renderers } from '../../renderers.mjs';

function SimpleLogForm() {
  const [ingredients, setIngredients] = useState("");
  const [notes, setNotes] = useState("");
  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Form submitted! Ingredients: ${ingredients}`);
  };
  return /* @__PURE__ */ jsxs("div", { className: "space-y-4", children: [
    /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold", children: "Simple Log Form (Test)" }),
    /* @__PURE__ */ jsxs("form", { onSubmit: handleSubmit, className: "space-y-4", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "ingredients-input", className: "block text-sm font-medium text-gray-700 mb-1", children: "Ingredients" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "ingredients-input",
            type: "text",
            value: ingredients,
            onChange: (e) => setIngredients(e.target.value),
            className: "w-full border border-gray-300 rounded-md px-3 py-2",
            placeholder: "Enter ingredients...",
            required: true
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "notes-textarea", className: "block text-sm font-medium text-gray-700 mb-1", children: "Notes" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            id: "notes-textarea",
            value: notes,
            onChange: (e) => setNotes(e.target.value),
            className: "w-full border border-gray-300 rounded-md px-3 py-2",
            rows: 3,
            placeholder: "Add notes..."
          }
        )
      ] }),
      /* @__PURE__ */ jsx("button", { type: "submit", className: "bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700", children: "Submit Test Form" })
    ] })
  ] });
}

const $$Astro = createAstro();
const $$Simple = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Simple;
  const {
    data: { user },
    error
  } = await Astro2.locals.supabase.auth.getUser();
  if (error || !user) {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Simple Log - Gutsy", "hideFloatingButton": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 py-8"> <div class="max-w-4xl mx-auto px-4"> <div class="mb-8"> <h1 class="text-3xl font-bold text-gray-900 mb-2">Simple Meal Log</h1> <p class="text-gray-600">Quick and easy way to log your meals and symptoms.</p> </div> <div class="bg-white rounded-lg shadow-sm border border-gray-200"> <div class="p-6"> ${renderComponent($$result2, "SimpleLogForm", SimpleLogForm, { "client:idle": true, "client:component-hydration": "idle", "client:component-path": "C:/Projekty/Gutsy/src/components/SimpleLogForm.tsx", "client:component-export": "default" })} </div> </div> </div> </main> ` })}`;
}, "C:/Projekty/Gutsy/src/pages/logs/simple.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/logs/simple.astro";
const $$url = "/logs/simple";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Simple,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
