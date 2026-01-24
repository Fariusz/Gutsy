import { d as createComponent, j as renderComponent, k as renderScript, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CtBMo58e.mjs';
export { renderers } from '../renderers.mjs';

const $$Triggers = createComponent(async ($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Trigger Analysis" }, { "default": async ($$result2) => renderTemplate` ${maybeRenderHead()}<main> <div id="triggers-root"> <!-- Static content as fallback --> <div class="max-w-4xl mx-auto p-6"> <h1 class="text-3xl font-bold text-gray-900 mb-8">Ingredient Trigger Analysis</h1> <!-- Date Range Selection --> <div class="bg-white rounded-lg shadow-md p-6 mb-8"> <h2 class="text-xl font-semibold mb-4">Analysis Period</h2> <div class="flex flex-col md:flex-row gap-4 items-end"> <div class="flex-1"> <label for="start-date" class="block text-sm font-medium text-gray-700 mb-2">Start Date</label> <input id="start-date" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> </div> <div class="flex-1"> <label for="end-date" class="block text-sm font-medium text-gray-700 mb-2">End Date</label> <input id="end-date" type="date" class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"> </div> <div class="flex flex-col justify-end"> <label class="flex items-center mb-2"> <input type="checkbox" id="detailed" class="mr-2"> <span class="text-sm text-gray-700">Detailed Analysis</span> </label> </div> <button id="analyze-btn" class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors duration-200">
Analyze Triggers
</button> <button id="create-test-data-btn" class="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm">
Create Test Data
</button> </div> </div> <!-- Results Area --> <div id="results-area" class="bg-white rounded-lg shadow-md p-6"> <div class="text-center py-8"> <p class="text-gray-500">Select a date range and click "Analyze Triggers" to see your ingredient trigger analysis.</p> </div> </div> </div> </div> </main> ` })} ${renderScript($$result, "C:/Projekty/Gutsy/src/pages/triggers.astro?astro&type=script&index=0&lang.ts")}`;
}, "C:/Projekty/Gutsy/src/pages/triggers.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/triggers.astro";
const $$url = "/triggers";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Triggers,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
