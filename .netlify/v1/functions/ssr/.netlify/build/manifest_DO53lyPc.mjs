import '@astrojs/internal-helpers/path';
import 'kleur/colors';
import { p as NOOP_MIDDLEWARE_HEADER, q as decodeKey } from './chunks/astro/server_CYzSJK5e.mjs';
import 'clsx';
import 'cookie';
import './chunks/shared_9gEenf6c.mjs';
import 'es-module-lexer';
import 'html-escaper';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///C:/Projekty/Gutsy/","cacheDir":"file:///C:/Projekty/Gutsy/node_modules/.astro/","outDir":"file:///C:/Projekty/Gutsy/dist/","srcDir":"file:///C:/Projekty/Gutsy/src/","publicDir":"file:///C:/Projekty/Gutsy/public/","buildClientDir":"file:///C:/Projekty/Gutsy/dist/","buildServerDir":"file:///C:/Projekty/Gutsy/.netlify/build/","adapterName":"@astrojs/netlify","routes":[{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"page","component":"_server-islands.astro","params":["name"],"segments":[[{"content":"_server-islands","dynamic":false,"spread":false}],[{"content":"name","dynamic":true,"spread":false}]],"pattern":"^\\/_server-islands\\/([^/]+?)\\/?$","prerender":false,"isIndex":false,"fallbackRoutes":[],"route":"/_server-islands/[name]","origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"type":"endpoint","isIndex":false,"route":"/_image","pattern":"^\\/_image\\/?$","segments":[[{"content":"_image","dynamic":false,"spread":false}]],"params":[],"component":"node_modules/astro/dist/assets/endpoint/generic.js","pathname":"/_image","prerender":false,"fallbackRoutes":[],"origin":"internal","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/login","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/login\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/login.ts","pathname":"/api/auth/login","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/logout","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/logout\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"logout","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/logout.ts","pathname":"/api/auth/logout","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/register","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/register\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"register","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/register.ts","pathname":"/api/auth/register","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/request-password-reset","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/request-password-reset\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"request-password-reset","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/request-password-reset.ts","pathname":"/api/auth/request-password-reset","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/auth/status","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/auth\\/status\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"auth","dynamic":false,"spread":false}],[{"content":"status","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/auth/status.ts","pathname":"/api/auth/status","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/chat","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/chat\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"chat","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/chat.ts","pathname":"/api/chat","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/create-test-data","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/create-test-data\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"create-test-data","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/create-test-data.ts","pathname":"/api/create-test-data","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/debug-logs","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/debug-logs\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"debug-logs","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/debug-logs.ts","pathname":"/api/debug-logs","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/logs","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/logs\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"logs","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/logs.ts","pathname":"/api/logs","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/symptoms","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/symptoms\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"symptoms","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/symptoms.ts","pathname":"/api/symptoms","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[],"routeData":{"route":"/api/triggers","isIndex":false,"type":"endpoint","pattern":"^\\/api\\/triggers\\/?$","segments":[[{"content":"api","dynamic":false,"spread":false}],[{"content":"triggers","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/api/triggers.ts","pathname":"/api/triggers","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/forgot-password","isIndex":false,"type":"page","pattern":"^\\/forgot-password\\/?$","segments":[[{"content":"forgot-password","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/forgot-password.astro","pathname":"/forgot-password","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/logs/debug","isIndex":false,"type":"page","pattern":"^\\/logs\\/debug\\/?$","segments":[[{"content":"logs","dynamic":false,"spread":false}],[{"content":"debug","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/logs/debug.astro","pathname":"/logs/debug","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/logs/new","isIndex":false,"type":"page","pattern":"^\\/logs\\/new\\/?$","segments":[[{"content":"logs","dynamic":false,"spread":false}],[{"content":"new","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/logs/new.astro","pathname":"/logs/new","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/logs/simple","isIndex":false,"type":"page","pattern":"^\\/logs\\/simple\\/?$","segments":[[{"content":"logs","dynamic":false,"spread":false}],[{"content":"simple","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/logs/simple.astro","pathname":"/logs/simple","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/logs","isIndex":true,"type":"page","pattern":"^\\/logs\\/?$","segments":[[{"content":"logs","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/logs/index.astro","pathname":"/logs","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/register","isIndex":false,"type":"page","pattern":"^\\/register\\/?$","segments":[[{"content":"register","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/register.astro","pathname":"/register","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/triggers","isIndex":false,"type":"page","pattern":"^\\/triggers\\/?$","segments":[[{"content":"triggers","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/triggers.astro","pathname":"/triggers","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"","links":[],"scripts":[],"styles":[{"type":"external","src":"/_astro/forgot-password.aQUcOeDJ.css"}],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":false,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["C:/Projekty/Gutsy/src/pages/forgot-password.astro",{"propagation":"none","containsHead":true}],["C:/Projekty/Gutsy/src/pages/index.astro",{"propagation":"none","containsHead":true}],["C:/Projekty/Gutsy/src/pages/login.astro",{"propagation":"none","containsHead":true}],["C:/Projekty/Gutsy/src/pages/logs/debug.astro",{"propagation":"none","containsHead":true}],["C:/Projekty/Gutsy/src/pages/logs/index.astro",{"propagation":"none","containsHead":true}],["C:/Projekty/Gutsy/src/pages/logs/new.astro",{"propagation":"none","containsHead":true}],["C:/Projekty/Gutsy/src/pages/logs/simple.astro",{"propagation":"none","containsHead":true}],["C:/Projekty/Gutsy/src/pages/register.astro",{"propagation":"none","containsHead":true}],["C:/Projekty/Gutsy/src/pages/triggers.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000astro-internal:middleware":"_astro-internal_middleware.mjs","\u0000noop-actions":"_noop-actions.mjs","\u0000@astro-page:node_modules/astro/dist/assets/endpoint/generic@_@js":"pages/_image.astro.mjs","\u0000@astro-page:src/pages/api/auth/login@_@ts":"pages/api/auth/login.astro.mjs","\u0000@astro-page:src/pages/api/auth/logout@_@ts":"pages/api/auth/logout.astro.mjs","\u0000@astro-page:src/pages/api/auth/register@_@ts":"pages/api/auth/register.astro.mjs","\u0000@astro-page:src/pages/api/auth/request-password-reset@_@ts":"pages/api/auth/request-password-reset.astro.mjs","\u0000@astro-page:src/pages/api/auth/status@_@ts":"pages/api/auth/status.astro.mjs","\u0000@astro-page:src/pages/api/chat@_@ts":"pages/api/chat.astro.mjs","\u0000@astro-page:src/pages/api/create-test-data@_@ts":"pages/api/create-test-data.astro.mjs","\u0000@astro-page:src/pages/api/debug-logs@_@ts":"pages/api/debug-logs.astro.mjs","\u0000@astro-page:src/pages/api/logs@_@ts":"pages/api/logs.astro.mjs","\u0000@astro-page:src/pages/api/symptoms@_@ts":"pages/api/symptoms.astro.mjs","\u0000@astro-page:src/pages/api/triggers@_@ts":"pages/api/triggers.astro.mjs","\u0000@astro-page:src/pages/forgot-password@_@astro":"pages/forgot-password.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/logs/debug@_@astro":"pages/logs/debug.astro.mjs","\u0000@astro-page:src/pages/logs/new@_@astro":"pages/logs/new.astro.mjs","\u0000@astro-page:src/pages/logs/simple@_@astro":"pages/logs/simple.astro.mjs","\u0000@astro-page:src/pages/logs/index@_@astro":"pages/logs.astro.mjs","\u0000@astro-page:src/pages/register@_@astro":"pages/register.astro.mjs","\u0000@astro-page:src/pages/triggers@_@astro":"pages/triggers.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astrojs-ssr-virtual-entry":"entry.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-ssr-adapter":"_@astrojs-ssr-adapter.mjs","\u0000@astrojs-manifest":"manifest_DO53lyPc.mjs","C:/Projekty/Gutsy/node_modules/unstorage/drivers/netlify-blobs.mjs":"chunks/netlify-blobs_DM36vZAS.mjs","C:/Projekty/Gutsy/src/components/ForgotPasswordForm.tsx":"_astro/ForgotPasswordForm.oi-Rrv_W.js","C:/Projekty/Gutsy/src/components/SimpleLogForm.tsx":"_astro/SimpleLogForm.B1LIF4hP.js","C:/Projekty/Gutsy/src/components/RegisterForm.tsx":"_astro/RegisterForm.CZvfFECg.js","C:/Projekty/Gutsy/src/components/LoginForm.tsx":"_astro/LoginForm.BNpDml9s.js","C:/Projekty/Gutsy/src/components/CreateLogForm.tsx":"_astro/CreateLogForm.DhMFeHfM.js","@astrojs/react/client.js":"_astro/client.3bM_UWZ3.js","C:/Projekty/Gutsy/src/pages/logs/debug.astro?astro&type=script&index=0&lang.ts":"_astro/debug.astro_astro_type_script_index_0_lang.Cz6uMaWD.js","C:/Projekty/Gutsy/src/pages/logs/index.astro?astro&type=script&index=0&lang.ts":"_astro/index.astro_astro_type_script_index_0_lang.24lLpKnO.js","C:/Projekty/Gutsy/src/pages/triggers.astro?astro&type=script&index=0&lang.ts":"_astro/triggers.astro_astro_type_script_index_0_lang.DfzQbS4j.js","C:/Projekty/Gutsy/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts":"_astro/Layout.astro_astro_type_script_index_0_lang.BgH98m_K.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[["C:/Projekty/Gutsy/src/pages/logs/debug.astro?astro&type=script&index=0&lang.ts","async function o(){try{const e=await(await fetch(\"/api/debug-logs\")).json(),t=document.getElementById(\"debug-info\");t&&(t.innerHTML=`<pre class=\"text-sm\">${JSON.stringify(e,null,2)}</pre>`)}catch(n){const e=document.getElementById(\"debug-info\");e&&(e.innerHTML=`<p class=\"text-red-600\">Error loading debug info: ${n.message}</p>`)}}o();"],["C:/Projekty/Gutsy/src/layouts/Layout.astro?astro&type=script&index=0&lang.ts","document.addEventListener(\"DOMContentLoaded\",()=>{const o=document.getElementById(\"logout-btn\");o&&o.addEventListener(\"click\",async()=>{try{(await fetch(\"/api/auth/logout\",{method:\"POST\",headers:{\"Content-Type\":\"application/json\"}})).ok?window.location.href=\"/\":console.error(\"Logout failed\")}catch(e){console.error(\"Error during logout:\",e)}})});"]],"assets":["/_astro/forgot-password.aQUcOeDJ.css","/favicon.png","/_astro/client.3bM_UWZ3.js","/_astro/CreateLogForm.DhMFeHfM.js","/_astro/ForgotPasswordForm.oi-Rrv_W.js","/_astro/index.0yr9KlQE.js","/_astro/index.astro_astro_type_script_index_0_lang.24lLpKnO.js","/_astro/index.ViApDAiE.js","/_astro/input.CNOnzrt0.js","/_astro/jsx-runtime.D_zvdyIk.js","/_astro/LoginForm.BNpDml9s.js","/_astro/RegisterForm.CZvfFECg.js","/_astro/SimpleLogForm.B1LIF4hP.js","/_astro/triggers.astro_astro_type_script_index_0_lang.DfzQbS4j.js"],"buildFormat":"directory","checkOrigin":true,"serverIslandNameMap":[],"key":"A1a1Qzt0Aw25+U3O2UiEksAfhflrWUwukJpC4gPrAX0=","sessionConfig":{"driver":"netlify-blobs","options":{"name":"astro-sessions","consistency":"strong"}}});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = () => import('./chunks/netlify-blobs_DM36vZAS.mjs');

export { manifest };
