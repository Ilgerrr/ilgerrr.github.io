// Small, safe markdown renderer for note previews (escapes everything first).
import { escapeHtml } from './util.js';

function inline(s) {
  return s
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/!\[\[([^\]]+)\]\]/g, '<span class="muted">[$1]</span>')
    .replace(/\[\[([^\]|#^]+)(?:[#^][^\]|]*)?(?:\|([^\]]+))?\]\]/g, (_, t, a) => `<a class="wl" data-note="${t.trim()}">${(a || t).trim()}</a>`)
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/(^|[^*])\*([^*\n]+)\*/g, '$1<i>$2</i>')
    .replace(/==([^=]+)==/g, '<mark>$1</mark>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '<a data-href="$2">$1</a>');
}

export function renderMarkdown(src, maxChars = 6000) {
  let text = src.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/, '');
  if (text.length > maxChars) text = text.slice(0, maxChars) + '\n\n…';
  const lines = escapeHtml(text).split(/\r?\n/);
  const out = [];
  let list = false, code = false, para = [];
  const flush = () => { if (para.length) { out.push('<p>' + inline(para.join(' ')) + '</p>'); para = []; } };
  const endList = () => { if (list) { out.push('</ul>'); list = false; } };
  for (const line of lines) {
    if (/^```/.test(line)) { flush(); endList(); out.push(code ? '</code></pre>' : '<pre><code>'); code = !code; continue; }
    if (code) { out.push(line + '\n'); continue; }
    let m;
    if ((m = line.match(/^(#{1,6})\s+(.*)$/))) { flush(); endList(); const l = Math.min(4, m[1].length); out.push(`<h${l}>${inline(m[2])}</h${l}>`); continue; }
    if ((m = line.match(/^\s*[-*+]\s+\[( |x|X)\]\s+(.*)$/))) { flush(); if (!list) { out.push('<ul>'); list = true; } out.push(`<li class="task">${m[1] === ' ' ? '○' : '●'} ${inline(m[2])}</li>`); continue; }
    if ((m = line.match(/^\s*(?:[-*+]|\d+\.)\s+(.*)$/))) { flush(); if (!list) { out.push('<ul>'); list = true; } out.push(`<li>${inline(m[1])}</li>`); continue; }
    if ((m = line.match(/^&gt;\s?(.*)$/))) { flush(); endList(); out.push(`<blockquote>${inline(m[1])}</blockquote>`); continue; }
    if (/^\s*(-{3,}|\*{3,})\s*$/.test(line)) { flush(); endList(); out.push('<hr>'); continue; }
    if (!line.trim()) { flush(); endList(); continue; }
    endList();
    para.push(line.trim());
  }
  flush(); endList();
  if (code) out.push('</code></pre>');
  return out.join('') || '<p class="muted">Lege notitie.</p>';
}
