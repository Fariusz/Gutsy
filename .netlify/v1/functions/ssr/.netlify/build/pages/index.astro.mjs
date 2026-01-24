import { d as createComponent, m as maybeRenderHead, r as renderTemplate, j as renderComponent } from '../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import 'clsx';
import { $ as $$Layout } from '../chunks/Layout_CtBMo58e.mjs';
export { renderers } from '../renderers.mjs';

const $$Welcome = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${maybeRenderHead()}<div class="relative w-full mx-auto min-h-screen bg-background p-4 sm:p-8"> <div class="relative max-w-4xl mx-auto bg-card rounded-2xl shadow-lg p-8 text-card-foreground border border-border"> <div class="space-y-8"> <div class="text-center"> <h1 class="text-6xl font-bold mb-4 text-primary drop-shadow-lg">Welcome to Gutsy!</h1> <p class="text-xl text-muted-foreground drop-shadow-md mb-8">Your privacy-first food intolerance tracking companion</p> <div class="flex flex-col sm:flex-row gap-4 justify-center items-center"> <a href="/logs/new" class="bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-4 px-12 text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto text-center">
🍽️ Create New Meal Log
</a> <div class="text-sm text-muted-foreground sm:ml-4">Track your meals and symptoms</div> </div> <div class="flex flex-col sm:flex-row gap-4 justify-center items-center mt-6"> <a href="/triggers" class="bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold py-3 px-8 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 w-full sm:w-auto text-center">
📊 Analyze Triggers
</a> <div class="text-sm text-muted-foreground sm:ml-4">Discover your food triggers</div> </div> </div> <div class="flex flex-col gap-6 max-w-2xl mx-auto"> <div class="bg-card-foreground/5 backdrop-blur-lg rounded-xl p-6 border border-border"> <h2 class="text-2xl font-semibold mb-4 text-primary">Features</h2> <ul class="space-y-3"> <li class="flex items-center space-x-3"> <span class="font-mono bg-primary/10 px-3 py-1.5 rounded-lg text-primary shadow-sm">Meal Tracking</span> <span class="text-muted-foreground">- Log your meals and ingredients</span> </li> <li class="flex items-center space-x-3"> <span class="font-mono bg-primary/10 px-3 py-1.5 rounded-lg text-primary shadow-sm">Symptoms</span> <span class="text-muted-foreground">- Track symptoms with severity levels</span> </li> <li class="flex items-center space-x-3"> <span class="font-mono bg-secondary/20 px-3 py-1.5 rounded-lg text-secondary-foreground shadow-sm">Trigger Analysis</span> <span class="text-muted-foreground">- Discover which foods cause symptoms</span> </li> <li class="flex items-center space-x-3"> <span class="font-mono bg-primary/10 px-3 py-1.5 rounded-lg text-primary shadow-sm">Privacy First</span> <span class="text-muted-foreground">- Your data stays secure and private</span> </li> </ul> </div> <div class="bg-card-foreground/5 backdrop-blur-lg rounded-xl p-6 border border-border"> <h2 class="text-2xl font-semibold mb-4 text-primary">How It Works</h2> <ul class="space-y-3"> <li class="flex items-center space-x-3"> <span class="font-mono bg-primary/10 px-3 py-1.5 rounded-lg text-primary shadow-sm">1.</span> <span class="text-muted-foreground">Log your meals and any ingredients you consumed</span> </li> <li class="flex items-center space-x-3"> <span class="font-mono bg-primary/10 px-3 py-1.5 rounded-lg text-primary shadow-sm">2.</span> <span class="text-muted-foreground">Record any symptoms with their severity levels</span> </li> <li class="flex items-center space-x-3"> <span class="font-mono bg-secondary/20 px-3 py-1.5 rounded-lg text-secondary-foreground shadow-sm">3.</span> <span class="text-muted-foreground">Use our statistical analysis to identify which ingredients trigger symptoms</span> </li> </ul> </div> </div> <p class="text-lg text-center text-muted-foreground mt-8 leading-relaxed">
Start your food intolerance tracking journey today! <br class="hidden sm:block"> <span class="font-semibold text-primary">Take control of your dietary health!</span> </p> </div> </div> </div>`;
}, "C:/Projekty/Gutsy/src/components/Welcome.astro", void 0);

const $$Index = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, {}, { "default": ($$result2) => renderTemplate` ${renderComponent($$result2, "Welcome", $$Welcome, {})} ` })}`;
}, "C:/Projekty/Gutsy/src/pages/index.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/index.astro";
const $$url = "";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Index,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
