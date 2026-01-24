import { renderers } from './renderers.mjs';
import { s as serverEntrypointModule } from './chunks/_@astrojs-ssr-adapter_CvSoi7hX.mjs';
import { manifest } from './manifest_DO53lyPc.mjs';
import { createExports } from '@astrojs/netlify/ssr-function.js';

const serverIslandMap = new Map();;

const _page0 = () => import('./pages/_image.astro.mjs');
const _page1 = () => import('./pages/api/auth/login.astro.mjs');
const _page2 = () => import('./pages/api/auth/logout.astro.mjs');
const _page3 = () => import('./pages/api/auth/register.astro.mjs');
const _page4 = () => import('./pages/api/auth/request-password-reset.astro.mjs');
const _page5 = () => import('./pages/api/auth/status.astro.mjs');
const _page6 = () => import('./pages/api/chat.astro.mjs');
const _page7 = () => import('./pages/api/create-test-data.astro.mjs');
const _page8 = () => import('./pages/api/debug-logs.astro.mjs');
const _page9 = () => import('./pages/api/logs.astro.mjs');
const _page10 = () => import('./pages/api/symptoms.astro.mjs');
const _page11 = () => import('./pages/api/triggers.astro.mjs');
const _page12 = () => import('./pages/forgot-password.astro.mjs');
const _page13 = () => import('./pages/login.astro.mjs');
const _page14 = () => import('./pages/logs/debug.astro.mjs');
const _page15 = () => import('./pages/logs/new.astro.mjs');
const _page16 = () => import('./pages/logs/simple.astro.mjs');
const _page17 = () => import('./pages/logs.astro.mjs');
const _page18 = () => import('./pages/register.astro.mjs');
const _page19 = () => import('./pages/triggers.astro.mjs');
const _page20 = () => import('./pages/index.astro.mjs');
const pageMap = new Map([
    ["node_modules/astro/dist/assets/endpoint/generic.js", _page0],
    ["src/pages/api/auth/login.ts", _page1],
    ["src/pages/api/auth/logout.ts", _page2],
    ["src/pages/api/auth/register.ts", _page3],
    ["src/pages/api/auth/request-password-reset.ts", _page4],
    ["src/pages/api/auth/status.ts", _page5],
    ["src/pages/api/chat.ts", _page6],
    ["src/pages/api/create-test-data.ts", _page7],
    ["src/pages/api/debug-logs.ts", _page8],
    ["src/pages/api/logs.ts", _page9],
    ["src/pages/api/symptoms.ts", _page10],
    ["src/pages/api/triggers.ts", _page11],
    ["src/pages/forgot-password.astro", _page12],
    ["src/pages/login.astro", _page13],
    ["src/pages/logs/debug.astro", _page14],
    ["src/pages/logs/new.astro", _page15],
    ["src/pages/logs/simple.astro", _page16],
    ["src/pages/logs/index.astro", _page17],
    ["src/pages/register.astro", _page18],
    ["src/pages/triggers.astro", _page19],
    ["src/pages/index.astro", _page20]
]);

const _manifest = Object.assign(manifest, {
    pageMap,
    serverIslandMap,
    renderers,
    actions: () => import('./_noop-actions.mjs'),
    middleware: () => import('./_astro-internal_middleware.mjs')
});
const _args = {
    "middlewareSecret": "9b95815a-3eba-4123-9f33-4793802f1eb5"
};
const _exports = createExports(_manifest, _args);
const __astrojsSsrVirtualEntry = _exports.default;
const _start = 'start';
if (Object.prototype.hasOwnProperty.call(serverEntrypointModule, _start)) {
	serverEntrypointModule[_start](_manifest, _args);
}

export { __astrojsSsrVirtualEntry as default, pageMap };
