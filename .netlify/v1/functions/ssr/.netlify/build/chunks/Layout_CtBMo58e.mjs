import { d as createComponent, e as createAstro, m as maybeRenderHead, g as addAttribute, r as renderTemplate, l as renderHead, n as renderSlot, k as renderScript, j as renderComponent } from './astro/server_CYzSJK5e.mjs';
import 'kleur/colors';
/* empty css                                   */
import 'clsx';

const $$Astro$1 = createAstro();
const $$FloatingActionButton = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro$1, $$props, $$slots);
  Astro2.self = $$FloatingActionButton;
  const { href, text, icon = "+" } = Astro2.props;
  return renderTemplate`${maybeRenderHead()}<div class="fixed bottom-6 right-6 z-50" data-astro-cid-3onmjj5j> <a${addAttribute(href, "href")} class="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 rounded-full shadow-xl hover:shadow-2xl transform hover:scale-110 transition-all duration-200 flex items-center space-x-2 group" data-test-id="fab-new-log" data-astro-cid-3onmjj5j> <span class="text-xl" data-astro-cid-3onmjj5j>${icon}</span> <span class="hidden group-hover:block text-sm whitespace-nowrap" data-astro-cid-3onmjj5j>${text}</span> </a> </div> `;
}, "C:/Projekty/Gutsy/src/components/FloatingActionButton.astro", void 0);

const $$Astro = createAstro();
const $$Layout = createComponent(async ($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Layout;
  const { title = "10x Astro Starter", hideFloatingButton = false } = Astro2.props;
  let user = null;
  try {
    const {
      data: { user: authUser },
      error
    } = await Astro2.locals.supabase.auth.getUser();
    if (!error && authUser) {
      user = authUser;
    }
  } catch (error) {
    console.error("Error checking user authentication", { error });
  }
  return renderTemplate`<html lang="en" data-astro-cid-sckkx6r4> <head><meta charset="UTF-8"><meta name="viewport" content="width=device-width"><link rel="icon" type="image/png" href="/favicon.png"><meta name="generator"${addAttribute(Astro2.generator, "content")}><title>${title}</title>${renderHead()}</head> <body data-astro-cid-sckkx6r4> <div id="portal-root" data-astro-cid-sckkx6r4></div> <header class="bg-background border-b border-border" data-astro-cid-sckkx6r4> <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" data-astro-cid-sckkx6r4> <div class="flex justify-between items-center py-4" data-astro-cid-sckkx6r4> <div class="flex items-center space-x-8" data-astro-cid-sckkx6r4> <a href="/" class="text-xl font-bold text-foreground" data-astro-cid-sckkx6r4>Gutsy</a> ${user && renderTemplate`<div class="flex space-x-4" data-astro-cid-sckkx6r4> <a href="/logs/new" class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm" data-test-id="new-log-button-header" data-astro-cid-sckkx6r4>
+ New Log
</a> <div class="hidden md:flex space-x-6 items-center" data-astro-cid-sckkx6r4> <a href="/logs" class="text-muted-foreground hover:text-foreground font-medium" data-astro-cid-sckkx6r4>
My Logs
</a> <a href="/triggers" class="text-muted-foreground hover:text-foreground font-medium" data-astro-cid-sckkx6r4>
Triggers
</a> </div> </div>`} </div> <div class="flex items-center space-x-4" data-astro-cid-sckkx6r4> ${user ? renderTemplate`<div class="flex items-center space-x-4" data-astro-cid-sckkx6r4> <span class="text-sm text-muted-foreground hidden sm:inline" data-astro-cid-sckkx6r4>${user.email}</span> <button id="logout-btn" class="text-muted-foreground hover:text-foreground font-medium text-sm" data-astro-cid-sckkx6r4>
Sign Out
</button> </div>` : renderTemplate`<div class="flex items-center space-x-4" data-astro-cid-sckkx6r4> <a href="/login" class="text-muted-foreground hover:text-foreground font-medium text-sm" data-astro-cid-sckkx6r4>
Sign In
</a> <a href="/register" class="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2 px-4 rounded-lg transition-colors duration-200 text-sm" data-astro-cid-sckkx6r4>
Sign Up
</a> </div>`} </div> </div> </nav> </header> ${renderSlot($$result, $$slots["default"])} ${!hideFloatingButton && user && renderTemplate`${renderComponent($$result, "FloatingActionButton", $$FloatingActionButton, { "href": "/logs/new", "text": "New Meal Log", "icon": "fork", "data-astro-cid-sckkx6r4": true })}`} ${renderScript($$result, "C:/Projekty/Gutsy/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts")} </body> </html> `;
}, "C:/Projekty/Gutsy/src/layouts/Layout.astro", void 0);

export { $$Layout as $ };
