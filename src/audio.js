/* =====================================================================
   Sound: soft wind, a quiet propeller hum, gentle rain and duck voices,
   synthesized with the Web Audio API. Nothing is created until the
   listener turns sound on.
   ===================================================================== */
const Sound = (() => {
  let ac = null, master = null, windGain, windBP, humGain, humF, osc1, osc2, lfo, lfoGain, rainGain, noise = null;
  let enabled = false, paused = false;
  const LEVEL = 0.8;

  function makeNoise(sec) {
    const len = Math.floor(ac.sampleRate * sec), buf = ac.createBuffer(1, len, ac.sampleRate), d = buf.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.99765 * b0 + w * 0.099046; b1 = 0.963 * b1 + w * 0.2965164; b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.16;
    }
    const fade = Math.floor(ac.sampleRate * 0.05);
    for (let i = 0; i < fade; i++) { const k = i / fade; d[i] *= k; d[len - 1 - i] *= k; }
    return buf;
  }
  function init() {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return false;
    try { ac = new AC(); } catch (e) { return false; }
    const comp = ac.createDynamicsCompressor();
    comp.threshold.value = -16; comp.ratio.value = 3;
    master = ac.createGain(); master.gain.value = 0;
    master.connect(comp); comp.connect(ac.destination);
    noise = makeNoise(4);
    const wsrc = ac.createBufferSource(); wsrc.buffer = noise; wsrc.loop = true;
    windBP = ac.createBiquadFilter(); windBP.type = 'bandpass'; windBP.frequency.value = 480; windBP.Q.value = 0.55;
    const wlp = ac.createBiquadFilter(); wlp.type = 'lowpass'; wlp.frequency.value = 1500;
    windGain = ac.createGain(); windGain.gain.value = 0;
    wsrc.connect(windBP); windBP.connect(wlp); wlp.connect(windGain); windGain.connect(master);
    wsrc.start();
    osc1 = ac.createOscillator(); osc1.type = 'sawtooth'; osc1.frequency.value = 70;
    osc2 = ac.createOscillator(); osc2.type = 'triangle'; osc2.frequency.value = 141.3;
    humF = ac.createBiquadFilter(); humF.type = 'lowpass'; humF.frequency.value = 300; humF.Q.value = 0.7;
    humGain = ac.createGain(); humGain.gain.value = 0;
    lfo = ac.createOscillator(); lfo.type = 'sine'; lfo.frequency.value = 18;
    lfoGain = ac.createGain(); lfoGain.gain.value = 0;
    lfo.connect(lfoGain); lfoGain.connect(humGain.gain);
    const half = ac.createGain(); half.gain.value = 0.5;
    osc1.connect(humF); osc2.connect(half); half.connect(humF); humF.connect(humGain); humGain.connect(master);
    osc1.start(); osc2.start(); lfo.start();
    const rsrc = ac.createBufferSource(); rsrc.buffer = noise; rsrc.loop = true;
    const rhp = ac.createBiquadFilter(); rhp.type = 'highpass'; rhp.frequency.value = 1300;
    const rlp = ac.createBiquadFilter(); rlp.type = 'lowpass'; rlp.frequency.value = 6500;
    rainGain = ac.createGain(); rainGain.gain.value = 0;
    rsrc.connect(rhp); rhp.connect(rlp); rlp.connect(rainGain); rainGain.connect(master);
    rsrc.start(0, 1.7);
    return true;
  }
  function target() { return enabled && !paused ? LEVEL : 0; }
  function apply() {
    if (!ac) return;
    const now = ac.currentTime, g = target();
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(g, now, g > 0 ? 0.45 : 0.12);
    if (g > 0 && ac.state !== 'running') ac.resume().catch(() => {});
  }
  return {
    get enabled() { return enabled; },
    available() { return !!(window.AudioContext || window.webkitAudioContext); },
    setEnabled(on) {
      if (on && !ac && !init()) return false;
      enabled = on;
      apply();
      if (!on && ac) setTimeout(() => { if (!enabled && ac && ac.state === 'running') ac.suspend().catch(() => {}); }, 900);
      return true;
    },
    setPaused(p) { paused = p; apply(); },
    suspendForHidden(hidden) {
      if (!ac) return;
      if (hidden) ac.suspend().catch(() => {});
      else if (enabled && !paused) ac.resume().catch(() => {});
    },
    tick(t, speed, rain) {
      if (!ac || !enabled || paused) return;
      const now = ac.currentTime;
      const gust = 0.72 + 0.32 * vnoise(t * 0.21) + 0.14 * vnoise(t * 0.83 + 4);
      windGain.gain.setTargetAtTime((0.05 + 0.065 * Math.min(speed, 2.5)) * gust, now, 0.45);
      windBP.frequency.setTargetAtTime(320 + 200 * speed + 150 * vnoise(t * 0.31 + 2), now, 0.5);
      const f = 56 + 22 * speed;
      osc1.frequency.setTargetAtTime(f, now, 0.6); osc2.frequency.setTargetAtTime(f * 2 + 1.3, now, 0.6);
      lfo.frequency.setTargetAtTime(10 + 9 * speed, now, 0.6);
      humGain.gain.setTargetAtTime(0.02 + 0.007 * speed, now, 0.5);
      lfoGain.gain.setTargetAtTime(0.008, now, 0.5);
      rainGain.gain.setTargetAtTime(rain * 0.075, now, 0.8);
    },
    quack(voice, vol) {
      if (!ac || !enabled || paused) return;
      vol = vol === undefined ? 1 : vol;
      const t0 = ac.currentTime + 0.01;
      if (voice > 1.4) {
        for (let i = 0; i < 2; i++) {
          const o = ac.createOscillator(), g = ac.createGain(), s = t0 + i * 0.12;
          o.type = 'triangle';
          o.frequency.setValueAtTime(1500, s); o.frequency.exponentialRampToValueAtTime(2300, s + 0.07);
          g.gain.setValueAtTime(0.0001, s); g.gain.exponentialRampToValueAtTime(0.12 * vol, s + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, s + 0.09);
          o.connect(g); g.connect(master); o.start(s); o.stop(s + 0.1);
        }
        return;
      }
      const f0 = 480 * voice;
      const o = ac.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(f0 * 1.18, t0); o.frequency.exponentialRampToValueAtTime(f0 * 0.8, t0 + 0.15);
      const vib = ac.createOscillator(), vg = ac.createGain();
      vib.frequency.value = 36; vg.gain.value = 26 * voice;
      vib.connect(vg); vg.connect(o.frequency);
      const f1 = ac.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 1050 * Math.sqrt(voice); f1.Q.value = 3.5;
      const f2 = ac.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 2500 * Math.sqrt(voice); f2.Q.value = 5;
      const g = ac.createGain(), g2 = ac.createGain();
      g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.34 * vol, t0 + 0.018); g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.19);
      g2.gain.value = 0.35;
      o.connect(f1); f1.connect(g); o.connect(f2); f2.connect(g2); g2.connect(g); g.connect(master);
      o.start(t0); o.stop(t0 + 0.22); vib.start(t0); vib.stop(t0 + 0.22);
    },
    shutter() {
      if (!ac || !enabled || paused || !noise) return;
      const t0 = ac.currentTime + 0.01;
      for (const [dt, a] of [[0, 0.22], [0.07, 0.14]]) {
        const s = ac.createBufferSource(); s.buffer = noise;
        const hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 2500;
        const g = ac.createGain();
        g.gain.setValueAtTime(a, t0 + dt); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.035);
        s.connect(hp); hp.connect(g); g.connect(master);
        s.start(t0 + dt, Math.random() * 2, 0.05);
      }
    },
  };
})();
