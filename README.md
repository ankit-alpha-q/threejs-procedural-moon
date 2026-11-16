# The Moon · Three.js

Seas, craters and phases, with zero image textures.

**Live demo:** https://ankit-alpha-q.github.io/threejs-procedural-moon/

Built step by step on the MahaDev YouTube channel. Everything is in [`moon.js`](./moon.js).

## Run it
Any static server works, for example:
```
npx serve .
```

## Make it yours
- More craters: 48 → 120
- A red moon: tint col by vec3(1.0, 0.6, 0.5)
- Faster phases: t * 0.25 → t * 1.0

MIT licensed.
