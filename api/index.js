export default async function handler(req, res) {
    const server = await import('../dist/audio-share/server/server.mjs');
    return server.reqHandler(req, res);
}
