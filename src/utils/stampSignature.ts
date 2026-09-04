/**
 * Utilities for generating sample company stamps, signatures, and handling image uploads.
 * Uses HTML5 Canvas in the browser to produce genuine PNG Data URLs compatible with jsPDF and web UI.
 */

export function generateSampleStamp(companyName: string = 'BUSINESS BILLING SUITE'): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 300;
  canvas.height = 300;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const cx = 150;
  const cy = 150;
  const radius = 135;
  const primaryColor = '#1e3a8a'; // Deep Navy Blue Stamp Ink

  // Outer dashed ring
  ctx.save();
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3.5;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Double solid rings
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 10, 0, Math.PI * 2);
  ctx.stroke();

  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.arc(cx, cy, radius - 45, 0, Math.PI * 2);
  ctx.stroke();

  // Circular text along top
  const text = `★ ${companyName.toUpperCase().slice(0, 26)} ★`;
  ctx.font = 'bold 13px Arial, sans-serif';
  ctx.fillStyle = primaryColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const totalAngle = Math.PI * 0.82;
  const startAngle = -Math.PI / 2 - totalAngle / 2;
  const charStep = totalAngle / Math.max(1, text.length - 1);

  for (let i = 0; i < text.length; i++) {
    const angle = startAngle + i * charStep;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * (radius - 28), cy + Math.sin(angle) * (radius - 28));
    ctx.rotate(angle + Math.PI / 2);
    ctx.fillText(text[i], 0, 0);
    ctx.restore();
  }

  // Circular text along bottom: "OFFICIAL SEAL • VERIFIED"
  const bottomText = '★ OFFICIAL SEAL • VERIFIED ★';
  const bAngle = Math.PI * 0.76;
  const bStart = Math.PI / 2 + bAngle / 2;
  const bStep = bAngle / Math.max(1, bottomText.length - 1);

  for (let i = 0; i < bottomText.length; i++) {
    const angle = bStart - i * bStep;
    ctx.save();
    ctx.translate(cx + Math.cos(angle) * (radius - 28), cy + Math.sin(angle) * (radius - 28));
    ctx.rotate(angle - Math.PI / 2);
    ctx.fillText(bottomText[i], 0, 0);
    ctx.restore();
  }

  // Center banner
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - 85, cy - 22, 170, 44);
  ctx.strokeStyle = primaryColor;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(cx - 85, cy - 22, 170, 44);

  ctx.fillStyle = primaryColor;
  ctx.font = '900 17px Arial, sans-serif';
  ctx.fillText('AUTHORIZED', cx, cy - 3);

  ctx.font = 'bold 9.5px Arial, sans-serif';
  ctx.fillStyle = '#2563eb';
  ctx.fillText('VALIDATED & RECORDED', cx, cy + 12);

  return canvas.toDataURL('image/png');
}

export function generateSampleSignature(signatoryName: string = 'Sunil Kumar'): string {
  if (typeof document === 'undefined') return '';
  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 120;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  const inkColor = '#1e3a8a';
  ctx.strokeStyle = inkColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Draw natural cursive signature strokes
  ctx.beginPath();
  ctx.moveTo(35, 75);
  ctx.bezierCurveTo(45, 20, 70, 15, 80, 55);
  ctx.bezierCurveTo(90, 80, 105, 30, 125, 45);
  ctx.bezierCurveTo(145, 60, 160, 30, 185, 40);
  ctx.bezierCurveTo(210, 50, 230, 25, 260, 35);
  ctx.stroke();

  // Underline flourish
  ctx.beginPath();
  ctx.lineWidth = 2.5;
  ctx.moveTo(50, 75);
  ctx.quadraticCurveTo(140, 108, 280, 75);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(240, 42);
  ctx.lineTo(248, 58);
  ctx.moveTo(255, 46);
  ctx.lineTo(262, 62);
  ctx.stroke();

  // Typed signatory name underneath
  ctx.font = 'italic 11px sans-serif';
  ctx.fillStyle = '#475569';
  ctx.fillText(signatoryName, 40, 110);

  return canvas.toDataURL('image/png');
}

/**
 * Reads a File object as Data URL
 */
export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}
