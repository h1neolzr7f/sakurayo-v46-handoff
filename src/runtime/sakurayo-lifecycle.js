(function (global) {
  "use strict";

  var VERSION = "4.6.0";
  var TAU = Math.PI * 2;
  var EARLY_WINDOW = 20;
  var EARLY_INTERVAL = 0.45;
  var EARLY_FLOOR = 8;
  var cacheKey = "";
  var cacheObs = [];
  var fillAcc = 0;
  var echo = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
  var echoAt = 0;
  var echoCount = 0;
  var echoNext = 0;
  var echoKey = "";
  var groundPattern = null;
  var groundPatternImage = null;
  var groundPatternContext = null;
  var palettes = [
    ["#1a1028", "#0c1424", "#ff6fb0", "torii", "石板参道"],
    ["#0c1730", "#061018", "#5ad2ff", "neon", "雨夜沥青"],
    ["#16141c", "#0b0a10", "#c9bdd8", "swords", "剑冢参道"],
    ["#14102a", "#070614", "#c79bff", "mirror", "碎镜地砖"],
  ];

  function clamp(v, a, b) {
    return v < a ? a : v > b ? b : v;
  }

  function earlyCh1(world) {
    return !!(
      world &&
      !world.mainGod &&
      !world.bossBorn &&
      (world.stageId | 0) === 1 &&
      (world.runTime || 0) < EARLY_WINDOW
    );
  }

  function groundId(world) {
    if (world && world.mainGod) return "maingod";
    var id = world ? world.stageId | 0 : 1;
    return id === 2 ? "neon" : id === 3 ? "swords" : id === 4 ? "mirror" : "torii";
  }

  function stageProfile(stageId, opts) {
    var mainGod = !!(opts && opts.mainGod);
    var floor = (opts && opts.floor) || 0;
    var id = mainGod ? 0 : clamp(stageId | 0, 1, 4);
    var row = palettes[id ? id - 1 : 3];
    var hue = mainGod ? ((Math.floor(Math.max(0, floor - 1) / 3) % 4) * 18) : 0;
    return {
      stageId: id || 4,
      mainGod: mainGod,
      floor: floor,
      ground: row[3],
      label: mainGod ? "轮回回廊" : row[4],
      top: row[0],
      bottom: row[1],
      accent: row[2],
      hue: hue,
      waveNoun: id === 2 ? "雨街尸潮" : id === 3 ? "剑冢尸潮" : id === 4 || mainGod ? "镜核压境" : "参道尸潮",
    };
  }

  function obsKey(world) {
    return [
      world.mainGod ? "g" : "s",
      world.stageId | 0,
      world.floor | 0,
      world.W | 0,
      world.H | 0,
      world.cols | 0,
      world.rows | 0,
      world.worldW | 0,
    ].join(":");
  }

  function makeObs(world) {
    var W = world.W || 430,
      H = world.H || 932,
      cols = world.cols > 0 ? world.cols | 0 : 1,
      rows = world.rows > 0 ? world.rows | 0 : 1,
      id = groundId(world),
      list = [];
    function addChunk(ox, oy) {
      if (id === "torii") {
        list.push({ kind: "torii", x: ox + W * 0.22, y: oy + H * 0.36, r: 15, block: "bullet" });
        list.push({ kind: "torii", x: ox + W * 0.78, y: oy + H * 0.4, r: 15, block: "bullet" });
        list.push({ kind: "torii", x: ox + W * 0.5, y: oy + H * 0.66, r: 16, block: "bullet" });
      } else if (id === "neon") {
        list.push({ kind: "vehicle", x: ox + W * 0.18, y: oy + H * 0.48, w: 52, h: 28, block: "both" });
        list.push({ kind: "vehicle", x: ox + W * 0.7, y: oy + H * 0.62, w: 58, h: 26, block: "both" });
      } else if (id === "swords") {
        list.push({ kind: "sword", x: ox + W * 0.32, y: oy + H * 0.42, r: 72, slow: 0.78, melee: 1.18 });
        list.push({ kind: "sword", x: ox + W * 0.68, y: oy + H * 0.6, r: 64, slow: 0.78, melee: 1.18 });
      } else if (id === "mirror") {
        list.push({ kind: "mirror", x: ox + W * 0.28, y: oy + H * 0.38, w: 10, h: 78, bounce: "x" });
        list.push({ kind: "mirror", x: ox + W * 0.74, y: oy + H * 0.58, w: 10, h: 72, bounce: "x" });
      }
    }
    var r, c;
    for (r = 0; r < rows; r++) {
      for (c = 0; c < cols; c++) addChunk(c * W, r * H);
    }
    return list;
  }

  function obstacles(world) {
    var key = obsKey(world);
    if (key !== cacheKey) {
      cacheKey = key;
      cacheObs = makeObs(world);
    }
    return cacheObs;
  }

  function circleHit(x, y, r, ox, oy, or) {
    var dx = x - ox,
      dy = y - oy;
    return dx * dx + dy * dy < (r + or) * (r + or);
  }

  function rectHit(x, y, r, ox, oy, w, h) {
    var nx = clamp(x, ox, ox + w),
      ny = clamp(y, oy, oy + h),
      dx = x - nx,
      dy = y - ny;
    return dx * dx + dy * dy < r * r;
  }

  function spawnInterval(baseInterval, world) {
    if (earlyCh1(world)) return EARLY_INTERVAL;
    return baseInterval;
  }

  function ensureMinCrowd(world, dt) {
    if (!earlyCh1(world)) {
      fillAcc = 0;
      return 0;
    }
    if ((world.enemyCount || 0) >= EARLY_FLOOR || (world.enemyCount || 0) >= (world.capE || EARLY_FLOOR)) {
      fillAcc = 0;
      return 0;
    }
    fillAcc += dt || 0;
    if (fillAcc >= 0.22) {
      fillAcc = 0;
      return 1;
    }
    return 0;
  }

  function resolvePlayer(x, y, r, world) {
    var obs = obstacles(world),
      i,
      o,
      slow = 1,
      melee = 1,
      px = x,
      py = y;
    for (i = 0; i < obs.length; i++) {
      o = obs[i];
      if (o.kind === "vehicle" && rectHit(px, py, r, o.x, o.y, o.w, o.h)) {
        var cx = o.x + o.w * 0.5,
          cy = o.y + o.h * 0.5,
          dx = px - cx,
          dy = py - cy;
        if (Math.abs(dx) > Math.abs(dy)) px = dx < 0 ? o.x - r - 0.5 : o.x + o.w + r + 0.5;
        else py = dy < 0 ? o.y - r - 0.5 : o.y + o.h + r + 0.5;
      }
      if (o.kind === "sword" && circleHit(px, py, r, o.x, o.y, o.r)) {
        slow = o.slow;
        melee = o.melee;
      }
    }
    return { x: px, y: py, slow: slow, melee: melee };
  }

  function deflectBullet(b, world) {
    if (!b || b.life <= 0) return 1;
    var obs = obstacles(world),
      i,
      o,
      r = b.r || 4;
    for (i = 0; i < obs.length; i++) {
      o = obs[i];
      if (o.kind === "torii" && circleHit(b.x, b.y, r, o.x, o.y, o.r)) return 1;
      if (o.kind === "vehicle" && rectHit(b.x, b.y, r, o.x, o.y, o.w, o.h)) return 1;
      if (o.kind === "mirror" && rectHit(b.x, b.y, r, o.x, o.y, o.w, o.h)) {
        if (b.refracted44) return 1;
        b.refracted44 = 1;
        if (o.bounce === "x") b.vx = -(b.vx || 0);
        else b.vy = -(b.vy || 0);
        if (b.vx >= 0) b.x = o.x + o.w + r + 1;
        else b.x = o.x - r - 1;
      }
    }
    return 0;
  }

  function drawCover(ctx, img, W, H) {
    var iw = img.naturalWidth || 1,
      ih = img.naturalHeight || 1,
      scale = Math.max(W / iw, H / ih),
      dw = iw * scale,
      dh = ih * scale;
    ctx.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh);
  }

  function photoReady(world) {
    var photo = world && world.battleBg;
    return !!(photo && photo.complete && photo.naturalWidth > 0);
  }

  function drawWorldPhoto(ctx, world) {
    var W = world.worldW || world.W,
      H = world.worldH || world.H;
    if (!photoReady(world) || !W || !H) return false;
    if (world.tiledGround && typeof ctx.createPattern === "function") {
      if (groundPatternImage !== world.battleBg || groundPatternContext !== ctx) {
        groundPatternImage = world.battleBg;
        groundPatternContext = ctx;
        groundPattern = ctx.createPattern(world.battleBg, "repeat");
      }
      if (groundPattern) {
        ctx.fillStyle = groundPattern;
        ctx.fillRect(0, 0, W, H);
      } else drawCover(ctx, world.battleBg, W, H);
    } else drawCover(ctx, world.battleBg, W, H);
    ctx.fillStyle = "rgba(5,4,14,0.26)";
    ctx.fillRect(0, 0, W, H);
    return true;
  }

  function drawMirrorEcho(ctx, world) {
    if (!world || world.playerX == null || world.playerY == null ||
        (groundId(world) !== "mirror" && !world.mainGod)) {
      echoKey = "";
      return;
    }
    var t = world.runTime || 0;
    var key = obsKey(world);
    if (key !== echoKey || t < echoAt) {
      echoKey = key;
      echoCount = 0;
      echoNext = 0;
    }
    if (!echoCount || t - echoAt >= 0.08) {
      echoAt = t;
      echo[echoNext * 2] = world.playerX;
      echo[echoNext * 2 + 1] = world.playerY;
      echoNext = (echoNext + 1) % 6;
      echoCount = Math.min(6, echoCount + 1);
    }
    var i, slot;
    for (i = 0; i < echoCount; i++) {
      slot = ((echoNext - echoCount + i + 6) % 6) * 2;
      ctx.fillStyle = "rgba(185,146,255," + (0.025 + (i + 1) * 0.018) + ")";
      ctx.beginPath();
      ctx.ellipse(echo[slot], echo[slot + 1] + 18, 18, 7, 0, 0, TAU);
      ctx.fill();
    }
  }

  // Weather is a deterministic world grid, drawn once per viewport. No particles
  // are added to combat arrays and the work stays bounded across long runs.
  function drawAtmosphere(ctx, world) {
    var id = groundId(world),
      t = (world.runTime || 0) % 3600,
      low = world.quality != null && world.quality < 0.8,
      cell = 168,
      left = Math.floor((world.camX || 0) / cell) - 1,
      top = Math.floor((world.camY || 0) / cell) - 1,
      right = Math.ceil(((world.camX || 0) + world.W) / cell),
      bottom = Math.ceil(((world.camY || 0) + world.H) / cell),
      limit = low ? 20 : 48,
      count = 0, row, col, seed, phase, x, y;
    ctx.save();
    for (row = top; row <= bottom && count < limit; row++) {
      for (col = left; col <= right && count < limit; col++) {
        if (low && (row + col) % 2) continue;
        count++;
        seed = Math.abs(col * 73 + row * 137);
        phase = (seed % 101) / 101;
        x = col * cell + ((seed * 11 + t * (id === "neon" ? -18 : 10)) % cell + cell) % cell;
        y = row * cell + ((seed * 7 + t * (id === "neon" ? 104 : id === "swords" ? -9 : 7)) % cell + cell) % cell;
        if (id === "neon") {
          ctx.strokeStyle = "rgba(149,218,255,0.16)";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x - 6, y + 24); ctx.stroke();
          if (seed % 3 === 0) {
            ctx.strokeStyle = "rgba(102,218,255,0.10)";
            ctx.beginPath(); ctx.ellipse(x, row * cell + 120, 4 + ((t + phase) % 1) * 12, 2 + ((t + phase) % 1) * 4, 0, 0, TAU); ctx.stroke();
          }
        } else if (id === "swords") {
          ctx.fillStyle = "rgba(222,211,241," + (0.08 + Math.sin(t * 1.6 + phase * TAU) * 0.035) + ")";
          ctx.beginPath(); ctx.arc(x, y, 1.2 + phase, 0, TAU); ctx.fill();
          if (seed % 4 === 0) {
            ctx.strokeStyle = "rgba(191,174,210,0.08)";
            ctx.beginPath(); ctx.moveTo(x - 17, y + 7); ctx.lineTo(x + 12, y + 4); ctx.stroke();
          }
        } else if (id === "mirror" || id === "maingod") {
          ctx.strokeStyle = "rgba(208,176,255," + (0.09 + Math.sin(t + phase * TAU) * 0.035) + ")";
          ctx.lineWidth = 1;
          ctx.beginPath(); ctx.moveTo(x, y - 7); ctx.lineTo(x + 4, y); ctx.lineTo(x, y + 7); ctx.lineTo(x - 4, y); ctx.closePath(); ctx.stroke();
        } else {
          ctx.fillStyle = "rgba(255,165,207,0.22)";
          ctx.beginPath(); ctx.ellipse(x + Math.sin(t + phase * TAU) * 7, y, 4.5, 2, t * 0.4 + phase * TAU, 0, TAU); ctx.fill();
        }
      }
    }
    ctx.restore();
  }

  function drawGround(ctx, world) {
    if (!ctx || !world) return;
    if (world.camX != null && world.cols > 1 && global.SakurayoCamera && global.SakurayoCamera.visibleChunks) {
      var photoDone = drawWorldPhoto(ctx, world);
      var tiles = global.SakurayoCamera.visibleChunks();
      var n;
      for (n = 0; n < tiles.length; n++) {
        ctx.save();
        ctx.translate(tiles[n].x, tiles[n].y);
        drawGroundChunk(ctx, world, photoDone);
        ctx.restore();
      }
      drawAtmosphere(ctx, world);
      drawMirrorEcho(ctx, world);
      return;
    }
    drawGroundChunk(ctx, world, drawWorldPhoto(ctx, world));
    drawAtmosphere(ctx, world);
    drawMirrorEcho(ctx, world);
  }

  function drawGroundChunk(ctx, world, photoDone) {
    if (photoDone) return;
    var W = world.W,
      H = world.H,
      t = world.runTime || 0,
      q = world.quality == null ? 1 : world.quality,
      pal = stageProfile(world.stageId, world),
      id = pal.ground,
      g = ctx.createLinearGradient(0, 0, 0, H),
      i,
      y,
      pathL,
      pathR,
      photo = world.battleBg;
    if (photo && photo.complete && photo.naturalWidth > 0) {
      drawCover(ctx, photo, W, H);
      ctx.fillStyle = "rgba(5,4,14,0.26)";
      ctx.fillRect(0, 0, W, H);
      return;
    }
    if (pal.mainGod) {
      var shift = pal.hue;
      ctx.fillStyle = "hsl(" + (268 + shift) + ",42%,10%)";
      ctx.fillRect(0, 0, W, H);
      g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, "hsl(" + (250 + shift) + ",38%,18%)");
      g.addColorStop(1, "hsl(" + (230 + shift) + ",40%,8%)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = "hsla(" + (280 + shift) + ",50%,70%,0.12)";
      ctx.lineWidth = 10;
      ctx.strokeRect(18, 70, W - 36, H - 140);
    } else {
      g.addColorStop(0, pal.top);
      g.addColorStop(1, pal.bottom);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, W, H);
    }

    if (id === "torii") {
      pathL = W * 0.28;
      pathR = W * 0.72;
      ctx.fillStyle = "#3a2a3c";
      ctx.fillRect(pathL, 64, pathR - pathL, H - 80);
      ctx.fillStyle = "#2a1c28";
      for (i = 0; i < 18; i++) {
        ctx.fillRect(pathL + 6, 72 + i * 48, pathR - pathL - 12, 10);
        ctx.fillStyle = i % 2 ? "#4a3144" : "#2a1c28";
      }
      ctx.fillStyle = "rgba(255,111,176,0.16)";
      for (i = 0; i < (q < 0.8 ? 3 : 5); i++) {
        ctx.beginPath();
        ctx.arc(pathL + 18 + ((i * 73) % (pathR - pathL - 36)), 96 + ((i * 91) % (H - 180)), 16, 0, TAU);
        ctx.fill();
      }
    } else if (id === "neon") {
      ctx.fillStyle = "#071018";
      ctx.fillRect(0, 80, W, H - 80);
      ctx.strokeStyle = "rgba(111,231,255,0.22)";
      ctx.lineWidth = 3;
      for (i = 0; i < 14; i++) {
        y = 88 + i * 62 + Math.sin(t * 4 + i) * 4;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y + 8);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(255,78,168,0.28)";
      ctx.fillRect(W * 0.06, 118, 22, 70);
      ctx.fillStyle = "rgba(71,240,255,0.3)";
      ctx.fillRect(W * 0.84, 214, 20, 86);
      ctx.fillStyle = "rgba(255,210,90,0.18)";
      ctx.fillRect(W * 0.42, 160, 48, 14);
    } else if (id === "swords") {
      ctx.fillStyle = "#121018";
      ctx.fillRect(0, 70, W, H - 70);
      ctx.strokeStyle = "rgba(216,207,230,0.28)";
      ctx.lineWidth = 2;
      for (i = 0; i < 18; i++) {
        var sx = ((i * 67) % (W - 48)) + 24,
          sy = 96 + ((i * 83) % (H - 180));
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(sx + (i % 2 ? 8 : -8), sy + 42);
        ctx.stroke();
        ctx.fillStyle = "rgba(232,224,255,0.35)";
        ctx.fillRect(sx - 2, sy - 6, 4, 10);
      }
    } else if (id === "mirror") {
      ctx.strokeStyle = "rgba(201,166,255,0.22)";
      ctx.lineWidth = 1.6;
      var tile = 46;
      for (var x = -20; x < W + 20; x += tile) {
        ctx.beginPath();
        ctx.moveTo(x + 14, 60);
        ctx.lineTo(x - 10, H);
        ctx.stroke();
      }
      for (y = 60; y < H; y += tile) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(W, y + 12);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,210,255,0.18)";
      ctx.beginPath();
      ctx.moveTo(W * 0.18, 90);
      ctx.lineTo(W * 0.62, H * 0.55);
      ctx.lineTo(W * 0.3, H - 40);
      ctx.stroke();
    }

  }

  function drawObstacles(ctx, world) {
    if (!ctx || !world) return;
    var obs = obstacles(world),
      t = (world.runTime || 0) % 3600,
      left = (world.camX || 0) - 84,
      top = (world.camY || 0) - 84,
      right = (world.camX || 0) + world.W + 84,
      bottom = (world.camY || 0) + world.H + 84,
      i, o, k, shimmer;
    for (i = 0; i < obs.length; i++) {
      o = obs[i];
      if (o.x + (o.w || 0) < left || o.y + (o.h || 0) < top || o.x > right || o.y > bottom) continue;
      ctx.save();
      ctx.fillStyle = "rgba(2,4,12,0.48)";
      ctx.beginPath();
      ctx.ellipse(o.x + (o.w || 0) * 0.5, o.y + (o.h || 0) + 9, o.kind === "sword" ? o.r * 0.4 : o.kind === "vehicle" ? o.w * 0.6 : 27, o.kind === "vehicle" ? 9 : 7, 0, 0, TAU);
      ctx.fill();
      if (o.kind === "torii") {
        ctx.fillStyle = "rgba(255,142,171,0.10)";
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill();
        ctx.fillStyle = "#581c33";
        ctx.fillRect(o.x - 20, o.y - 6, 8, 38);
        ctx.fillRect(o.x + 12, o.y - 6, 8, 38);
        ctx.fillStyle = "#bc455f";
        ctx.fillRect(o.x - 20, o.y - 6, 3, 35);
        ctx.fillRect(o.x + 12, o.y - 6, 3, 35);
        ctx.fillStyle = "#251923";
        ctx.fillRect(o.x - 23, o.y + 28, 14, 5);
        ctx.fillRect(o.x + 9, o.y + 28, 14, 5);
        ctx.fillStyle = "#dc7586";
        ctx.fillRect(o.x - 26, o.y - 16, 52, 9);
        ctx.fillRect(o.x - 18, o.y - 4, 36, 5);
        ctx.fillStyle = "#f5aea8";
        ctx.fillRect(o.x - 28, o.y - 18, 56, 3);
        ctx.fillStyle = "#352333";
        ctx.fillRect(o.x - 4, o.y - 10, 8, 12);
        ctx.fillStyle = "#ffc7a4";
        ctx.fillRect(o.x - 2, o.y - 7, 4, 6);
        ctx.fillStyle = "rgba(255,193,130," + (0.17 + Math.sin(t * 1.8 + i) * 0.045) + ")";
        ctx.beginPath(); ctx.arc(o.x, o.y - 24, 8, 0, TAU); ctx.fill();
        ctx.fillStyle = "#ffd0a0";
        ctx.beginPath(); ctx.arc(o.x, o.y - 24, 3, 0, TAU); ctx.fill();
      } else if (o.kind === "vehicle") {
        ctx.fillStyle = "#060b14";
        ctx.fillRect(o.x + 8, o.y - 3, 9, 5);
        ctx.fillRect(o.x + o.w - 18, o.y - 3, 9, 5);
        ctx.fillRect(o.x + 8, o.y + o.h - 2, 9, 5);
        ctx.fillRect(o.x + o.w - 18, o.y + o.h - 2, 9, 5);
        ctx.fillStyle = "#203345";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = "#30495c";
        ctx.fillRect(o.x + 4, o.y + 4, o.w - 8, o.h - 8);
        ctx.fillStyle = "#112539";
        ctx.fillRect(o.x + 15, o.y + 4, o.w * 0.35, o.h - 8);
        ctx.fillStyle = "rgba(105,208,243,0.48)";
        ctx.fillRect(o.x + 15, o.y + 5, 4, o.h - 10);
        ctx.fillRect(o.x + o.w * 0.62, o.y + 5, 3, o.h - 10);
        ctx.fillStyle = "#c88a74";
        ctx.fillRect(o.x + 7, o.y + 6, 5, 3);
        ctx.fillStyle = "rgba(255,200,112," + (0.46 + Math.sin(t * 2 + i) * 0.12) + ")";
        ctx.fillRect(o.x + o.w - 7, o.y + 3, 4, 5);
        ctx.fillRect(o.x + o.w - 7, o.y + o.h - 8, 4, 5);
        ctx.strokeStyle = "rgba(168,226,247,0.72)";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
      } else if (o.kind === "sword") {
        // The complete boundary uses the actual slow/melee field radius.
        ctx.fillStyle = "rgba(158,141,190,0.08)";
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill();
        ctx.strokeStyle = "rgba(223,203,252," + (0.29 + Math.sin(t * 1.4 + i) * 0.05) + ")";
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.strokeStyle = "rgba(230,216,250,0.15)";
        ctx.beginPath(); ctx.ellipse(o.x, o.y + 3, o.r * 0.68, o.r * 0.2, 0, 0, TAU); ctx.stroke();
        for (k = -1; k <= 1; k++) {
          ctx.strokeStyle = "#d7d2e8";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(o.x + k * 16, o.y - o.r * 0.46);
          ctx.lineTo(o.x + k * 11, o.y + o.r * 0.35);
          ctx.stroke();
          ctx.strokeStyle = "#655173";
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(o.x + k * 16, o.y - o.r * 0.55);
          ctx.lineTo(o.x + k * 16, o.y - o.r * 0.43);
          ctx.stroke();
          ctx.strokeStyle = "#ccb79c";
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(o.x + k * 16 - 7, o.y - o.r * 0.44);
          ctx.lineTo(o.x + k * 16 + 7, o.y - o.r * 0.44);
          ctx.stroke();
        }
      } else if (o.kind === "mirror") {
        ctx.fillStyle = "rgba(50,32,89,0.74)";
        ctx.fillRect(o.x, o.y, o.w, o.h);
        ctx.fillStyle = "rgba(176,158,229,0.43)";
        ctx.fillRect(o.x + 2, o.y + 3, o.w - 4, o.h - 6);
        shimmer = (t * 15 + i * 21) % (o.h - 12);
        ctx.fillStyle = "rgba(234,224,255,0.6)";
        ctx.fillRect(o.x + 2, o.y + 3 + shimmer, o.w - 4, 7);
        ctx.strokeStyle = "#eee2ff";
        ctx.lineWidth = 1.5;
        ctx.strokeRect(o.x, o.y, o.w, o.h);
        ctx.strokeStyle = "rgba(255,255,255,0.52)";
        ctx.beginPath();
        ctx.moveTo(o.x + 2, o.y + 10);
        ctx.lineTo(o.x + o.w - 2, o.y + o.h * 0.48);
        ctx.lineTo(o.x + 2, o.y + o.h - 9);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  function drawRoleSilhouette(ctx, enemy, size, time) {
    if (!ctx || !enemy) return;
    var type = enemy.type;
    if (type === "boss") return;
    var r = Math.max((enemy.r || 14) * 1.7, (size || 48) * 0.3);
    var i, s, a, px, py;
    var accent = {
      fast: "#72efff",
      tank: "#f1b06c",
      ranged: "#c990ff",
      bomb: "#ff6767",
      shield: "#74d9ff",
      disruptor: "#54f1ff",
      purifier: "#baff83",
      specter: "#d5b7ff",
      decay: "#9fdd66",
      seal: "#ff9ce6",
      elite: "#ffd36b",
    }[type] || "#ffd36b";
    var t = time || 0;
    ctx.save();
    ctx.globalAlpha = 0.94;
    ctx.lineWidth = Math.max(4, r * 0.2);
    ctx.strokeStyle = "#fff";
    ctx.fillStyle = accent + "cc";
    function line(x1, y1, x2, y2) {
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    if (type === "fast") {
      for (s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.moveTo(-r * 0.2, s * r * 0.12);
        ctx.lineTo(-r * 2.15, s * r * 1.15);
        ctx.lineTo(-r * 1.05, s * r * 0.02);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      }
    } else if (type === "tank") {
      for (s = -1; s <= 1; s += 2) {
        ctx.fillRect(s * r * 0.95 - r * 0.55, -r * 0.95, r * 1.1, r * 0.95);
        ctx.strokeRect(s * r * 0.95 - r * 0.55, -r * 0.95, r * 1.1, r * 0.95);
      }
    } else if (type === "ranged") {
      line(-r * 2.05, -r * 0.28, r * 2.15, -r * 0.28);
      line(r * 0.7, -r * 0.75, r * 2.15, -r * 0.28);
      ctx.beginPath();
      ctx.arc(r * 2.15, -r * 0.28, 4 + Math.sin(t * 10) * 2, 0, TAU);
      ctx.fill();
    } else if (type === "bomb") {
      ctx.beginPath();
      ctx.arc(0, 0, r * 1.42, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "#ff3b3b99";
      ctx.beginPath();
      ctx.arc(0, 0, r * 0.55, 0, TAU);
      ctx.fill();
      line(r * 0.5, -r * 1.1, r * 1.1, -r * 1.75);
      ctx.beginPath();
      ctx.arc(r * 1.18, -r * 1.85, 5 + Math.sin(t * 16) * 2, 0, TAU);
      ctx.fill();
    } else if (type === "shield") {
      ctx.beginPath();
      for (i = 0; i < 6; i++) {
        a = -Math.PI / 2 + (i * TAU) / 6;
        px = Math.cos(a) * r * 1.85;
        py = Math.sin(a) * r * 1.85;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === "disruptor") {
      line(-r * 0.5, -r * 0.85, -r * 1.05, -r * 1.95);
      line(r * 0.5, -r * 0.85, r * 1.05, -r * 1.95);
      for (s = -1; s <= 1; s += 2) {
        ctx.beginPath();
        ctx.arc(s * r * 1.1, -r * 2.05, r * 0.3, 0, TAU);
        ctx.fill();
      }
    } else if (type === "purifier") {
      ctx.beginPath();
      ctx.ellipse(0, -r * 1.05, r * 1.55, r * 0.48, 0, 0, TAU);
      ctx.stroke();
      line(0, -r * 1.7, 0, r * 1.35);
      line(-r * 1.05, -r * 0.15, r * 1.05, -r * 0.15);
    } else if (type === "specter") {
      ctx.beginPath();
      ctx.moveTo(-r * 1.15, r * 0.45);
      ctx.quadraticCurveTo(-r * 0.6, r * 2.35, 0, r * 1.15);
      ctx.quadraticCurveTo(r * 0.6, r * 2.35, r * 1.15, r * 0.45);
      ctx.stroke();
    } else if (type === "decay") {
      line(r * 1.05, -r * 1.65, r * 1.05, r * 1.55);
      ctx.beginPath();
      ctx.arc(r * 1.05, -r * 1.85, r * 0.42, 0, TAU);
      ctx.fill();
    } else if (type === "seal") {
      for (s = -1; s <= 1; s += 2) {
        ctx.fillRect(s * r * 1.2 - r * 0.22, -r * 1.55, r * 0.44, r * 2.7);
        ctx.strokeRect(s * r * 1.2 - r * 0.22, -r * 1.55, r * 0.44, r * 2.7);
      }
    }
    if (enemy.elite || type === "elite") {
      ctx.strokeStyle = "#ffd36b";
      ctx.fillStyle = "#ffd36bcc";
      ctx.lineWidth = Math.max(3, r * 0.16);
      ctx.beginPath();
      ctx.arc(0, -r * 1.55, r * 0.55, 0, TAU);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-r * 0.7, -r * 1.55);
      ctx.lineTo(0, -r * 2.15);
      ctx.lineTo(r * 0.7, -r * 1.55);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  function heroVisualScale(width) {
    return (width || 0) >= 560 ? 1.12 : 1;
  }

  function careerProgress(careers, fusionId, formId, fusionCatalog, schools, careerDefs) {
    var list = [],
      formed = [],
      id,
      c,
      defs,
      branch;
    careers = careers || {};
    for (id in careers) {
      if (!Object.prototype.hasOwnProperty.call(careers, id)) continue;
      c = careers[id];
      if (!c || !c.formed) continue;
      defs = careerDefs && careerDefs[id];
      branch = defs && c.branch ? [defs.a, defs.b].filter(function (b) { return b && b.id === c.branch; })[0] : null;
      formed.push(id);
      list.push({
        id: id,
        school: (schools && schools[id] && schools[id].n) || id,
        branch: branch ? branch.n : "",
        rank: c.rank || 0,
        points: c.branch ? (c.rank >= 2 ? 2 : 1) : 0,
        max: 2,
      });
    }
    var hint = "";
    if (!fusionId && fusionCatalog && fusionCatalog.length) {
      var i, f, a, b, haveA, haveB;
      for (i = 0; i < fusionCatalog.length; i++) {
        f = fusionCatalog[i];
        if (!f || !f.pair || f.pair.length < 2) continue;
        a = f.pair[0];
        b = f.pair[1];
        haveA = formed.indexOf(a) >= 0;
        haveB = formed.indexOf(b) >= 0;
        if (haveA && haveB) {
          hint = "可融合：" + (f.n || f.id);
          break;
        }
        if (haveA !== haveB) {
          var missing = haveA ? b : a;
          hint = "最近融合：再成型" + ((schools && schools[missing] && schools[missing].n) || missing) + " → " + (f.n || f.id);
          break;
        }
      }
    } else if (fusionId) {
      hint = "已融合";
    }
    return {
      schools: list,
      fusion: fusionId || "",
      form: formId || "",
      hint: hint,
    };
  }

  function missionLine(world, progressPct, bossText) {
    var pal = stageProfile(world.stageId, world);
    if (bossText) return bossText;
    return pal.label + " · " + pal.waveNoun + " " + Math.floor(clamp(progressPct, 0, 1) * 100) + "%";
  }

  function hint(world) {
    var id = groundId(world);
    if (id === "neon") return "停尸车辆挡住移动与直线弹 · 绕过去打";
    if (id === "swords") return "飞剑区减速 · 近战更锋利";
    if (id === "mirror") return "碎镜折射一次 · 别对镜面开枪";
    if (id === "maingod") return "回廊每三层换色温 · 别站桩";
    return "鸟居挡弹不挡人 · 前二十秒会包抄";
  }

  function radio(world, character) {
    var id = groundId(world);
    var who = character || "";
    if (id === "neon") {
      if (who === "aya") return "电台接通。雨还在洗合同。车挡会拦住脚步与子弹。绕过去，别被当年的签名绊住。";
      if (who === "rion") return "电台接通。霓虹把招式标了价。绕开车挡，别让直线弹替你决定走位。";
      return "电台接通。霓虹还亮着，人格却被写成资产。绕开车挡再开火。";
    }
    if (id === "swords") {
      if (who === "aya") return "电台接通。剑冢保存着事故当天。走进剑区会变慢——你有时间把名字看清楚。";
      if (who === "rion") return "电台接通。飞剑还在呼吸。走进剑区会变慢，刀会更快。每一剑都要有人负责。";
      return "电台接通。失败者的剑还插在路上。走进剑区会变慢，近战会更锋利。";
    }
    if (id === "mirror") {
      if (who === "aya") return "电台接通。碎镜会把弹折回来，也会把签名折回来。先活着，再对质。";
      if (who === "rion") return "电台接通。碎镜里全是别人的招式。别对着镜面开枪，那一剑会回到你手里。";
      return "电台接通。碎镜把你折成第三百一十八次。先活着，再决定哪一个你留下。";
    }
    if (id === "maingod") return "白色大厅没有外线。经验很快，死亡立刻结算。";
    if (who === "aya") return "电台接通。旧门禁还认得你。鸟居只挡弹，不替你洗白。";
    if (who === "rion") return "电台接通。尸潮在用师父的起手式。鸟居挡弹，不挡失礼。";
    return "电台接通。门还认得你的灵纹。先活过这二十秒，再谈你是谁。";
  }

  function waveTint(world) {
    return stageProfile(world.stageId, world).accent;
  }

  function snapshot(world) {
    world = world || {};
    var pal = stageProfile(world.stageId, world);
    return {
      version: VERSION,
      ground: pal.ground,
      label: pal.label,
      hint: hint(world),
      obstacleCount: obstacles(world).length,
      earlyWindow: earlyCh1(world),
      earlyFloor: EARLY_FLOOR,
      earlyInterval: EARLY_INTERVAL,
      heroScale: heroVisualScale(world.W),
      worldW: world.worldW || world.W || 0,
      worldH: world.worldH || world.H || 0,
      cols: world.cols || 1,
      rows: world.rows || 1,
    };
  }

  global.SakurayoLifecycle = {
    version: VERSION,
    stageProfile: stageProfile,
    spawnInterval: spawnInterval,
    ensureMinCrowd: ensureMinCrowd,
    drawGround: drawGround,
    drawObstacles: drawObstacles,
    resolvePlayer: resolvePlayer,
    deflectBullet: deflectBullet,
    drawRoleSilhouette: drawRoleSilhouette,
    heroVisualScale: heroVisualScale,
    careerProgress: careerProgress,
    missionLine: missionLine,
    hint: hint,
    radio: radio,
    waveTint: waveTint,
    snapshot: snapshot,
    obstacles: obstacles,
  };
})(typeof window !== "undefined" ? window : this);
