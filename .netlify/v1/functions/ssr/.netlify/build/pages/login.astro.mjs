import { d as createComponent, j as renderComponent, r as renderTemplate, m as maybeRenderHead } from '../chunks/astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
import { $ as $$Layout } from '../chunks/Layout_CtBMo58e.mjs';
export { renderers } from '../renderers.mjs';

const $$Login = createComponent(($$result, $$props, $$slots) => {
  return renderTemplate`${renderComponent($$result, "Layout", $$Layout, { "title": "Sign In - Gutsy", "hideFloatingButton": true }, { "default": ($$result2) => renderTemplate` ${maybeRenderHead()}<main class="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8"> <div class="w-full max-w-md"> ${renderComponent($$result2, "LoginForm", null, { "client:only": "react", "client:component-hydration": "only", "client:component-path": "C:/Projekty/Gutsy/src/components/LoginForm.tsx", "client:component-export": "default" })} </div> </main> ` })}`;
}, "C:/Projekty/Gutsy/src/pages/login.astro", void 0);

const $$file = "C:/Projekty/Gutsy/src/pages/login.astro";
const $$url = "/login";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  default: $$Login,
  file: $$file,
  url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
