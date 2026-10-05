function miiFigureSVG(color, size, pose, photoDataUrl) {
  const s = size;
  const uid = 'mii' + Math.random().toString(36).slice(2,8);
  const cx = s / 2;

  // Proportions (all relative to s)
  const headR   = s * 0.215;     // head radius — big like Mii
  const headCy  = headR + s * 0.01; // head center Y
  const neckT   = headCy + headR; // neck top
  const torsoT  = neckT + s * 0.04;
  const torsoH  = s * 0.22;
  const torsoW  = s * 0.38;
  const torsoB  = torsoT + torsoH; // torso bottom
  const torsoL  = cx - torsoW / 2;
  const torsoR  = cx + torsoW / 2;
  const torsoRad = s * 0.07;

  // Legs
  const legW    = s * 0.12;
  const legH    = s * 0.22;
  const legGap  = s * 0.03;
  const legLX   = cx - legGap/2 - legW;
  const legRX   = cx + legGap/2;
  const legT    = torsoB - s * 0.03;
  const legB    = legT + legH;
  const legRad  = s * 0.05;

  // Arms — shape changes per pose
  const armW    = s * 0.10;
  const armH    = s * 0.20;
  const armRad  = s * 0.05;
  const armShoulderY = torsoT + s * 0.03;

  // Color helpers
  const light  = lighten(color, 0.28);
  const dark   = lighten(color, -0.12);
  const skinBase = '#f5c8a0';
  const skinDark = '#e8a878';

  // Neck
  const neckW = s * 0.09;
  const neckH = s * 0.05;

  // --- BUILD SVG ELEMENTS in correct painter order ---
  // 1. Arms (behind torso)
  // 2. Torso
  // 3. Legs
  // 4. Neck
  // 5. Head (always on top)

  let armLeftEl, armRightEl;

  if (pose === 'victory') {
    // Both arms raised in V
    const alx = torsoL - armW + s*0.01;
    const arx = torsoR - s*0.01;
    // left arm: raised, tilted left
    armLeftEl = `
      <rect x="${alx - s*0.04}" y="${armShoulderY - armH*0.85}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}"
        transform="rotate(-38,${alx - s*0.04 + armW/2},${armShoulderY})"/>`;
    armRightEl = `
      <rect x="${arx}" y="${armShoulderY - armH*0.85}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}"
        transform="rotate(38,${arx + armW/2},${armShoulderY})"/>`;
  } else if (pose === 'wave') {
    // Saludo: un brazo bien arriba, el otro al costado
    const alx = torsoL - armW + s*0.01;
    const arx = torsoR - s*0.01;
    armLeftEl = `<rect x="${alx}" y="${armShoulderY}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}" transform="rotate(16,${alx + armW/2},${armShoulderY})"/>`;
    armRightEl = `<rect x="${arx}" y="${armShoulderY - armH*0.75}" width="${armW}" height="${armH*1.2}"
        rx="${armRad}" fill="${light}" transform="rotate(-28,${arx + armW/2},${armShoulderY})"/>`;
  } else if (pose === 'hip') {
    // Canchero: manos en la cintura (brazos en jarra)
    const alx = torsoL - armW*0.7;
    const arx = torsoR - armW*0.3;
    armLeftEl = `<rect x="${alx}" y="${armShoulderY}" width="${armW}" height="${armH*0.9}"
        rx="${armRad}" fill="${light}" transform="rotate(48,${alx + armW/2},${armShoulderY})"/>`;
    armRightEl = `<rect x="${arx}" y="${armShoulderY}" width="${armW}" height="${armH*0.9}"
        rx="${armRad}" fill="${light}" transform="rotate(-48,${arx + armW/2},${armShoulderY})"/>`;
  } else if (pose === 'hug-right' || pose === 'hug-left') {
    // Abrazo: el brazo interior sube por encima del hombro del compañero,
    // el exterior queda relajado al costado. 'hug-right' abraza hacia la derecha.
    const alx = torsoL - armW + s*0.01;
    const arx = torsoR - s*0.01;
    const innerUp = `<rect x="${arx - s*0.01}" y="${armShoulderY - armH*0.55}" width="${armW}" height="${armH*1.15}"
        rx="${armRad}" fill="${light}"
        transform="rotate(-72,${arx + armW/2},${armShoulderY})"/>`;
    const innerUpL = `<rect x="${alx + s*0.01}" y="${armShoulderY - armH*0.55}" width="${armW}" height="${armH*1.15}"
        rx="${armRad}" fill="${light}"
        transform="rotate(72,${alx + armW/2},${armShoulderY})"/>`;
    const outerL = `<rect x="${alx}" y="${armShoulderY}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}"
        transform="rotate(14,${alx + armW/2},${armShoulderY})"/>`;
    const outerR = `<rect x="${arx}" y="${armShoulderY}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}"
        transform="rotate(-14,${arx + armW/2},${armShoulderY})"/>`;
    if (pose === 'hug-right') { armLeftEl = outerL; armRightEl = innerUp; }
    else { armLeftEl = innerUpL; armRightEl = outerR; }
  } else if (pose === 'side') {
    // Arms slightly out to sides, relaxed
    const alx = torsoL - armW + s*0.01;
    const arx = torsoR - s*0.01;
    armLeftEl = `
      <rect x="${alx - s*0.01}" y="${armShoulderY}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}"
        transform="rotate(12,${alx + armW/2},${armShoulderY})"/>`;
    armRightEl = `
      <rect x="${arx + s*0.01}" y="${armShoulderY}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}"
        transform="rotate(-12,${arx + armW/2},${armShoulderY})"/>`;
  } else {
    // slump — arms drooping down
    const alx = torsoL - armW + s*0.01;
    const arx = torsoR - s*0.01;
    armLeftEl = `
      <rect x="${alx}" y="${armShoulderY}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}"
        transform="rotate(22,${alx + armW/2},${armShoulderY})"/>`;
    armRightEl = `
      <rect x="${arx}" y="${armShoulderY}" width="${armW}" height="${armH}"
        rx="${armRad}" fill="${light}"
        transform="rotate(-22,${arx + armW/2},${armShoulderY})"/>`;
  }

  // Torso
  const torsoEl = `<rect x="${torsoL}" y="${torsoT}" width="${torsoW}" height="${torsoH}" rx="${torsoRad}" fill="${color}"/>
    <rect x="${torsoL}" y="${torsoT}" width="${torsoW}" height="${torsoH*0.45}" rx="${torsoRad}" fill="${light}" opacity="0.25"/>`;

  // Legs
  const legLEl = `<rect x="${legLX}" y="${legT}" width="${legW}" height="${legH}" rx="${legRad}" fill="${dark}"/>`;
  const legREl = `<rect x="${legRX}" y="${legT}" width="${legW}" height="${legH}" rx="${legRad}" fill="${dark}"/>`;

  // Shoes (small rounded rect at bottom of each leg)
  const shoeW = legW + s*0.04;
  const shoeH = s*0.06;
  const shoeLEl = `<rect x="${legLX - s*0.02}" y="${legB - shoeH*0.5}" width="${shoeW}" height="${shoeH}" rx="${shoeH/2}" fill="${lighten(dark,-0.15)}"/>`;
  const shoeREl = `<rect x="${legRX - s*0.02}" y="${legB - shoeH*0.5}" width="${shoeW}" height="${shoeH}" rx="${shoeH/2}" fill="${lighten(dark,-0.15)}"/>`;

  // Neck
  const neckEl = `<rect x="${cx - neckW/2}" y="${neckT - s*0.01}" width="${neckW}" height="${neckH + s*0.01}" rx="${neckW*0.3}" fill="${skinDark}"/>`;

  // Head — drawn LAST so it's always on top
  let headEl;
  if (photoDataUrl) {
    headEl = `
      <defs>
        <clipPath id="hcp${uid}"><circle cx="${cx}" cy="${headCy}" r="${headR}"/></clipPath>
        <radialGradient id="hrim${uid}" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stop-color="rgba(255,255,255,0.25)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>
      <circle cx="${cx}" cy="${headCy}" r="${headR}" fill="${skinBase}"/>
      <image href="${photoDataUrl}" x="${cx-headR}" y="${headCy-headR}" width="${headR*2}" height="${headR*2}"
        clip-path="url(#hcp${uid})" preserveAspectRatio="xMidYMid slice"/>
      <circle cx="${cx}" cy="${headCy}" r="${headR}" fill="url(#hrim${uid})"/>
      <circle cx="${cx}" cy="${headCy}" r="${headR}" fill="none" stroke="${light}" stroke-width="${s*0.02}"/>`;
  } else {
    // Blank Mii-style face: skin tone, two oval eyes, simple smile
    const eyeRx = headR * 0.115;
    const eyeRy = headR * 0.14;
    const eyeY  = headCy - headR * 0.05;
    const eyeOff = headR * 0.3;
    const smileR = headR * 0.28;
    headEl = `
      <defs>
        <radialGradient id="hg${uid}" cx="40%" cy="30%" r="65%">
          <stop offset="0%" stop-color="${skinBase}"/>
          <stop offset="100%" stop-color="${skinDark}"/>
        </radialGradient>
      </defs>
      <circle cx="${cx}" cy="${headCy}" r="${headR}" fill="url(#hg${uid})" stroke="${light}" stroke-width="${s*0.02}"/>
      <!-- eyes -->
      <ellipse cx="${cx - eyeOff}" cy="${eyeY}" rx="${eyeRx}" ry="${eyeRy}" fill="#2a1f14"/>
      <ellipse cx="${cx + eyeOff}" cy="${eyeY}" rx="${eyeRx}" ry="${eyeRy}" fill="#2a1f14"/>
      <!-- eye shine -->
      <circle cx="${cx - eyeOff + eyeRx*0.4}" cy="${eyeY - eyeRy*0.35}" r="${eyeRx*0.38}" fill="rgba(255,255,255,0.75)"/>
      <circle cx="${cx + eyeOff + eyeRx*0.4}" cy="${eyeY - eyeRy*0.35}" r="${eyeRx*0.38}" fill="rgba(255,255,255,0.75)"/>
      <!-- smile -->
      <path d="M${cx - smileR},${headCy + headR*0.22} Q${cx},${headCy + headR*0.52} ${cx + smileR},${headCy + headR*0.22}"
        stroke="#2a1f14" stroke-width="${s*0.025}" fill="none" stroke-linecap="round"/>`;
  }

  return `<svg width="${s}" height="${s}" viewBox="0 0 ${s} ${s}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    ${armLeftEl}
    ${armRightEl}
    ${torsoEl}
    ${legLEl}
    ${legREl}
    ${shoeLEl}
    ${shoeREl}
    ${neckEl}
    ${headEl}
  </svg>`;
}

V.podium=function(teams=V.M.standings(V.s)){return '<div class="podium-outer"><div class="podium-label">Podio en vivo</div><div class="podium-wrap">'+[1,0,2].map((pos,i)=>{const t=teams[pos],color=['#a0b4c8','#f5c842','#cd7f32'][i];return '<div class="podium-slot podium-enter-'+(i+1)+'"><div class="podium-avatar-wrap">'+(pos===0&&t?'<div class="podium-crown">👑</div>':'')+'<div class="podium-figure"><div class="podium-glow"></div>'+ (t?miiFigureSVG(color,[64,82,54][i],['side','victory','slump'][i],t.photo||null):'')+'</div></div><div class="podium-name-badge">'+V.esc(t?.name||'Por definir')+'</div><div class="podium-pts-badge">'+(t?.total??'—')+' pts</div><div class="podium-block"><span class="podium-block-num">'+(pos+1)+'°</span></div></div>'}).join('')+'</div></div>'};
function lighten(color,amt){const c=color.startsWith('rgb')?color.match(/[\d.]+/g).map(Number):color.replace('#','').match(/../g).map(v=>parseInt(v,16));return 'rgb('+c.slice(0,3).map((v,i)=>Math.max(0,Math.min(255,v+Math.round(amt*[120,100,80][i])))).join(',')+')'}
