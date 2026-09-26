"use client";

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Icon } from "@/components/ui/icon";
import { usePomodoro } from "@/components/pomodoro/pomodoro-provider";
import { DraggablePanel } from "@/components/neural/draggable-panel";
import { resetHudPositions } from "@/lib/ui-prefs";
import {
  certs, certDomains, pomodorosToday, pomodorosTodayTarget,
  streak, weeklyHours, weeklyTarget,
} from "@/lib/mock-data";

// ─── Region / Neuron model ────────────────────────────────────────────
interface NeuronData {
  name: string; progress: number; weight: number;
  hoursLogged: number; pomodoroCount: number;
  sessionsLast7d: number; lastSessionDaysAgo: number | null;
  pos: THREE.Vector3;
}
interface RegionData {
  code: string; name: string; progress: number; hours: number;
  active: boolean; color: string; sessions7d: number;
  center: THREE.Vector3; neurons: NeuronData[];
}
interface HoveredUI { region: RegionData; neuron: NeuronData; ri: number }

export function NeuralMission() {
  const { open: startPomodoro } = usePomodoro();
  const mountRef    = useRef<HTMLDivElement>(null);
  const sceneStateR = useRef<any>({});
  const hoveredR    = useRef<any>(null);
  const focusR      = useRef({ target: new THREE.Vector3(0, 0, 0), zoom: 12 });
  const dragStateR  = useRef({ dragging: false, lastX: 0, lastY: 0, yaw: 0.4, pitch: 0.25, rotSpeed: 0, lastDragEnd: -1e9 });
  const visR        = useRef({ labels: true, hoverRegion: -1 });
  const mouseTimeR  = useRef(performance.now());
  const mouseInsideR = useRef(false);
  const cinemaR     = useRef(false);
  const tooltipElR  = useRef<HTMLDivElement>(null);

  const [hoveredUI,    setHoveredUI]    = useState<HoveredUI | null>(null);
  const [hudVisible,   setHudVisible]   = useState(true);
  const [labelsOn,     setLabelsOn]     = useState(true);
  const [cinema,       setCinema]       = useState(false);
  const [activeRegion, setActiveRegion] = useState<string | null>(null);
  const [fps,          setFps]          = useState(60);

  useEffect(() => { visR.current.labels = labelsOn; }, [labelsOn]);
  useEffect(() => { cinemaR.current = cinema; }, [cinema]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      const k = e.key.toLowerCase();
      if (k === "h") setHudVisible((v) => !v);
      else if (k === "l") setLabelsOn((v) => !v);
      else if (k === "f" || k === " ") { e.preventDefault(); setCinema((v) => !v); }
      else if (k === "escape") setCinema(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const regions: RegionData[] = useMemo(() => {
    const COLORS = ["#326CE5", "#00D9A3", "#FF6B35", "#FFC857", "#FF00E5"];
    const LAYOUT: [number, number, number][] = [
      [ 3.0,  1.2,  1.4],
      [-3.2,  1.8,  0.6],
      [-3.3, -1.6, -0.7],
      [ 3.5, -1.4, -1.1],
      [ 0.1,  0.4, -3.6],
    ];
    return certs.map((c, i) => {
      const center = new THREE.Vector3(...LAYOUT[i]);
      const domains = (certDomains[c.code] || []).slice(0, 6);
      const seedR = mkRng(i * 91 + 7);
      const neurons: NeuronData[] = domains.map((d) => {
        const u = seedR(), v = seedR(), w = seedR();
        const r = 0.85;
        const theta = u * Math.PI * 2;
        const phi   = Math.acos(2 * v - 1);
        const rad   = r * (0.7 + w * 0.4);
        const off = new THREE.Vector3(
          rad * Math.sin(phi) * Math.cos(theta),
          rad * Math.sin(phi) * Math.sin(theta),
          rad * Math.cos(phi),
        );
        return {
          name: d.name, progress: d.progress, weight: d.weight,
          hoursLogged: d.hoursLogged, pomodoroCount: d.pomodoroCount,
          sessionsLast7d: d.sessionsLast7d, lastSessionDaysAgo: d.lastSessionDaysAgo,
          pos: center.clone().add(off),
        };
      });
      const sessions7d = neurons.reduce((a, n) => a + n.sessionsLast7d, 0);
      return {
        code: c.code, name: c.name, progress: c.progress,
        hours: c.hours, active: c.status === "in_progress",
        color: COLORS[i], sessions7d, center, neurons,
      };
    });
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const w = Math.max(1, container.clientWidth);
    const h = Math.max(1, container.clientHeight);
    const scene  = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 200);
    camera.position.set(0, 0, 12);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const resize = () => {
      const W = Math.max(1, container.clientWidth);
      const H = Math.max(1, container.clientHeight);
      renderer.setSize(W, H);
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
    };
    requestAnimationFrame(resize);
    setTimeout(resize, 50);
    setTimeout(resize, 200);

    const root = new THREE.Group();
    scene.add(root);

    const haloTex   = makeHaloTexture(180, 0.18);
    const pulseTex  = makeHaloTexture(64, 0.45);
    const sparkTex  = makeHaloTexture(40, 0.6);

    // Stars + nebula
    {
      const N = 1400;
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(N * 3);
      const col = new Float32Array(N * 3);
      for (let i = 0; i < N; i++) {
        const r = 50 + Math.random() * 70;
        const t = Math.random() * Math.PI * 2;
        const p = Math.acos(2 * Math.random() - 1);
        pos[i*3]   = r * Math.sin(p) * Math.cos(t);
        pos[i*3+1] = r * Math.sin(p) * Math.sin(t);
        pos[i*3+2] = r * Math.cos(p);
        const tint = Math.random();
        if (tint < 0.6) { col[i*3] = 0.85; col[i*3+1] = 0.9;  col[i*3+2] = 1.0; }
        else if (tint < 0.85) { col[i*3] = 0.4; col[i*3+1] = 0.65; col[i*3+2] = 1.0; }
        else                  { col[i*3] = 1.0; col[i*3+1] = 0.55; col[i*3+2] = 0.85; }
      }
      geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
      geo.setAttribute("color",    new THREE.BufferAttribute(col, 3));
      const mat = new THREE.PointsMaterial({
        size: 0.5, sizeAttenuation: true, vertexColors: true,
        transparent: true, opacity: 0.85,
        map: sparkTex, depthWrite: false, blending: THREE.AdditiveBlending,
      });
      scene.add(new THREE.Points(geo, mat));
    }

    // Nebula glow
    [0x1c3a8a, 0x6b1e7a].forEach((c, i) => {
      const tex = makeHaloTexture(512, 0.08);
      const mat = new THREE.SpriteMaterial({ map: tex, color: c, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.55 });
      const sp = new THREE.Sprite(mat);
      sp.scale.setScalar(60);
      sp.position.set(i === 0 ? -10 : 10, i === 0 ? 4 : -3, -30);
      scene.add(sp);
    });

    const neuronMeshes: THREE.Mesh[] = [];
    const allNeurons: any[] = [];
    const regionGroups: any[] = [];
    const regionLabels: { sprite: THREE.Sprite; mat: THREE.SpriteMaterial; regionIdx: number }[] = [];

    regions.forEach((r, ri) => {
      const grp = new THREE.Group();
      grp.userData = { region: r, idx: ri };
      root.add(grp);
      regionGroups.push(grp);

      const color = new THREE.Color(r.color);
      const brightness = 0.5 + (r.progress / 100) * 0.5;

      const size = 0.28 + Math.min(r.hours / 60, 1) * 0.2 + (r.active ? 0.1 : 0);
      const coreGeo = new THREE.SphereGeometry(size, 24, 24);
      const coreMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.95 });
      const core    = new THREE.Mesh(coreGeo, coreMat);
      core.position.copy(r.center);
      grp.add(core);

      const haloMat = new THREE.SpriteMaterial({
        map: haloTex, color, transparent: true, blending: THREE.AdditiveBlending,
        depthWrite: false, opacity: 0.35 + brightness * 0.7,
      });
      const halo = new THREE.Sprite(haloMat);
      halo.scale.setScalar(1.6 + brightness * 1.6 + (r.active ? 1.0 : 0));
      halo.position.copy(r.center);
      grp.add(halo);

      const labelTex = makeLabelTexture(r.code, r.color);
      const labelMat = new THREE.SpriteMaterial({
        map: labelTex, transparent: true, depthTest: false, depthWrite: false, opacity: 0.48,
      });
      const label = new THREE.Sprite(labelMat);
      label.scale.set(1.4, 0.42, 1);
      label.position.copy(r.center).add(new THREE.Vector3(0, size + 0.45, 0));
      label.renderOrder = 100;
      grp.add(label);
      regionLabels.push({ sprite: label, mat: labelMat, regionIdx: ri });

      if (r.active) {
        const ringGeo = new THREE.RingGeometry(size * 1.4, size * 1.55, 64);
        const ringMat = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.7, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, depthWrite: false });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.copy(r.center);
        grp.add(ring);
        grp.userData.activeRing = ring;
      }

      allNeurons.push({ mesh: core, halo, base: size, jitter: ri * 1.3, isCore: true });

      r.neurons.forEach((n, ni) => {
        const hoursNorm = Math.min(n.hoursLogged / 20, 1);
        const nSize = 0.06 + hoursNorm * 0.10;
        const recent = n.lastSessionDaysAgo !== null && n.lastSessionDaysAgo <= 1;
        const opacityBase = 0.55 + (n.progress / 100) * 0.4;
        const geo  = new THREE.SphereGeometry(Math.max(nSize, 0.03), 14, 14);
        const mat  = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: opacityBase });
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.copy(n.pos);
        mesh.userData = { region: r, neuron: n, ri, ni };
        grp.add(mesh);
        neuronMeshes.push(mesh);

        const nHaloMat = new THREE.SpriteMaterial({
          map: haloTex, color, transparent: true, blending: THREE.AdditiveBlending,
          depthWrite: false, opacity: 0.25 + hoursNorm * 0.6 + (recent ? 0.25 : 0),
        });
        const nHalo = new THREE.Sprite(nHaloMat);
        nHalo.scale.setScalar(0.4 + hoursNorm * 1.0 + (recent ? 0.4 : 0));
        nHalo.position.copy(n.pos);
        grp.add(nHalo);

        allNeurons.push({
          mesh, halo: nHalo, base: Math.max(nSize, 0.03),
          jitter: ri * 1.7 + ni * 0.6, isCore: false,
          recent, opacityBase, regionActive: r.active,
        });
      });
    });

    // Synapses
    const synapses: any[] = [];
    regions.forEach((r, ri) => {
      const freq = Math.min(r.sessions7d / 25, 1);
      const strBase = 0.18 + freq * 0.85;
      r.neurons.forEach((n) => {
        const nFreq = Math.min(n.sessionsLast7d / 7, 1);
        synapses.push(makeSynapse(n.pos, r.center, r.color, Math.max(strBase, 0.2 + nFreq * 0.8), ri, false));
      });
      r.neurons.forEach((n, ni) => {
        const nx = r.neurons[(ni + 1) % r.neurons.length];
        synapses.push(makeSynapse(n.pos, nx.pos, r.color, Math.max(strBase * 0.7, 0.18), ri, false));
      });
    });
    for (let i = 0; i < regions.length; i++) {
      for (let j = i + 1; j < regions.length; j++) {
        const avgFreq = (regions[i].sessions7d + regions[j].sessions7d) / 50;
        synapses.push(makeSynapse(
          regions[i].center, regions[j].center,
          mixColor(regions[i].color, regions[j].color),
          0.16 + avgFreq * 0.35, -1, true,
        ));
      }
    }

    {
      const SEGS = 14;
      const positions: number[] = [];
      const colors: number[] = [];
      synapses.forEach((s) => {
        const col = new THREE.Color(s.color);
        const opacity = s.strength;
        for (let k = 0; k < SEGS; k++) {
          const a = s.curve.getPoint(k / SEGS);
          const b = s.curve.getPoint((k + 1) / SEGS);
          positions.push(a.x, a.y, a.z, b.x, b.y, b.z);
          const fade = 0.6 + 0.4 * (1 - Math.abs(0.5 - (k + 0.5) / SEGS) * 2);
          const f = opacity * fade;
          colors.push(col.r * f, col.g * f, col.b * f,
                      col.r * f, col.g * f, col.b * f);
        }
      });
      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute("color",    new THREE.Float32BufferAttribute(colors, 3));
      const mat = new THREE.LineBasicMaterial({
        vertexColors: true, transparent: true, opacity: 0.85,
        blending: THREE.AdditiveBlending, depthWrite: false,
      });
      root.add(new THREE.LineSegments(geo, mat));
    }

    const pulses: any[] = [];
    const PULSE_COUNT = 110;
    const speedFor = (syn: any) => {
      if (syn.region < 0) return 0.10 + Math.random() * 0.10;
      const freq = Math.min(regions[syn.region].sessions7d / 25, 1);
      return 0.10 + 0.45 * freq + Math.random() * 0.10;
    };
    for (let i = 0; i < PULSE_COUNT; i++) {
      const s = pickSynapse(synapses, regions);
      const mat = new THREE.SpriteMaterial({
        map: pulseTex, color: new THREE.Color(s.color),
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 1,
      });
      const sp = new THREE.Sprite(mat);
      sp.scale.setScalar(0.18 + Math.random() * 0.08);
      root.add(sp);
      pulses.push({ sprite: sp, syn: s, t: Math.random(), speed: speedFor(s) });
    }

    const sparks: any[] = [];
    const activeRegionData = regions.find((r) => r.active);
    if (activeRegionData) {
      for (let i = 0; i < 26; i++) {
        const mat = new THREE.SpriteMaterial({
          map: sparkTex, color: new THREE.Color(activeRegionData.color),
          transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 1,
        });
        const sp = new THREE.Sprite(mat);
        sp.scale.setScalar(0.12);
        root.add(sp);
        sparks.push({
          sprite: sp,
          base: activeRegionData.center.clone(),
          t: Math.random(),
          speed: 0.25 + Math.random() * 0.35,
          dir: new THREE.Vector3((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)).normalize(),
          dist: 1.2 + Math.random() * 1.4,
        });
      }
    }

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2(99, 99);

    const dom = renderer.domElement;
    dom.style.cursor = "grab";
    const onPointerDown = (e: PointerEvent) => {
      dragStateR.current.dragging = true;
      dragStateR.current.lastX = e.clientX;
      dragStateR.current.lastY = e.clientY;
      dom.style.cursor = "grabbing";
      dom.setPointerCapture(e.pointerId);
    };
    const onPointerMove = (e: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      mouse.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
      mouse.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
      mouseTimeR.current = performance.now();
      const ds = dragStateR.current;
      if (!ds.dragging) return;
      const dx = e.clientX - ds.lastX;
      const dy = e.clientY - ds.lastY;
      ds.lastX = e.clientX;
      ds.lastY = e.clientY;
      ds.yaw   += dx * 0.005;
      ds.pitch += dy * 0.005;
      ds.pitch = Math.max(-1.2, Math.min(1.2, ds.pitch));
    };
    const onPointerUp = (e: PointerEvent) => {
      dragStateR.current.dragging = false;
      dragStateR.current.lastDragEnd = performance.now();
      dom.style.cursor = "grab";
      try { dom.releasePointerCapture(e.pointerId); } catch {}
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      focusR.current.zoom = Math.max(6, Math.min(22, focusR.current.zoom + e.deltaY * 0.01));
    };
    const onClick = () => {
      const hov = hoveredR.current;
      if (hov && hov.ri !== undefined) {
        const r = regions[hov.ri];
        setActiveRegion((cur) => cur === r.code ? null : r.code);
        focusR.current.target.copy(r.center);
      }
    };
    const onPointerEnter = () => { mouseInsideR.current = true; };
    const onPointerLeave = () => {
      mouse.x = 99; mouse.y = 99;
      mouseInsideR.current = false;
    };

    dom.addEventListener("pointerdown", onPointerDown);
    dom.addEventListener("pointermove", onPointerMove);
    dom.addEventListener("pointerup",   onPointerUp);
    dom.addEventListener("pointercancel", onPointerUp);
    dom.addEventListener("pointerenter", onPointerEnter);
    dom.addEventListener("pointerleave", onPointerLeave);
    dom.addEventListener("wheel",       onWheel, { passive: false });
    dom.addEventListener("click",       onClick);

    const ro = new ResizeObserver(resize);
    ro.observe(container);
    window.addEventListener("resize", resize);

    let frameAcc = 0, frameCount = 0;
    let raf = 0;
    const clock = new THREE.Clock();
    let lastHover: any = null;

    const animate = () => {
      const dt = clock.getDelta();
      const t  = clock.elapsedTime;
      const ds = dragStateR.current;

      const cW = container.clientWidth, cH = container.clientHeight;
      if (cW > 0 && cH > 0 && (renderer.domElement.width !== Math.floor(cW * renderer.getPixelRatio()) ||
                                renderer.domElement.height !== Math.floor(cH * renderer.getPixelRatio()))) {
        renderer.setSize(cW, cH);
        camera.aspect = cW / cH;
        camera.updateProjectionMatrix();
      }

      const now = performance.now();
      const hovering = !!hoveredR.current;
      // "parked" só conta quando o mouse está dentro do canvas E não tá em cinema.
      // No modo cinema o cérebro rotaciona o tempo todo, sem precisar mexer mouse.
      const parked = !cinemaR.current && mouseInsideR.current && (now - mouseTimeR.current) > 1500;
      const grace  = (now - ds.lastDragEnd) < 1500;
      const pause  = ds.dragging || hovering || parked || grace;
      const target = pause ? 0 : 0.08;
      ds.rotSpeed = ds.rotSpeed + (target - ds.rotSpeed) * Math.min(1, dt * 3);
      ds.yaw += dt * ds.rotSpeed;

      const tg = focusR.current.target;
      const zoom = focusR.current.zoom;
      const cx = tg.x + Math.cos(ds.pitch) * Math.sin(ds.yaw) * zoom;
      const cy = tg.y + Math.sin(ds.pitch) * zoom + Math.sin(t * 0.4) * 0.08;
      const cz = tg.z + Math.cos(ds.pitch) * Math.cos(ds.yaw) * zoom;
      camera.position.set(cx, cy, cz);
      camera.lookAt(tg);

      allNeurons.forEach((n) => {
        const speed = n.isCore ? 1.0 : 1.8;
        const amp   = n.isCore ? 0.05 : 0.08;
        let s = 1 + Math.sin(t * speed + n.jitter) * amp;
        if (n.recent) s += Math.sin(t * 3.5 + n.jitter) * 0.06;
        n.mesh.scale.setScalar(s);
      });

      const wantLabels = visR.current.labels ? 1 : 0;
      const hoverIdx   = visR.current.hoverRegion;
      regionLabels.forEach((l) => {
        const isHover = l.regionIdx === hoverIdx;
        const tgt = wantLabels === 0 ? 0 : (isHover ? 1.0 : 0.45);
        l.mat.opacity = l.mat.opacity + (tgt - l.mat.opacity) * Math.min(1, dt * 6);
        const sTarget = isHover ? 1.18 : 1.0;
        const cur = (l.sprite.userData.s as number) || 1;
        const next = cur + (sTarget - cur) * Math.min(1, dt * 8);
        l.sprite.userData.s = next;
        l.sprite.scale.set(1.4 * next, 0.42 * next, 1);
      });

      regionGroups.forEach((g) => {
        if (g.userData.activeRing) g.userData.activeRing.rotation.z += dt * 1.3;
      });

      pulses.forEach((p) => {
        p.t += p.speed * dt;
        if (p.t > 1) {
          p.t = 0;
          p.syn = pickSynapse(synapses, regions);
          p.sprite.material.color.set(p.syn.color);
          p.sprite.scale.setScalar(0.18 + Math.random() * 0.08);
          p.speed = speedFor(p.syn);
        }
        const pos = p.syn.curve.getPoint(p.t);
        p.sprite.position.copy(pos);
        const fadeIn  = Math.min(1, p.t / 0.1);
        const fadeOut = Math.min(1, (1 - p.t) / 0.1);
        p.sprite.material.opacity = Math.min(fadeIn, fadeOut);
      });

      sparks.forEach((s) => {
        s.t += s.speed * dt;
        if (s.t > 1) { s.t = 0; s.dir.set((Math.random()-0.5), (Math.random()-0.5), (Math.random()-0.5)).normalize(); }
        const offset = s.dir.clone().multiplyScalar(s.dist * s.t);
        s.sprite.position.copy(s.base).add(offset);
        s.sprite.material.opacity = (1 - s.t) * 0.9;
      });

      if (mouse.x < 2 && mouse.x > -2) {
        raycaster.setFromCamera(mouse, camera);
        const hits = raycaster.intersectObjects(neuronMeshes, false);
        const hit  = hits.length ? hits[0].object : null;
        const hov: any  = hit ? { ...hit.userData, mesh: hit } : null;
        visR.current.hoverRegion = hov ? hov.ri : -1;
        if ((hov && (!lastHover || lastHover.mesh !== hov.mesh)) || (!hov && lastHover)) {
          lastHover = hov;
          hoveredR.current = hov;
          if (hov) setHoveredUI({ region: hov.region, neuron: hov.neuron, ri: hov.ri });
          else     setHoveredUI(null);
        }
      } else if (lastHover) {
        lastHover = null;
        hoveredR.current = null;
        visR.current.hoverRegion = -1;
        setHoveredUI(null);
      }

      if (hoveredR.current && hoveredR.current.mesh && tooltipElR.current) {
        const v = new THREE.Vector3();
        hoveredR.current.mesh.getWorldPosition(v);
        v.project(camera);
        const W = container.clientWidth, H = container.clientHeight;
        const sx = (v.x + 1) * 0.5 * W;
        const sy = (1 - v.y) * 0.5 * H;
        const behind = v.z > 1;
        const el = tooltipElR.current;
        const tw = el.offsetWidth  || 360;
        const th = el.offsetHeight || 320;
        const above = sy - th - 28 > 12;
        const tx = Math.max(12, Math.min(W - tw - 12, sx - tw / 2));
        const ty = above ? Math.max(12, sy - th - 28) : Math.min(H - th - 12, sy + 28);
        el.style.transform = `translate(${tx}px, ${ty}px)`;
        el.style.opacity   = behind ? "0" : "1";
      }

      renderer.render(scene, camera);

      frameAcc += dt; frameCount++;
      if (frameAcc > 1) {
        setFps(Math.round(frameCount / frameAcc));
        frameAcc = 0; frameCount = 0;
      }
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    sceneStateR.current = { scene, camera, renderer, root, regions };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      dom.removeEventListener("pointerdown", onPointerDown);
      dom.removeEventListener("pointermove", onPointerMove);
      dom.removeEventListener("pointerup",   onPointerUp);
      dom.removeEventListener("pointercancel", onPointerUp);
      dom.removeEventListener("pointerenter", onPointerEnter);
      dom.removeEventListener("pointerleave", onPointerLeave);
      dom.removeEventListener("wheel",       onWheel);
      dom.removeEventListener("click",       onClick);
      try { container.removeChild(dom); } catch {}
      renderer.dispose();
    };
  }, [regions]);

  const resetView = () => {
    dragStateR.current.yaw = 0.4;
    dragStateR.current.pitch = 0.25;
    focusR.current.target.set(0, 0, 0);
    focusR.current.zoom = 12;
    setActiveRegion(null);
  };

  const focusRegion = (code: string) => {
    const r = regions.find((x) => x.code === code);
    if (!r) return;
    focusR.current.target.copy(r.center);
    focusR.current.zoom = 7;
    setActiveRegion(code);
  };

  return (
    <div className={`overflow-hidden bg-[#04060d] ${cinema ? "fixed inset-0 z-50" : "relative h-screen w-full"}`}>
      <div className="absolute inset-0 pointer-events-none" style={{
        background: `
          radial-gradient(900px 600px at 25% 30%, rgba(50,108,229,0.25), transparent 60%),
          radial-gradient(700px 500px at 80% 70%, rgba(255,0,229,0.10), transparent 60%),
          radial-gradient(1000px 700px at 50% 110%, rgba(0,229,255,0.08), transparent 60%)
        `,
      }}/>
      <div className={`absolute inset-0 scanlines pointer-events-none ${cinema ? "opacity-20" : "opacity-40"}`}/>

      <div ref={mountRef} className="absolute inset-0"/>

      <div className={`transition-opacity duration-500 ${hudVisible ? "opacity-100" : "opacity-0 pointer-events-none"}`}>
        <HUDOverlay
          regions={regions}
          activeRegion={activeRegion}
          onFocus={focusRegion}
          onStartFocus={startPomodoro}
          fps={fps}
        />
      </div>

      <div
        ref={tooltipElR}
        className={`absolute top-0 left-0 z-[35] pointer-events-none transition-opacity duration-150 ${hoveredUI ? "opacity-100" : "opacity-0"}`}
        style={{ willChange: "transform" }}
      >
        {hoveredUI && <NeuronTooltip h={hoveredUI}/>}
      </div>

      <div
        className={`absolute inset-0 pointer-events-none transition-opacity duration-300 ${hoveredUI ? "opacity-100" : "opacity-0"}`}
        style={{ boxShadow: hoveredUI ? `inset 0 0 120px 0 ${hoveredUI.region.color}25, inset 0 0 0 1px ${hoveredUI.region.color}30` : "none" }}
      />

      <ControlCluster
        cinema={cinema}
        hudVisible={hudVisible}
        labelsOn={labelsOn}
        setHudVisible={setHudVisible}
        setLabelsOn={setLabelsOn}
        setCinema={setCinema}
        resetView={resetView}
      />
    </div>
  );
}

// ─── HUD Overlay ────────────────────────────────────────────────────
function HUDOverlay({
  regions, activeRegion, onFocus, onStartFocus, fps,
}: {
  regions: RegionData[];
  activeRegion: string | null;
  onFocus: (code: string) => void;
  onStartFocus: () => void;
  fps: number;
}) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Cálculos derivados do estado real (sem mock)
  const totalHours = regions.reduce((a, r) => a + r.hours, 0);
  const totalSessions7d = regions.reduce((a, r) => a + r.sessions7d, 0);
  const hasAnyActivity = totalHours > 0 || totalSessions7d > 0 || streak > 0;

  // Posições default — espaçadas pra não sobrepor em widescreen
  // Layout (left to right, top to bottom): session-top-left, agg-top-right,
  // regions-bottom-left, legend-bottom-right
  return (
    <>
      <CornerMire pos="top-left"/>
      <CornerMire pos="top-right"/>
      <CornerMire pos="bottom-left"/>
      <CornerMire pos="bottom-right"/>

      <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 pointer-events-none">
        <div className="w-1.5 h-1.5 rounded-full bg-success pulse-dot"/>
        <div className="eyebrow text-[#9DB7EF]">NEURAL MISSION · LIVE TELEMETRY</div>
        <div className="text-mute font-mono text-[10px] hidden md:inline">// REV 0.1 // OPERATOR: ASTRONAUT // CLUSTER: MC-PROD</div>
      </div>

      {/* PAINEL 1 — Sessão ativa (coluna esquerda · topo) */}
      <DraggablePanel id="session" defaultPos={{ x: 16, y: 16 }} width={280} title="SESSÃO ATIVA" eyebrowColor="#00D9A3">
        {hasAnyActivity ? (
          <>
            <div className="text-xs font-mono text-mute">CERT</div>
            <div className="text-xl font-bold tracking-tight text-glow-primary">—</div>
            <div className="text-xs text-ink/85 mt-1">Aguardando primeira sessão</div>
          </>
        ) : (
          <div className="py-2 text-center">
            <Icon name="circle-dot" size={20} className="text-mute mx-auto opacity-50"/>
            <div className="text-sm text-mute mt-2">Nenhuma sessão ativa</div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-mute/60 mt-1">
              Inicie um pomodoro pra registrar
            </div>
          </div>
        )}
        <button onClick={onStartFocus} className="btn btn-primary w-full mt-3 justify-center">
          <Icon name="play" size={14}/> Entrar em modo foco
        </button>
      </DraggablePanel>

      {/* PAINEL 2 — Telemetria agregada (coluna esquerda · meio) */}
      <DraggablePanel
        id="agg"
        defaultPos={{ x: 16, y: 220 }}
        width={280}
        title="TELEMETRIA AGREGADA"
      >
        <div className="flex items-center justify-end -mt-1 mb-2">
          <span className="text-[10px] font-mono text-mute">{fps} FPS</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Metric k="HORAS TOT" v={totalHours.toString()} color="primary"/>
          <Metric k="SEMANA"    v={`${weeklyHours}/${weeklyTarget}h`}/>
          <Metric k="STREAK"    v={`${streak}d`} color="accent"/>
          <Metric k="POMOS HJ"  v={`${pomodorosToday}/${pomodorosTodayTarget}`}/>
        </div>
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="flex items-center justify-between mb-1">
            <span className="eyebrow text-mute">SINAPSES / SEG</span>
            <span className="text-xs font-mono tabular text-mute">— · —</span>
          </div>
          <ECG t={tick}/>
        </div>
      </DraggablePanel>

      {/* PAINEL 3 — Regiões neurais (coluna esquerda · base) */}
      <DraggablePanel
        id="regions"
        defaultPos={{ x: 16, y: 440 }}
        width={300}
        title={`REGIÕES NEURAIS · ${regions.length}`}
      >
        <div className="space-y-1.5">
          {regions.map((r) => {
            const sel = activeRegion === r.code;
            return (
              <button
                key={r.code}
                onClick={() => onFocus(r.code)}
                className={`w-full flex items-center gap-3 px-2 py-1.5 rounded-md transition-all ${sel ? "bg-white/[0.06] ring-1" : "hover:bg-white/[0.03]"}`}
                style={sel ? { boxShadow: `inset 0 0 0 1px ${r.color}80, 0 0 18px ${r.color}55` } : {}}
              >
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: r.color, boxShadow: `0 0 10px ${r.color}` }}/>
                <span className="font-mono text-sm font-bold tabular w-12 text-left">{r.code}</span>
                <span className="flex-1 text-left text-[11px] text-mute truncate">{r.neurons.length} neur · {r.hours}h · {r.sessions7d}/sem</span>
                <span className="font-mono tabular text-xs" style={{ color: r.progress > 0 ? r.color : "#8892A6" }}>{r.progress}%</span>
                {r.active && <span className="text-[9px] font-mono text-accent">ACT</span>}
              </button>
            );
          })}
        </div>
      </DraggablePanel>

      {/* PAINEL 4 — Manual de leitura (canto inferior direito, acima dos controles) */}
      <DraggablePanel
        id="legend"
        defaultPos={{
          x: typeof window !== "undefined" ? Math.max(360, window.innerWidth - 290) : 1430,
          y: typeof window !== "undefined" ? Math.max(280, window.innerHeight - 360) : 540,
        }}
        width={270}
        title="MANUAL DE LEITURA"
      >
        <ul className="space-y-1 text-[11px] font-mono">
          <LegendRow swatch={<span className="w-3 h-3 rounded-full bg-primary"/>}                                       label="TAMANHO neurônio" val="← horas dedicadas"/>
          <LegendRow swatch={<span className="w-3 h-3 rounded-full ring-2 ring-primary/40 bg-primary/60"/>}            label="BRILHO região"   val="← % progresso da cert"/>
          <LegendRow swatch={<svg width="14" height="6"><line x1="0" y1="3" x2="14" y2="3" stroke="#326CE5" strokeWidth="3"/></svg>} label="ESPESSURA sinapse" val="← freq. 7 dias"/>
          <LegendRow swatch={<svg width="14" height="6"><circle cx="3" cy="3" r="2" fill="#00D9A3"/><circle cx="10" cy="3" r="1.5" fill="#00D9A3" opacity="0.4"/></svg>} label="VELOC. pulsos" val="← sessões 7 dias"/>
          <LegendRow swatch={<span className="w-3 h-3 rounded-full bg-accent pulse-dot"/>}                              label="GLOW extra"      val="← sessão < 24h"/>
          <LegendRow swatch={<span className="w-3 h-3 rounded-full bg-accent" style={{ boxShadow: "0 0 8px #FF6B35" }}/>} label="PARTÍCULAS"     val="← cert ativa agora"/>
        </ul>
      </DraggablePanel>
    </>
  );
}

function LegendRow({ swatch, label, val }: { swatch: React.ReactNode; label: string; val: string }) {
  return (
    <li className="flex items-center gap-2 leading-tight">
      <span className="w-4 flex items-center justify-center shrink-0">{swatch}</span>
      <span className="text-ink/85 w-[110px] truncate">{label}</span>
      <span className="text-mute flex-1 truncate">{val}</span>
    </li>
  );
}

function NeuronTooltip({ h }: { h: HoveredUI }) {
  const n = h.neuron, r = h.region;
  const c = r.color;
  const hoursTxt = n.hoursLogged > 0
    ? `${Math.floor(n.hoursLogged)}h ${Math.round((n.hoursLogged % 1) * 60)}min`
    : "—";
  const lastTxt = n.lastSessionDaysAgo === null
    ? "nunca"
    : n.lastSessionDaysAgo === 0 ? "hoje"
    : n.lastSessionDaysAgo === 1 ? "ontem"
    : `há ${n.lastSessionDaysAgo} dias`;
  const recent = n.lastSessionDaysAgo !== null && n.lastSessionDaysAgo <= 1;

  const sizeBucket  = n.hoursLogged > 12 ? "GRANDE" : n.hoursLogged > 5 ? "MÉDIO" : n.hoursLogged > 0 ? "PEQUENO" : "MÍNIMO";
  const glowBucket  = n.progress > 50 ? "ALTO" : n.progress > 20 ? "MÉDIO" : n.progress > 0 ? "BAIXO" : "APAGADO";
  const pulseBucket = n.sessionsLast7d > 4 ? "RÁPIDOS" : n.sessionsLast7d > 2 ? "MÉDIOS" : n.sessionsLast7d > 0 ? "LENTOS" : "PARADOS";

  return (
    <div className="panel brackets backdrop-blur-md bg-bg/85 w-[340px]" style={{ boxShadow: `0 0 0 1px ${c}40, 0 12px 40px ${c}30` }}>
      <div className="px-4 pt-3 pb-2 border-b border-border/70 flex items-center gap-2">
        <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c, boxShadow: `0 0 10px ${c}` }}/>
        <span className="eyebrow" style={{ color: c }}>NEURÔNIO · {r.code}</span>
        <span className="ml-auto text-[10px] font-mono text-mute">peso {n.weight}%</span>
      </div>
      <div className="px-4 pt-2 pb-3">
        <div className="text-base font-semibold leading-tight">{n.name}</div>
        <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[12px] font-mono">
          <Row k="Progresso"     v={`${n.progress}%`}/>
          <Row k="Horas"         v={hoursTxt}/>
          <Row k="Pomodoros"     v={String(n.pomodoroCount || "—")}/>
          <Row k="Sessões / 7d"  v={String(n.sessionsLast7d || "—")}/>
          <Row k="Última sessão" v={lastTxt} highlight={recent}/>
        </div>
        <div className="h-1.5 mt-3 rounded-full bg-white/[0.05] overflow-hidden">
          <div className="h-full rounded-full transition-all" style={{ width: `${n.progress}%`, background: c, boxShadow: `0 0 10px ${c}` }}/>
        </div>
        <div className="mt-3 pt-3 border-t border-border/60">
          <div className="eyebrow text-mute mb-1.5">// POR ISSO ESTE NEURÔNIO</div>
          <ul className="space-y-1 text-[11px] font-mono text-ink/85 leading-tight">
            <li>• tamanho <span className="text-ink font-semibold">{sizeBucket}</span> <span className="text-mute">({hoursTxt})</span></li>
            <li>• brilho <span className="text-ink font-semibold">{glowBucket}</span> <span className="text-mute">({n.progress}%)</span></li>
            <li>• pulsos <span className="text-ink font-semibold">{pulseBucket}</span> <span className="text-mute">({n.sessionsLast7d || 0} sessões/7d)</span></li>
            {recent && <li>• <span className="text-accent font-semibold">glow extra</span> <span className="text-mute">(sessão recente)</span></li>}
          </ul>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, highlight }: { k: string; v: string; highlight?: boolean }) {
  return (
    <>
      <span className="text-mute">{k}</span>
      <span className={`tabular text-right font-semibold ${highlight ? "text-success" : "text-ink"}`}>{v}</span>
    </>
  );
}

function ControlCluster({
  cinema, hudVisible, labelsOn, setHudVisible, setLabelsOn, setCinema, resetView,
}: {
  cinema: boolean;
  hudVisible: boolean;
  labelsOn: boolean;
  setHudVisible: (v: boolean | ((prev: boolean) => boolean)) => void;
  setLabelsOn:   (v: boolean | ((prev: boolean) => boolean)) => void;
  setCinema:     (v: boolean | ((prev: boolean) => boolean)) => void;
  resetView: () => void;
}) {
  if (cinema) {
    return (
      <div className="absolute top-5 right-5 z-50 flex items-center gap-2 pointer-events-auto">
        <span className="text-[10px] font-mono uppercase tracking-wider text-mute backdrop-blur-md bg-bg/40 px-2 py-1 rounded">F · ESC · sair</span>
        <button onClick={() => setCinema(false)} className="btn btn-ghost backdrop-blur-md bg-bg/50" title="Sair do modo cinema (F / Esc)">
          <Icon name="minimize-2" size={14}/>
        </button>
      </div>
    );
  }
  const resetHuds = () => {
    resetHudPositions();
    window.dispatchEvent(new Event("mc:hud-reset"));
  };
  return (
    <div className="absolute bottom-5 right-5 z-40 flex flex-col items-end gap-2">
      <div className="flex gap-2 flex-wrap justify-end">
        <button onClick={resetView} className="btn btn-ghost backdrop-blur-md" title="Reset view do cérebro">
          <Icon name="rotate-ccw" size={13}/>
        </button>
        <button onClick={resetHuds} className="btn btn-ghost backdrop-blur-md" title="Resetar posição dos painéis HUD">
          <Icon name="panels-top-left" size={13}/> Reset HUDs
        </button>
        <ToggleChip on={hudVisible} onClick={() => setHudVisible((v) => !v)} icon="panels-top-left" label="HUD"    kb="H"/>
        <ToggleChip on={labelsOn}   onClick={() => setLabelsOn((v) => !v)}   icon="tags"            label="Labels" kb="L"/>
        <button onClick={() => setCinema(true)} className="btn btn-primary backdrop-blur-md" title="Modo cinema — esconde tudo (F · Space)">
          <Icon name="film" size={14}/> Cinema
        </button>
      </div>
      <div className="panel-flat px-3 py-2 backdrop-blur-md bg-bg/60 text-[10px] font-mono text-mute flex items-center gap-3 flex-wrap justify-end">
        <span>DRAG CÉREBRO → ROT</span><span className="text-border">·</span>
        <span>DRAG PAINEL → MOVER</span><span className="text-border">·</span>
        <span>SCROLL → ZOOM</span><span className="text-border">·</span>
        <span>H · L · F</span>
      </div>
    </div>
  );
}

function ToggleChip({
  on, onClick, icon, label, kb,
}: { on: boolean; onClick: () => void; icon: string; label: string; kb: string }) {
  return (
    <button onClick={onClick} className={`btn backdrop-blur-md ${on ? "btn-primary" : "btn-ghost"}`} title={`Toggle ${label} (${kb})`}>
      <Icon name={icon} size={13}/> {label}
      <kbd className={`text-[9px] font-mono px-1 ml-1 rounded ${on ? "bg-white/20" : "bg-white/[0.06]"}`}>{kb}</kbd>
    </button>
  );
}

function Metric({ k, v, color }: { k: string; v: string; color?: "primary" | "accent" | "success" }) {
  const tc = color === "primary" ? "text-[#9DB7EF]"
           : color === "accent"  ? "text-accent"
           : color === "success" ? "text-success"
           : "text-ink";
  return (
    <div className="rounded-md bg-white/[0.025] border border-border/70 px-2 py-1.5">
      <div className="text-[9px] font-mono uppercase tracking-wider text-mute">{k}</div>
      <div className={`font-mono tabular text-sm font-semibold mt-0.5 ${tc}`}>{v}</div>
    </div>
  );
}

function CornerMire({ pos }: { pos: "top-left" | "top-right" | "bottom-left" | "bottom-right" }) {
  const map = {
    "top-left":     "top-3 left-3",
    "top-right":    "top-3 right-3",
    "bottom-left":  "bottom-3 left-3",
    "bottom-right": "bottom-3 right-3",
  };
  const rotation = {
    "top-left":     "",
    "top-right":    "rotate-90",
    "bottom-right": "rotate-180",
    "bottom-left":  "-rotate-90",
  };
  return (
    <div className={`absolute ${map[pos]} z-20 pointer-events-none flicker`}>
      <svg width="44" height="44" viewBox="0 0 44 44" className={rotation[pos]}>
        <path d="M2 14 V2 H14" stroke="#326CE5" strokeWidth="1.5" fill="none"/>
        <path d="M6 18 V6 H18" stroke="#326CE5" strokeWidth="0.7" fill="none" opacity="0.5"/>
        <circle cx="3" cy="3" r="1.5" fill="#326CE5"/>
      </svg>
    </div>
  );
}

function ECG({ t }: { t: number }) {
  const W = 268, H = 36;
  const N = 80;
  const pts: string[] = [];
  for (let i = 0; i < N; i++) {
    const x = (i / (N - 1)) * W;
    const phase = i - ((t * 6) % N);
    let y = H / 2 + Math.sin(i * 0.35 + t * 0.1) * 3;
    const pp = ((phase % 22) + 22) % 22;
    if (pp < 1) y -= 12;
    else if (pp < 2) y += 10;
    else if (pp < 3) y -= 4;
    pts.push(`${x},${y.toFixed(1)}`);
  }
  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="block">
      <polyline points={pts.join(" ")} stroke="#00D9A3" strokeWidth="1.4" fill="none" opacity="0.9" style={{ filter: "drop-shadow(0 0 4px rgba(0,217,163,0.8))" }}/>
    </svg>
  );
}

// ─── helpers ────────────────────────────────────────────────────────
function makeHaloTexture(size: number, hard = 0.2): THREE.CanvasTexture {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const ctx = c.getContext("2d")!;
  const g = ctx.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
  g.addColorStop(0,   "rgba(255,255,255,1)");
  g.addColorStop(hard, "rgba(255,255,255,0.6)");
  g.addColorStop(0.5, "rgba(255,255,255,0.18)");
  g.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeLabelTexture(text: string, color: string): THREE.CanvasTexture {
  const W = 512, H = 160;
  const c = document.createElement("canvas");
  c.width = W; c.height = H;
  const ctx = c.getContext("2d")!;
  ctx.clearRect(0, 0, W, H);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(20, 30);  ctx.lineTo(20, H - 30);
  ctx.moveTo(20, 30);  ctx.lineTo(40, 30);
  ctx.moveTo(20, H-30); ctx.lineTo(40, H-30);
  ctx.moveTo(W-20, 30); ctx.lineTo(W-20, H-30);
  ctx.moveTo(W-20, 30); ctx.lineTo(W-40, 30);
  ctx.moveTo(W-20, H-30); ctx.lineTo(W-40, H-30);
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = color;
  ctx.font = 'bold 92px "JetBrains Mono", "Courier New", monospace';
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = color;
  ctx.shadowBlur = 18;
  ctx.fillText(text, W / 2, H / 2 + 4);
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#9DB7EF";
  ctx.globalAlpha = 0.7;
  ctx.font = '500 22px "JetBrains Mono", "Courier New", monospace';
  ctx.fillText("CNCF · KUBERNETES", W / 2, H - 22);
  const tex = new THREE.CanvasTexture(c);
  tex.needsUpdate = true;
  return tex;
}

function makeSynapse(a: THREE.Vector3, b: THREE.Vector3, color: string, strength: number, region: number, inter: boolean) {
  const mid = a.clone().lerp(b, 0.5);
  const dir = b.clone().sub(a);
  let up = new THREE.Vector3(0, 1, 0);
  if (Math.abs(dir.clone().normalize().dot(up)) > 0.95) up = new THREE.Vector3(1, 0, 0);
  const perp = new THREE.Vector3().crossVectors(dir, up).normalize();
  const bulge = dir.length() * (inter ? 0.18 : 0.12);
  mid.add(perp.multiplyScalar(bulge));
  const curve = new THREE.QuadraticBezierCurve3(a.clone(), mid, b.clone());
  return { a, b, curve, color, strength, region, inter };
}

function pickSynapse(synapses: any[], regions: RegionData[]) {
  for (let i = 0; i < 6; i++) {
    const s = synapses[Math.floor(Math.random() * synapses.length)];
    if (s.region >= 0 && regions[s.region].active) return s;
    if (Math.random() < 0.35) return s;
  }
  return synapses[Math.floor(Math.random() * synapses.length)];
}

function mkRng(seed: number) {
  let s = seed || 1;
  return () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
}

function mixColor(a: string, b: string): string {
  const ca = new THREE.Color(a), cb = new THREE.Color(b);
  return `rgb(${Math.round((ca.r + cb.r) * 127)}, ${Math.round((ca.g + cb.g) * 127)}, ${Math.round((ca.b + cb.b) * 127)})`;
}
