const arena = document.getElementById("arena");
const noBtn  = document.getElementById("noBtn");
const yesBtn = document.getElementById("yesBtn");
const result = document.getElementById("result");

const canvas = document.getElementById("confettiCanvas");
const ctx = canvas.getContext("2d", { alpha: true });

noBtn.disabled = true; // sécurité

function clamp(n, min, max){ return Math.max(min, Math.min(max, n)); }

function resizeCanvas(){
  const dpr = Math.max(1, window.devicePixelRatio || 1);
  canvas.width  = Math.floor(window.innerWidth  * dpr);
  canvas.height = Math.floor(window.innerHeight * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // dessine en CSS pixels
}
resizeCanvas();

function moveNoButtonAway(fromX, fromY){
  const a = arena.getBoundingClientRect();
  const b = noBtn.getBoundingClientRect();

  const padding = 12;
  const maxLeft = a.width  - b.width  - padding;
  const maxTop  = a.height - b.height - padding;

  let best = null;
  for(let i=0;i<12;i++){
    const x = padding + Math.random() * Math.max(0, maxLeft - padding);
    const y = padding + Math.random() * Math.max(0, maxTop  - padding);

    const cx = a.left + x + b.width/2;
    const cy = a.top  + y + b.height/2;

    const dx = cx - fromX;
    const dy = cy - fromY;
    const dist2 = dx*dx + dy*dy;

    if(!best || dist2 > best.dist2) best = {x,y,dist2};
  }

  noBtn.style.left = clamp(best.x, padding, Math.max(padding, maxLeft)) + "px";
  noBtn.style.top  = clamp(best.y, padding, Math.max(padding, maxTop))  + "px";
}

function handleProximity(clientX, clientY){
  const b = noBtn.getBoundingClientRect();
  const cx = b.left + b.width/2;
  const cy = b.top  + b.height/2;
  const d = Math.hypot(clientX - cx, clientY - cy);

  const isTouch = matchMedia("(pointer: coarse)").matches;
  const panicRadius = isTouch ? 140 : 110;

  if(d < panicRadius){
    moveNoButtonAway(clientX, clientY);
  }
}

// pointer events (mobile + desktop)
arena.addEventListener("pointermove", (e) => handleProximity(e.clientX, e.clientY), { passive:true });
arena.addEventListener("pointerdown", (e) => handleProximity(e.clientX, e.clientY), { passive:true });

// Position initiale du "Non"
requestAnimationFrame(() => {
  moveNoButtonAway(window.innerWidth/2, window.innerHeight/2);
});

// Conserver dans l’arène au resize/orientation change
window.addEventListener("resize", () => {
  resizeCanvas();

  const a = arena.getBoundingClientRect();
  const b = noBtn.getBoundingClientRect();
  const padding = 12;

  const left = parseFloat(noBtn.style.left || "0");
  const top  = parseFloat(noBtn.style.top  || "0");

  const maxLeft = a.width  - b.width  - padding;
  const maxTop  = a.height - b.height - padding;

  noBtn.style.left = clamp(left, padding, Math.max(padding, maxLeft)) + "px";
  noBtn.style.top  = clamp(top,  padding, Math.max(padding, maxTop))  + "px";
});

// --------------------
// Confettis (canvas)
// --------------------
let confetti = [];
let animId = null;

function rand(min, max){ return min + Math.random() * (max - min); }

function launchConfettiBurst(){
  const w = window.innerWidth;
  const count = 180;

  confetti = [];
  for(let i=0;i<count;i++){
    confetti.push({
      x: rand(w * 0.2, w * 0.8),
      y: -20,
      vx: rand(-3.5, 3.5),
      vy: rand(6, 12),
      g: rand(0.12, 0.22),
      size: rand(6, 12),
      rot: rand(0, Math.PI * 2),
      vr: rand(-0.25, 0.25),
      // couleur aléatoire (pas besoin de définir un thème)
      color: `hsl(${Math.floor(rand(0, 360))} 90% 60%)`,
      life: rand(120, 220), // frames
      shape: Math.random() < 0.5 ? "rect" : "circle"
    });
  }

  if(animId) cancelAnimationFrame(animId);
  tick();
}

function tick(){
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  // dessiner & simuler
  for(const p of confetti){
    p.x += p.vx;
    p.y += p.vy;
    p.vy += p.g;
    p.rot += p.vr;
    p.life -= 1;

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot);
    ctx.fillStyle = p.color;

    if(p.shape === "rect"){
      ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size * 0.6);
    } else {
      ctx.beginPath();
      ctx.arc(0, 0, p.size/2, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // filtrer ceux encore vivants et à l'écran
  confetti = confetti.filter(p => p.life > 0 && p.y < window.innerHeight + 80);

  if(confetti.length > 0){
    animId = requestAnimationFrame(tick);
  } else {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    animId = null;
  }
}

// OUI => message + confettis
yesBtn.addEventListener("click", () => {
  result.classList.add("show");
  launchConfettiBurst();

  // optionnel: on verrouille après réponse
  yesBtn.disabled = true;
  yesBtn.style.opacity = "0.85";
  yesBtn.style.filter = "saturate(0.95)";
});
