// Runs off the main thread: context creation on CPU renderers is slow.
let res = { ok: false, software: false, renderer: '' };
try {
  const c = new OffscreenCanvas(1, 1);
  const gl = c.getContext('webgl2') || c.getContext('webgl');
  if (gl) {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const name = String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER) || '');
    res = { ok: true, software: /swiftshader|llvmpipe|softpipe|software|basic render/i.test(name), renderer: name };
    gl.getExtension('WEBGL_lose_context')?.loseContext();
  }
} catch {
  /* fall through */
}
self.postMessage(res);
