import { d as createComponent, e as createAstro, j as renderComponent, k as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CtBMo58e.mjs';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Index = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Index;
  const {
    data: { user },
    error
  } = await Astro2.locals.supabase.auth.getUser();
  if (error || !user) {
    return Astro2.redirect("/login");
  }
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "My Logs - Gutsy" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-gray-50 py-8"> <div class="max-w-6xl mx-auto px-4"> <div class="flex justify-between items-center mb-8"> <div> <h1 class="text-3xl font-bold text-gray-900 mb-2">My Meal Logs</h1> <p class="text-gray-600">Track and review your meal history and symptoms</p> </div> <a href="/logs/new" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"> + New Log </a> </div> <div class="bg-white rounded-lg shadow-sm border border-gray-200"> <div class="p-6"> <div id="loading" class="text-center py-8"> <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div> <p class="text-gray-500">Loading logs...</p> </div> <div id="logs-container" class="hidden"> <!-- Logs will be loaded here --> </div> <div id="error-container" class="hidden bg-red-50 border border-red-200 rounded-lg p-4"> <p class="text-red-600" id="error-message"></p> <button onclick="loadLogs()" class="mt-2 text-sm text-red-600 underline hover:text-red-800"> Try again </button> </div> </div> </div> </div> </main> ` })} ${renderScript($$result, "C:/Projekty/Gutsy/src/pages/logs/index.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Projekty/Gutsy/src/pages/logs/index.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/logs/index.astro";
const $$url = "/logs";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
