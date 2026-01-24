import { d as createComponent, e as createAstro, j as renderComponent, k as renderScript, r as renderTemplate, m as maybeRenderHead } from '../../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../../chunks/Layout_CtBMo58e.mjs';
export { renderers } from '../../renderers.mjs';

const $$Astro = createAstro();
const $$Debug = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Debug;
  const {
    data: { user },
    error
  } = await Astro2.locals.supabase.auth.getUser();
  if (error || !user) {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Debug Logs - Gutsy" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 py-8"> <div class="max-w-6xl mx-auto px-4"> <div class="mb-8"> <h1 class="text-3xl font-bold text-gray-900 mb-2">Debug Logs</h1> <p class="text-gray-600">Debug information for logs and database queries</p> </div> <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-6"> <div id="debug-info"> <p class="text-gray-500">Loading debug information...</p> </div> </div> </div> </main> ` })} ${renderScript($$result, "C:/Projekty/Gutsy/src/pages/logs/debug.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Projekty/Gutsy/src/pages/logs/debug.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/logs/debug.astro";
const $$url = "/logs/debug";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Debug,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
