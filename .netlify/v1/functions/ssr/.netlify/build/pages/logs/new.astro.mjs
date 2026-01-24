import { d as createComponent, e as createAstro, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CtBMo58e.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$New = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$New;
  const {
    data: { user },
    error
  } = await Astro2.locals.supabase.auth.getUser();
  if (error || !user) {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Create New Log - Gutsy", "hideFloatingButton": true }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 py-8"> <div class="max-w-4xl mx-auto px-4"> <div class="mb-8"> <h1 class="text-3xl font-bold text-gray-900 mb-2">Create New Meal Log</h1> <p class="text-gray-600">Record what you ate and any symptoms you experienced to help identify potential food triggers.</p> </div> <div class="bg-white rounded-lg shadow-sm border border-gray-200"> <div class="p-6"> ${renderComponent($$result2, "CreateLogForm", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "C:/Projekty/Gutsy/src/components/CreateLogForm.tsx", "client:component-export": "default" })} </div> </div> </div> </main> ` })}`;
}, "C:/Projekty/Gutsy/src/pages/logs/new.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/logs/new.astro";
const $$url = "/logs/new";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$New,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
