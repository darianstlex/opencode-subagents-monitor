let mod;
try {
    await import("opentui:runtime-module:" + encodeURIComponent("@opentui/solid"));
    mod = await import("./tui-compiled/index.tsx");
} catch {
    mod = await import("./index.tsx");
}

export default mod.default;
