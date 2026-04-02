"use client";
import React, { useRef, useEffect } from "react";
import { motion, type Variants } from "framer-motion";

// ─── WebGL Lightning ────────────────────────────────────────────────────────
interface LightningProps {
  hue?: number;
  xOffset?: number;
  speed?: number;
  intensity?: number;
  size?: number;
}

export const Lightning: React.FC<LightningProps> = ({
  hue = 40,
  xOffset = 0,
  speed = 1,
  intensity = 1,
  size = 1,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = canvas.clientWidth;
      canvas.height = canvas.clientHeight;
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const gl = canvas.getContext("webgl");
    if (!gl) return;

    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() { gl_Position = vec4(aPosition, 0.0, 1.0); }
    `;

    const fragmentShaderSource = `
      precision mediump float;
      uniform vec2 iResolution;
      uniform float iTime;
      uniform float uHue;
      uniform float uXOffset;
      uniform float uSpeed;
      uniform float uIntensity;
      uniform float uSize;
      #define OCTAVE_COUNT 10

      vec3 hsv2rgb(vec3 c) {
        vec3 rgb = clamp(abs(mod(c.x*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0,0.0,1.0);
        return c.z * mix(vec3(1.0), rgb, c.y);
      }
      float hash11(float p) { p=fract(p*.1031); p*=p+33.33; p*=p+p; return fract(p); }
      float hash12(vec2 p) {
        vec3 p3=fract(vec3(p.xyx)*.1031);
        p3+=dot(p3,p3.yzx+33.33);
        return fract((p3.x+p3.y)*p3.z);
      }
      mat2 rotate2d(float t) { float c=cos(t),s=sin(t); return mat2(c,-s,s,c); }
      float noise(vec2 p) {
        vec2 ip=floor(p),fp=fract(p);
        float a=hash12(ip),b=hash12(ip+vec2(1,0)),c=hash12(ip+vec2(0,1)),d=hash12(ip+vec2(1,1));
        vec2 t=smoothstep(0.0,1.0,fp);
        return mix(mix(a,b,t.x),mix(c,d,t.x),t.y);
      }
      float fbm(vec2 p) {
        float v=0.0,a=0.5;
        for(int i=0;i<OCTAVE_COUNT;++i){ v+=a*noise(p); p*=rotate2d(0.45); p*=2.0; a*=0.5; }
        return v;
      }
      void mainImage(out vec4 fragColor, in vec2 fragCoord) {
        vec2 uv = fragCoord/iResolution.xy;
        uv = 2.0*uv - 1.0;
        uv.x *= iResolution.x/iResolution.y;
        uv.x += uXOffset;
        uv += 2.0*fbm(uv*uSize+0.8*iTime*uSpeed)-1.0;
        float dist = abs(uv.x);
        vec3 baseColor = hsv2rgb(vec3(uHue/360.0, 0.7, 0.9));
        vec3 col = baseColor * pow(mix(0.0,0.07,hash11(iTime*uSpeed))/dist, 1.0) * uIntensity;
        fragColor = vec4(col, 1.0);
      }
      void main() { mainImage(gl_FragColor, gl_FragCoord.xy); }
    `;

    const compile = (src: string, type: number) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const vs = compile(vertexShaderSource, gl.VERTEX_SHADER);
    const fs = compile(fragmentShaderSource, gl.FRAGMENT_SHADER);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const verts = new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
    const aPosLoc = gl.getAttribLocation(prog, "aPosition");
    gl.enableVertexAttribArray(aPosLoc);
    gl.vertexAttribPointer(aPosLoc, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "iResolution");
    const uTime = gl.getUniformLocation(prog, "iTime");
    const uHueLoc = gl.getUniformLocation(prog, "uHue");
    const uXOff = gl.getUniformLocation(prog, "uXOffset");
    const uSpd = gl.getUniformLocation(prog, "uSpeed");
    const uIntens = gl.getUniformLocation(prog, "uIntensity");
    const uSz = gl.getUniformLocation(prog, "uSize");

    const t0 = performance.now();
    let rafId: number;
    const render = () => {
      resizeCanvas();
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uTime, (performance.now() - t0) / 1000.0);
      gl.uniform1f(uHueLoc, hue);
      gl.uniform1f(uXOff, xOffset);
      gl.uniform1f(uSpd, speed);
      gl.uniform1f(uIntens, intensity);
      gl.uniform1f(uSz, size);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [hue, xOffset, speed, intensity, size]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// ─── Feature Stat Item ──────────────────────────────────────────────────────
interface StatItemProps {
  label: string;
  value: string;
  position: string;
}

const StatItem: React.FC<StatItemProps> = ({ label, value, position }) => (
  <div className={`absolute ${position} z-10 group transition-all duration-300 hover:scale-110 hidden lg:block`}>
    <div className="flex items-center gap-3">
      <div className="relative">
        <div className="w-2.5 h-2.5 bg-[#ffaa00] rounded-full group-hover:shadow-[0_0_15px_#ffaa00]" />
        <div className="absolute -inset-1.5 bg-[#ffaa00]/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="text-white flex flex-col text-left">
        <span className="font-black uppercase tracking-tighter text-2xl text-[#ffaa00] leading-none">{value}</span>
        <span className="text-white/40 text-[9px] font-black uppercase tracking-[0.2em] mt-0.5">{label}</span>
      </div>
    </div>
  </div>
);

// ─── Main Hero ───────────────────────────────────────────────────────────────
interface HallOfFameHeroProps {
  totalChampions?: number;
  totalTournaments?: number;
  translations: {
    title: string;
    subtitle: string;
    allTimeChampions: string;
    tournamentsPlayed: string;
    realTimeBrackets: string;
    engine: string;
  };
}

export const HallOfFameHero: React.FC<HallOfFameHeroProps> = ({
  totalChampions = 0,
  totalTournaments = 0,
  translations,
}) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.25, delayChildren: 0.1 } },
  };
  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { duration: 0.5, ease: "easeOut" as const } },
  };

  return (
    <div className="relative w-full bg-black text-white overflow-hidden h-[65vh] min-h-[550px] lg:min-h-[600px]">

      {/* Background WebGL Lightning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.2 }}
        className="absolute inset-0 z-0"
      >
        {/* Dark base */}
        <div className="absolute inset-0 bg-black/70" />
        {/* Gold glow blob */}
        <div className="absolute top-[55%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gradient-to-b from-[#ffaa00]/15 to-[#ff5500]/5 blur-3xl" />
        {/* Lightning — gold hue ~40 */}
        <div className="absolute inset-0">
          <Lightning hue={40} xOffset={0} speed={1.4} intensity={0.55} size={2.2} />
        </div>
        {/* Sphere */}
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle_at_25%_90%,_#3a2500_10%,_#000000cc_60%,_#000000f0_100%)] backdrop-blur-3xl" />
        {/* Top fade */}
        <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black to-transparent" />
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent" />
      </motion.div>

      {/* Floating stats (Desktop Only) */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <StatItem label={translations.allTimeChampions} value={`${totalChampions}`} position="left-[10%] top-[35%]" />
        <StatItem label={translations.tournamentsPlayed} value={`${totalTournaments}`} position="left-[22%] top-[18%]" />
        <StatItem label={translations.realTimeBrackets} value="LIVE" position="right-[22%] top-[18%]" />
        <StatItem label={translations.engine} value="MESSIAS" position="right-[10%] top-[35%]" />
      </motion.div>

      {/* Center text */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-30 flex flex-col items-center justify-center text-center h-full px-6 pt-24 md:pt-28"
      >
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-2 px-4 py-1.5 bg-[#ffaa00]/10 border border-[#ffaa00]/20 rounded-full text-[10px] font-black uppercase tracking-[0.3em] text-[#ffaa00] mb-10 shadow-[0_0_20px_rgba(255,170,0,0.1)]"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#ffaa00] animate-pulse" />
          Spicy Community
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="text-6xl md:text-8xl lg:text-9xl font-black italic uppercase tracking-tighter leading-[0.8] mb-6 gradient-text-luxury"
          style={{ textShadow: "0 0 80px rgba(255,170,0,0.3)" }}
        >
          {translations.title}
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="text-white/40 text-sm md:text-base font-medium max-w-sm mb-10"
        >
          {translations.subtitle}
        </motion.p>

        {/* Mobile Stats Grid */}
        <motion.div 
          variants={itemVariants}
          className="grid grid-cols-2 gap-3 w-full max-w-xs lg:hidden mt-4"
        >
          {[
            { label: translations.allTimeChampions, value: totalChampions },
            { label: translations.tournamentsPlayed, value: totalTournaments },
            { label: translations.realTimeBrackets, value: "LIVE" },
            { label: translations.engine, value: "MESSIAS" }
          ].map((stat, i) => (
            <div key={i} className="flex flex-col items-center p-4 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md">
              <span className="text-2xl font-black text-[#ffaa00] leading-none mb-1">{stat.value}</span>
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 text-center leading-tight">{stat.label}</span>
            </div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
};
