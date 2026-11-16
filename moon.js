import * as THREE from 'three';

const canvas = document.querySelector('#scene');
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
});
renderer.setSize(
  canvas.clientWidth, canvas.clientHeight, false
);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  45, canvas.clientWidth / canvas.clientHeight,
  0.1, 200
);
const fit = Math.max(1, 1.1 / camera.aspect);
camera.position.set(0, 0, 7 * fit);

const NOISE = `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1) * 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float n = 0.0;
    for (int k = 0; k < 8; k++) {
      vec3 o = vec3(k & 1, (k >> 1) & 1, k >> 2);
      vec3 w = mix(1.0 - f, f, o);
      n += hash(i + o) * w.x * w.y * w.z;
    }
    return n;
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int k = 0; k < 6; k++) {
      v += a * noise(p);
      p *= 2.0;
      a *= 0.5;
    }
    return v;
  }
`;

const craters = Array.from({ length: 48 }, () => {
  const d = new THREE.Vector3().randomDirection();
  return new THREE.Vector4(d.x, d.y, d.z,
    0.05 + Math.random() ** 3 * 0.25);
});

const rock = new THREE.ShaderMaterial({
  uniforms: {
    uSun: { value: new THREE.Vector3(1, 0, 0) },
    uCraters: { value: craters },
  },
  vertexShader: `
    varying vec3 vPos;
    varying vec3 vN;
    void main() {
      vPos = position;
      vN = normalize(mat3(modelMatrix) * normal);
      gl_Position = projectionMatrix
        * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: NOISE + `
    uniform vec3 uSun;
    uniform vec4 uCraters[48];
    varying vec3 vPos;
    varying vec3 vN;
    void main() {
      vec3 p = normalize(vPos);
      float sea = smoothstep(0.48, 0.6, fbm(p * 1.7 + 7.0));
      vec3 col = vec3(0.68) - sea * 0.3 + fbm(p * 14.0) * 0.12;
      for (int i = 0; i < 48; i++) {
        vec4 c = uCraters[i];
        float d = distance(p, c.xyz) / c.w;
        float side = dot(normalize(p - c.xyz + 1e-5), uSun);
        if (d < 1.0) col += side * 0.25 * (1.0 - d) - 0.06;
        else col += smoothstep(1.35, 1.0, d) * 0.06;
      }
      col *= smoothstep(-0.05, 0.25, dot(vN, uSun));
      gl_FragColor = vec4(col, 1.0);
    }
  `,
});

const moon = new THREE.Mesh(
  new THREE.SphereGeometry(1.6, 160, 160),
  rock
);
scene.add(moon);

const far = new Float32Array(4000 * 3).map(
  () => (Math.random() - 0.5) * 120
);
const stars = new THREE.BufferGeometry();
stars.setAttribute(
  'position', new THREE.BufferAttribute(far, 3)
);
scene.add(new THREE.Points(stars,
  new THREE.PointsMaterial({
    size: 2, sizeAttenuation: false, color: '#c9d4ff',
  })
));

const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = clock.getElapsedTime();
  rock.uniforms.uSun.value.set(Math.cos(t * 0.25), 0, Math.sin(t * 0.25));
  moon.rotation.y = t * 0.03;
  renderer.render(scene, camera);
});
