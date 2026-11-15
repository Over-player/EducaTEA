/* =====================================================================
   EducaTEA – OS JOGOS (jogos.js)
   Palavras (9) · Matemática (10) · Ciências (11)
   Depende de: jogos-base.js (motor) e jogos-dados.js (conteúdo).
   ===================================================================== */
'use strict';

/* ---------- ajudantes ---------- */
const letrasABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

// sorteia n índices evitando os que já saíram (a memória fica salva no progresso)
JG.sortearSemRepetir = function (nome, tamanho, n, filtro) {
    const h = estadoAtual.historicoPerguntas;
    if (!h[nome]) h[nome] = [];
    let candidatos = [];
    for (let i = 0; i < tamanho; i++) if (!filtro || filtro(i)) candidatos.push(i);
    let livres = candidatos.filter(i => !h[nome].includes(i));
    if (livres.length < n) { h[nome] = h[nome].filter(i => !candidatos.includes(i)); livres = candidatos.slice(); }
    const escolhidos = JG.sortear(livres, Math.min(n, livres.length));
    escolhidos.forEach(i => h[nome].push(i));
    return escolhidos;
};

// opções numéricas perto da resposta
JG.numOpcoes = function (c, n, lo, hi) {
    n = n || 4; lo = lo === undefined ? 0 : lo; hi = hi === undefined ? 9999 : hi;
    const s = new Set([c]);
    const amp = c > 30 ? 10 : (c > 10 ? 5 : 3);
    let guard = 0;
    while (s.size < n && guard++ < 300) {
        const d = c + JG.rnd(-amp, amp);
        if (d >= lo && d <= hi && d !== c) s.add(d);
    }
    let k = 1;
    while (s.size < n) { if (c + k <= hi) s.add(c + k); if (s.size < n && c - k >= lo) s.add(c - k); k++; if (k > 50) break; }
    return JG.embaralhar([...s]);
};

const EMOJIS_CONTAR = ['🍎', '🍪', '🍓', '🌟', '🐥', '🎈', '🚗', '🌸', '🐟', '🍌'];
const grupo = (emoji, n, extra) => `<span class="jg-grupo">${Array.from({ length: n }, (_, i) => `<span${extra && extra(i) ? ` class="${extra(i)}"` : ''}>${emoji}</span>`).join('')}</span>`;

/* =====================================================================
   MATEMÁTICA
   ===================================================================== */
/* ---------- interações reutilizáveis ---------- */
// arraste (ou toque na peça e depois no destino). cfg: {pecas:[{valor,html}], confere(valorPeca, alvoEl)->bool, dica, explicacao, resposta, max, revelar()}
function arrastarResposta(corpo, cfg) {
    const banco = document.createElement('div');
    banco.className = 'jg-banco jg-banco-resp';
    banco.innerHTML = cfg.pecas.map(p => `<button type="button" class="jg-item jg-tile jg-peca-resp" data-valor="${JG.esc(p.valor)}">${p.html}</button>`).join('');
    corpo.appendChild(banco);
    JG.mover(corpo, {
        item: '.jg-peca-resp', alvo: '.jg-alvo-r',
        aoSoltar(it, alvo) {
            if (JG.q.resolvida || it.disabled) return;
            const certo = cfg.confere(it.dataset.valor, alvo);
            if (certo) {
                it.dataset.bloqueado = '1'; it.classList.add('jg-tile-ok');
                if (alvo.classList.contains('jg-interr')) { alvo.textContent = it.textContent; alvo.classList.add('jg-interr-ok'); it.style.visibility = 'hidden'; }
                else { alvo.classList.add('jg-alvo-ok'); alvo.appendChild(it); }
                banco.querySelectorAll('.jg-peca-resp').forEach(b => { b.dataset.bloqueado = '1'; });
                JG.certo({ explicacao: typeof cfg.explicacao === 'function' ? cfg.explicacao() : cfg.explicacao });
            } else {
                it.dataset.bloqueado = '1'; it.disabled = true; it.classList.add('jg-tile-erro');
                alvo.classList.add('jg-tremer'); setTimeout(() => alvo.classList.remove('jg-tremer'), 500);
                JG.errado({
                    dica: typeof cfg.dica === 'function' ? cfg.dica() : cfg.dica,
                    explicacao: typeof cfg.explicacao === 'function' ? cfg.explicacao() : cfg.explicacao,
                    resposta: cfg.resposta, max: cfg.max || 2,
                    revelar() {
                        banco.querySelectorAll('.jg-peca-resp').forEach(b => { b.dataset.bloqueado = '1'; });
                        if (cfg.revelar) cfg.revelar(banco);
                    }
                });
            }
        }
    });
    return banco;
}

// toque em cada desenho para contar (1, 2, 3...)
function ativarContar(corpo) {
    const itens = [...corpo.querySelectorAll('.jg-visual .jg-grupo > span')];
    if (!itens.length) return;
    let n = 0;
    const p = document.createElement('p'); p.className = 'jg-contador'; p.innerHTML = 'Contei: <b>0</b>';
    corpo.querySelector('.jg-card').appendChild(p);
    const marcar = el => {
        if (el.dataset.feito) return; el.dataset.feito = '1'; n++;
        el.classList.add('jg-obj-contado'); el.insertAdjacentHTML('beforeend', `<span class="jg-num">${n}</span>`);
        p.querySelector('b').textContent = n;
    };
    itens.forEach(el => {
        el.classList.add('jg-tocavel'); el.tabIndex = 0; el.setAttribute('role', 'button');
        el.addEventListener('click', () => marcar(el));
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); marcar(el); } });
    });
}

// toque nos desenhos para TIRAR (subtração); ao tirar todos, libera as respostas e dá para contar os que sobraram
function ativarTirar(corpo, qtd, pronto) {
    const itens = [...corpo.querySelectorAll('.jg-visual .jg-grupo > span')];
    let tirados = 0, c = 0;
    const p = document.createElement('p'); p.className = 'jg-contador';
    const atualiza = () => { p.innerHTML = tirados < qtd ? `Faltam tirar: <b>${qtd - tirados}</b>` : 'Sobraram: <b>' + c + '</b> (toque nos que ficaram para contar)'; };
    corpo.querySelector('.jg-card').appendChild(p); atualiza();
    const clicar = el => {
        if (tirados < qtd) {
            if (el.dataset.feito) return;
            el.dataset.feito = '1'; tirados++; el.classList.add('jg-tirado', 'jg-saindo');
            if (tirados === qtd) { atualiza(); pronto(); }
            else atualiza();
        } else if (!el.dataset.feito && !el.dataset.cont) {
            el.dataset.cont = '1'; c++; el.classList.add('jg-obj-contado'); el.insertAdjacentHTML('beforeend', `<span class="jg-num">${c}</span>`); atualiza();
        }
    };
    itens.forEach(el => {
        el.classList.add('jg-tocavel'); el.tabIndex = 0; el.setAttribute('role', 'button');
        el.addEventListener('click', () => clicar(el));
        el.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clicar(el); } });
    });
}

// toque nos números na ordem pedida
function ordemPorToque(corpo, d, cfg) {
    const banco = document.createElement('div');
    banco.className = 'jg-opcoes jg-opcoes-grandes jg-ordem';
    banco.innerHTML = d.opcoes.map(n => `<button type="button" class="jg-op" data-valor="${n}">${n}</button>`).join('');
    corpo.appendChild(banco);
    let pos = 0;
    const fim = () => banco.querySelectorAll('.jg-op').forEach(b => { b.disabled = true; });
    banco.addEventListener('click', e => {
        const b = e.target.closest('.jg-op'); if (!b || b.disabled || JG.q.resolvida) return;
        if (Number(b.dataset.valor) === d.ordem[pos]) {
            pos++; b.disabled = true; b.classList.add('jg-op-ok'); b.insertAdjacentHTML('beforeend', `<span class="jg-selo">${pos}º</span>`);
            if (pos === d.ordem.length) { fim(); JG.certo({ explicacao: d.explicacao }); }
        } else {
            b.classList.add('jg-tremer'); setTimeout(() => b.classList.remove('jg-tremer'), 500);
            JG.errado({
                dica: d.dica, explicacao: d.explicacao, resposta: d.ordem.join(' → '), max: 3,
                revelar() { fim(); d.ordem.forEach((n, i) => { const x = banco.querySelector(`.jg-op[data-valor="${n}"]`); if (x && !x.classList.contains('jg-op-ok')) { x.classList.add('jg-op-ok'); x.insertAdjacentHTML('beforeend', `<span class="jg-selo">${i + 1}º</span>`); } }); }
            });
        }
    });
}

// relógio com ponteiros ajustáveis
function ajustarRelogio(corpo, d) {
    const passoM = d.passoMin || 30;
    const est = { h: ((d.h + JG.rnd(2, 8) - 1) % 12) + 1, m: JG.um([0, 30].filter(x => x !== d.m).concat([15])) };
    if (est.h === d.h && est.m === d.m) est.h = (est.h % 12) + 1;
    const alvo = hhmm(d.h, d.m);
    const w = document.createElement('div'); w.className = 'jg-ajuste';
    w.innerHTML = `<div class="jg-ajuste-rel"></div><p class="jg-ajuste-hora" id="jg-ajuste-hora"></p>
      <div class="jg-ajuste-btns">
        <button type="button" class="jg-op" data-a="h-">➖ Hora</button><button type="button" class="jg-op" data-a="h+">➕ Hora</button>
        <button type="button" class="jg-op" data-a="m-">➖ Minutos</button><button type="button" class="jg-op" data-a="m+">➕ Minutos</button>
      </div><button type="button" class="btn-verificar jg-conferir">✅ Conferir</button>`;
    corpo.appendChild(w);
    const pinta = () => { w.querySelector('.jg-ajuste-rel').innerHTML = svgRelogio(est.h, est.m); w.querySelector('#jg-ajuste-hora').textContent = hhmm(est.h, est.m); };
    pinta();
    w.addEventListener('click', e => {
        const b = e.target.closest('[data-a]'); if (!b || JG.q.resolvida) return;
        const a = b.dataset.a;
        if (a === 'h+') est.h = est.h % 12 + 1; if (a === 'h-') est.h = est.h === 1 ? 12 : est.h - 1;
        if (a === 'm+') est.m = (est.m + passoM) % 60; if (a === 'm-') est.m = (est.m - passoM + 60) % 60;
        pinta();
    });
    w.querySelector('.jg-conferir').onclick = () => {
        if (JG.q.resolvida) return;
        if (hhmm(est.h, est.m) === alvo) { w.querySelectorAll('button').forEach(b => { b.disabled = true; }); JG.certo({ explicacao: d.explicacao }); }
        else JG.errado({
            dica: est.h !== d.h ? 'Ainda não é a hora certa. O ponteiro CURTO mostra a hora: coloque-o no ' + d.h + '.' : 'A hora está certa! Agora ajuste o ponteiro LONGO (minutos).',
            explicacao: d.explicacao, resposta: alvo, max: 3,
            revelar() { est.h = d.h; est.m = d.m; pinta(); w.querySelectorAll('button').forEach(b => { b.disabled = true; }); }
        });
    };
}

function desenharPerguntaNumerica(d, corpo) {
    corpo.innerHTML = `<div class="jg-card"><p class="jg-pergunta">${d.pergunta}</p>${d.instrucao ? `<p class="jg-instrucao-sub">${d.instrucao}</p>` : ''}${d.visual ? `<div class="jg-visual">${d.visual}</div>` : ''}</div>`;
    const cfg = { dica: d.dica, explicacao: d.explicacao, resposta: d.respostaTexto !== undefined ? d.respostaTexto : d.correta, max: d.max || 2, classe: d.classeOpcoes || '' };
    const opcoes = () => {
        if (d.opcoes) JG.escolhas(corpo, d.opcoes.map(o => ({ valor: o.valor !== undefined ? o.valor : o, html: o.html !== undefined ? o.html : String(o) })), d.correta, cfg);
        else JG.campo(corpo, { tipo: 'number', comparar: v => Number(v) === d.correta, dica: d.dica, explicacao: d.explicacao, resposta: d.correta, max: 3 });
    };
    if (d.ajustar) return ajustarRelogio(corpo, d.ajustar);
    if (d.ordem) return ordemPorToque(corpo, d, cfg);
    if (d.soltar) {
        const slot = corpo.querySelector('.jg-interr'); if (slot) slot.classList.add('jg-alvo-r');
        return arrastarResposta(corpo, {
            pecas: d.opcoes.map(o => ({ valor: String(o), html: String(o) })),
            confere: v => v === String(d.correta), dica: d.dica, explicacao: d.explicacao, resposta: d.correta, max: 2,
            revelar() { if (slot) { slot.textContent = d.correta; slot.classList.add('jg-interr-ok'); } }
        });
    }
    if (d.baldes) {
        const bx = document.createElement('div'); bx.className = 'jg-baldes-2';
        bx.innerHTML = d.baldes.map(b => `<div class="jg-alvo-r jg-balde-resp" data-valor="${b.valor}" role="button" tabindex="0"><span class="jg-balde-emoji">${b.emoji}</span><b>${b.nome}</b></div>`).join('');
        corpo.appendChild(bx);
        return arrastarResposta(corpo, {
            pecas: [{ valor: 'peca', html: d.peca }],
            confere: (v, alvo) => alvo.dataset.valor === String(d.correta), dica: d.dica, explicacao: d.explicacao,
            resposta: (d.baldes.find(b => b.valor === d.correta) || {}).nome, max: 2,
            revelar() { const c = bx.querySelector(`[data-valor="${d.correta}"]`); if (c) c.classList.add('jg-alvo-ok'); }
        });
    }
    if (d.tirar) { ativarTirar(corpo, d.tirar, opcoes); return; }
    if (d.contar) ativarContar(corpo);
    opcoes();
}
const dicaPadrao = d => { if (JG.q.cincoZero) JG.q.cincoZero(); return d.dica || 'Respire fundo e pense com calma. Você consegue! 🌈'; };

function defMat(nome, emoji, gerar, tipo) {
    JG.jogos[nome] = { emoji, tipo: tipo || 'ACERTO_DIFICIL', total: 5, nova: () => gerar(JG.faixa()), desenhar: desenharPerguntaNumerica, dica: dicaPadrao };
}

/* ➕ Soma Criativa */
defMat('Soma Criativa', '➕', f => {
    let a, b;
    if (f === 1) { a = JG.rnd(1, 5); b = JG.rnd(1, 5); }
    else if (f === 2) { a = JG.rnd(3, 10); b = JG.rnd(3, 10); }
    else { a = JG.rnd(12, 45); b = JG.rnd(5, 35); }
    const c = a + b, em = JG.um(EMOJIS_CONTAR);
    return {
        pergunta: f === 3 ? `Quanto é ${a} + ${b}?` : 'Junte os dois grupos. Quantos ficam no total?',
        visual: f === 3 ? `<span class="jg-conta">${a} + ${b} = ?</span>` : `${grupo(em, a)} <b class="jg-op-sinal">+</b> ${grupo(em, b)} <span class="jg-conta">= ?</span>`,
        correta: c, opcoes: f === 3 ? null : JG.numOpcoes(c, 4, 1, 25), contar: f !== 3,
        instrucao: f === 3 ? '' : '👆 Toque em cada desenho para contar todos juntos.',
        dica: f === 3 ? 'Some primeiro as unidades e depois as dezenas.' : 'Toque em cada desenho, um por um. O último número é o total.',
        explicacao: `${a} + ${b} = <b>${c}</b>. Juntando ${a} com ${b}, ficamos com ${c}.`
    };
});

/* ➖ Subtração Divertida */
defMat('Subtração Divertida', '➖', f => {
    let a, b;
    if (f === 1) { a = JG.rnd(3, 8); b = JG.rnd(1, a - 1); }
    else if (f === 2) { a = JG.rnd(8, 20); b = JG.rnd(2, a - 1); }
    else { a = JG.rnd(25, 70); b = JG.rnd(5, a - 3); }
    const c = a - b, em = JG.um(EMOJIS_CONTAR);
    return {
        pergunta: f === 3 ? `Quanto é ${a} − ${b}?` : `Tinha ${a}. Tiraram ${b}. Quantos sobraram?`,
        visual: f === 3 ? `<span class="jg-conta">${a} − ${b} = ?</span>` : grupo(em, a),
        correta: c, opcoes: f === 3 ? null : JG.numOpcoes(c, 4, 0, 25), tirar: f === 3 ? 0 : b,
        instrucao: f === 3 ? '' : `👆 Toque em <b>${b}</b> ${b === 1 ? 'desenho' : 'desenhos'} para tirá-${b === 1 ? 'lo' : 'los'}.`,
        dica: f === 3 ? 'Comece em ' + a + ' e volte ' + b + ' passos.' : `Toque em ${b} desenhos para tirar. Depois conte os que ficaram.`,
        explicacao: `${a} − ${b} = <b>${c}</b>. De ${a}, tirando ${b}, sobram ${c}.`
    };
});

/* 🔢 Contagem (sequência de números: antes, depois, o que falta) */
defMat('Contagem', '🔢', f => {
    const max = f === 1 ? 10 : (f === 2 ? 50 : 199);
    const n = JG.rnd(2, max - 2);
    const tipo = JG.um(['depois', 'antes', 'falta']);
    if (tipo === 'depois') return { pergunta: `Qual número vem logo DEPOIS do ${n}?`, visual: `<span class="jg-conta">${n} → <span class="jg-interr">?</span></span>`, soltar: true, instrucao: '👆 Arraste o número certo até o espaço vazio (ou toque nele e depois no espaço).', correta: n + 1, opcoes: JG.numOpcoes(n + 1, 4, 0, max + 5), dica: 'Contando, é o próximo número da fila.', explicacao: `Depois do ${n} vem o <b>${n + 1}</b>.` };
    if (tipo === 'antes') return { pergunta: `Qual número vem logo ANTES do ${n}?`, visual: `<span class="jg-conta"><span class="jg-interr">?</span> → ${n}</span>`, soltar: true, instrucao: '👆 Arraste o número certo até o espaço vazio (ou toque nele e depois no espaço).', correta: n - 1, opcoes: JG.numOpcoes(n - 1, 4, 0, max + 5), dica: 'Conte de trás para a frente.', explicacao: `Antes do ${n} vem o <b>${n - 1}</b>.` };
    return { pergunta: 'Qual número está faltando?', visual: `<span class="jg-conta">${n - 1} → <span class="jg-interr">?</span> → ${n + 1}</span>`, soltar: true, instrucao: '👆 Arraste o número certo até o espaço vazio (ou toque nele e depois no espaço).', correta: n, opcoes: JG.numOpcoes(n, 4, 0, max + 5), dica: 'Ele fica entre os outros dois.', explicacao: `Entre ${n - 1} e ${n + 1} está o <b>${n}</b>.` };
});

/* 📊 Qual é o Maior? */
defMat('Qual é o Maior?', '📊', f => {
    const faixa = f === 1 ? [1, 10] : (f === 2 ? [5, 60] : [20, 199]);
    const qtd = f === 1 ? 2 : 3;
    const nums = new Set();
    while (nums.size < qtd) nums.add(JG.rnd(faixa[0], faixa[1]));
    const arr = JG.embaralhar([...nums]);
    const menor = f >= 2 && Math.random() < 0.5;
    const c = menor ? Math.min(...arr) : Math.max(...arr);
    const outro = menor ? Math.max(...arr) : Math.min(...arr);
    if (f >= 2) {
        const cresc = Math.random() < 0.5, ord = [...arr].sort((x, y) => cresc ? x - y : y - x);
        return {
            pergunta: cresc ? 'Coloque em ordem, do MENOR para o MAIOR.' : 'Coloque em ordem, do MAIOR para o MENOR.', instrucao: '👆 Toque nos números, um de cada vez, na ordem certa.',
            visual: '', ordem: ord, opcoes: arr, dica: 'Compare primeiro as dezenas (o algarismo da esquerda). Qual número é ' + (cresc ? 'o menor de todos?' : 'o maior de todos?'),
            explicacao: `A ordem é <b>${ord.join(' → ')}</b>. ${cresc ? 'Quanto mais cedo na contagem, menor o número.' : 'Quanto mais longe na contagem, maior o número.'}`
        };
    }
    return {
        pergunta: menor ? 'Qual número é o MENOR?' : 'Qual número é o MAIOR?',
        visual: f === 1 ? arr.map(n => `<span class="jg-bloco">${n}<small>${grupo('🔵', n)}</small></span>`).join('') : '',
        correta: c, opcoes: arr, classeOpcoes: 'jg-opcoes-grandes',
        dica: f === 1 ? 'Quem tem mais bolinhas é o maior.' : 'Compare primeiro os algarismos da esquerda (as dezenas).',
        explicacao: menor ? `<b>${c}</b> é menor que ${outro}: na contagem ele vem antes.` : `<b>${c}</b> é maior que ${outro}: na contagem ele vem depois.`
    };
});

/* ➡️ Sequência */
defMat('Sequência', '➡️', f => {
    const passos = f === 1 ? [1, 2] : (f === 2 ? [2, 3, 5, 10] : [3, 4, 6, 7, 9, 10, -2, -5]);
    const p = JG.um(passos);
    const ini = p < 0 ? JG.rnd(30, 60) : JG.rnd(0, f === 1 ? 5 : 20);
    const seq = Array.from({ length: 5 }, (_, i) => ini + p * i);
    const pos = f === 1 ? 4 : JG.um([2, 3, 4]);
    const c = seq[pos];
    const txt = seq.map((n, i) => i === pos ? '<span class="jg-interr">?</span>' : n).join(' <i>→</i> ');
    return {
        pergunta: 'Qual número continua a sequência?', visual: `<span class="jg-conta">${txt}</span>`,
        correta: c, opcoes: JG.numOpcoes(c, 4, 0, 200), soltar: true, instrucao: '👆 Arraste o número que continua a sequência até o espaço vazio.',
        dica: 'Veja quanto muda de um número para o seguinte.',
        explicacao: `${p > 0 ? 'A cada passo soma +' + p : 'A cada passo diminui ' + Math.abs(p)}: ${seq.join(' → ')}. O que faltava era <b>${c}</b>.`
    };
});

/* ⬛ Formas Geométricas (desenhos em SVG) */
const FORMAS = {
    'círculo': { lados: 0, svg: '<circle cx="50" cy="50" r="38"/>' },
    'quadrado': { lados: 4, svg: '<rect x="14" y="14" width="72" height="72"/>' },
    'triângulo': { lados: 3, svg: '<polygon points="50,12 90,86 10,86"/>' },
    'retângulo': { lados: 4, svg: '<rect x="6" y="26" width="88" height="48"/>' },
    'estrela': { lados: 10, svg: '<polygon points="50,8 61,38 93,38 67,57 77,89 50,70 23,89 33,57 7,38 39,38"/>' },
    'losango': { lados: 4, svg: '<polygon points="50,8 90,50 50,92 10,50"/>' },
    'pentágono': { lados: 5, svg: '<polygon points="50,8 92,38 76,88 24,88 8,38"/>' },
    'hexágono': { lados: 6, svg: '<polygon points="26,12 74,12 96,50 74,88 26,88 4,50"/>' }
};
const svgForma = (nome, cls) => `<svg viewBox="0 0 100 100" class="jg-forma ${cls || ''}" role="img" aria-label="${nome}">${FORMAS[nome].svg}</svg>`;
const OBJETOS_FORMA = [['🍕', 'uma fatia de pizza', 'triângulo'], ['🕒', 'um relógio de parede', 'círculo'], ['🚪', 'uma porta', 'retângulo'], ['💎', 'um diamante', 'losango'], ['🧇', 'um quadradinho de waffle', 'quadrado']];
defMat('Formas Geométricas', '⬛', f => {
    const nomes = f === 1 ? ['círculo', 'quadrado', 'triângulo'] : (f === 2 ? ['círculo', 'quadrado', 'triângulo', 'retângulo', 'estrela', 'losango'] : Object.keys(FORMAS));
    const tipo = JG.um(f === 1 ? ['achar', 'achar', 'lados'] : ['achar', 'lados', 'objeto']);
    if (tipo === 'lados') {
        const n = JG.um(nomes.filter(x => x !== 'estrela'));
        const c = FORMAS[n].lados;
        const ops = JG.embaralhar([...new Set([c, 0, 3, 4, 5, 6])]).slice(0, 4);
        if (!ops.includes(c)) ops[0] = c;
        return {
            pergunta: `Quantos lados tem o ${n}?`, visual: svgForma(n, 'jg-forma-grande'),
            correta: c, opcoes: JG.embaralhar(ops), dica: 'Conte os cantinhos (vértices) ou os lados retos, um por um. O círculo não tem lados retos.',
            explicacao: c === 0 ? 'O círculo é redondinho: <b>não tem lados retos</b>.' : `O ${n} tem <b>${c} lados</b>.`
        };
    }
    if (tipo === 'objeto') {
        const o = JG.um(OBJETOS_FORMA.filter(x => nomes.includes(x[2])));
        const ops = JG.sortear(nomes.filter(x => x !== o[2]), 3).concat(o[2]);
        return {
            pergunta: `Qual forma lembra ${o[1]}? ${o[0]}`, visual: '',
            correta: o[2], opcoes: JG.embaralhar(ops).map(n => ({ valor: n, html: `${svgForma(n, 'jg-forma-peq')}<span class="jg-forma-nome">${n}</span>` })),
            classeOpcoes: 'jg-opcoes-formas', dica: 'Pense no contorno do objeto.', explicacao: `${o[1][0].toUpperCase() + o[1].slice(1)} tem a forma de um <b>${o[2]}</b>.`
        };
    }
    const alvo = JG.um(nomes);
    const ops = JG.sortear(nomes.filter(x => x !== alvo), 3).concat(alvo);
    return {
        pergunta: `Toque no ${alvo}.`, visual: '',
        correta: alvo, opcoes: JG.embaralhar(ops).map(n => ({ valor: n, html: svgForma(n, 'jg-forma-peq') })),
        classeOpcoes: 'jg-opcoes-formas', dica: alvo === 'círculo' ? 'É a forma redondinha, sem cantos.' : `O ${alvo} tem ${FORMAS[alvo].lados} lados.`,
        explicacao: `Isso mesmo! Esse é o <b>${alvo}</b>.`
    };
});

/* ⏰ Relógio Digital (relógio de ponteiros -> horário digital) */
function svgRelogio(h, m) {
    const ang = (h % 12 + m / 60) * 30, angM = m * 6;
    const nums = Array.from({ length: 12 }, (_, i) => { const a = ((i + 1) * 30 - 90) * Math.PI / 180; return `<text x="${100 + 76 * Math.cos(a)}" y="${100 + 76 * Math.sin(a) + 6}" text-anchor="middle">${i + 1}</text>`; }).join('');
    return `<svg viewBox="0 0 200 200" class="jg-relogio" role="img" aria-label="Relógio de ponteiros"><circle cx="100" cy="100" r="94" class="jg-rel-fundo"/>${nums}
        <line x1="100" y1="100" x2="100" y2="52" class="jg-rel-h" transform="rotate(${ang} 100 100)"/>
        <line x1="100" y1="100" x2="100" y2="28" class="jg-rel-m" transform="rotate(${angM} 100 100)"/><circle cx="100" cy="100" r="6" class="jg-rel-centro"/></svg>`;
}
const hhmm = (h, m) => String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
defMat('Relógio Digital', '⏰', f => {
    const h = JG.rnd(1, 12);
    const m = f === 1 ? 0 : (f === 2 ? JG.um([0, 30]) : JG.um([0, 15, 30, 45]));
    const c = hhmm(h, m);
    const ops = new Set([c]);
    let guarda = 0;
    while (ops.size < 4 && guarda++ < 300) { const hh = JG.um([h, h, ((h % 12) + 1), ((h + 10) % 12) + 1, ((h + 1) % 12) + 1, ((h + 9) % 12) + 1]); const mm = f === 1 ? 0 : JG.um([0, 15, 30, 45]); ops.add(hhmm(hh, mm)); }
    const exp = m === 0 ? `O ponteiro curto (das horas) está no ${h} e o ponteiro longo (dos minutos) está no 12. São <b>${h} horas</b> em ponto: ${c}.`
        : m === 30 ? `O ponteiro curto está entre o ${h} e o ${h % 12 + 1}, e o longo está no 6, que vale 30 minutos. São ${h} e meia: <b>${c}</b>.`
            : m === 15 ? `O ponteiro longo está no 3, que vale 15 minutos. São ${h} e quinze: <b>${c}</b>.` : `O ponteiro longo está no 9, que vale 45 minutos. São ${h} e quarenta e cinco: <b>${c}</b>.`;
    if (f >= 2 && Math.random() < 0.5) return { pergunta: `Ajuste o relógio para marcar ${c}.`, instrucao: '👆 Use os botões para mexer nos ponteiros e depois toque em Conferir.', ajustar: { h, m, passoMin: f === 2 ? 30 : 15, explicacao: exp }, visual: '' };
    return {
        pergunta: 'Que horas o relógio está marcando?', visual: svgRelogio(h, m), correta: c, opcoes: JG.embaralhar([...ops]),
        classeOpcoes: 'jg-opcoes-grandes', dica: 'O ponteiro curto mostra as horas. O ponteiro longo mostra os minutos (no 12 = em ponto; no 6 = meia hora).',
        explicacao: exp, respostaTexto: c
    };
});

/* 🔢 Pares e Ímpares */
defMat('Pares e Ímpares', '🔢', f => {
    const max = f === 1 ? 10 : (f === 2 ? 30 : 99);
    const tipo = f === 1 ? 'tipo' : JG.um(['tipo', 'qual']);
    if (tipo === 'tipo') {
        const n = JG.rnd(1, max);
        const par = n % 2 === 0;
        const visual = n <= 12 ? `<div class="jg-pares">${Array.from({ length: Math.floor(n / 2) }, () => `<span class="jg-par">🔵🔵</span>`).join('')}${n % 2 ? '<span class="jg-par jg-sobra">🟠</span>' : ''}</div>` : `<span class="jg-conta">${n}</span>`;
        return {
            pergunta: `O número ${n} é par ou ímpar?`, visual, correta: par ? 'PAR' : 'ÍMPAR', instrucao: '👆 Arraste o número para a casa certa (ou toque nele e depois na casa).',
            peca: `<span class="jg-conta">${n}</span>`, baldes: [{ valor: 'PAR', emoji: '👯', nome: 'PAR' }, { valor: 'ÍMPAR', emoji: '🧍', nome: 'ÍMPAR' }],
            dica: n <= 12 ? 'Dá para formar pares sem sobrar nenhum? Se sobrar um, é ímpar.' : 'Olhe o último algarismo: 0, 2, 4, 6 ou 8 é par.',
            explicacao: par ? `${n} é <b>par</b>: dá para dividir em pares sem sobrar nenhum.` : `${n} é <b>ímpar</b>: sempre sobra um sem par.`
        };
    }
    const pares = new Set(); while (pares.size < 1) pares.add(JG.rnd(1, max));
    let c = [...pares][0]; if (c % 2) c = c + 1 > max ? c - 1 : c + 1;
    const ops = new Set([c]);
    while (ops.size < 3) { let n = JG.rnd(1, max); if (n % 2) ops.add(n); }
    const par = Math.random() < 0.5;
    const correta = par ? c : [...ops].find(x => x % 2);
    const opcoes = par ? [...ops] : [...[...ops].filter(x => x % 2).slice(0, 1), ...[...new Set([JG.rnd(1, max) * 2 > max ? 2 : JG.rnd(1, Math.floor(max / 2)) * 2, JG.rnd(1, Math.floor(max / 2)) * 2])].slice(0, 2)];
    const fim = new Set(opcoes);
    while (fim.size < 3) fim.add(JG.rnd(1, max));
    const lista = [...fim];
    const certa = par ? lista.find(x => x % 2 === 0 && x === c) || lista.find(x => x % 2 === 0) : lista.find(x => x % 2);
    // garante que só há uma resposta certa
    const so = lista.filter(x => par ? x % 2 === 0 : x % 2 === 1);
    let final = lista;
    if (so.length !== 1) {
        const alvo = par ? 2 * JG.rnd(1, Math.floor(max / 2)) : 2 * JG.rnd(0, Math.floor((max - 1) / 2)) + 1;
        const outros = new Set();
        while (outros.size < 2) { const n = JG.rnd(1, max); if ((n % 2 === 0) !== par && n !== alvo) outros.add(n); }
        final = [alvo, ...outros];
        return { pergunta: par ? 'Qual destes números é PAR?' : 'Qual destes números é ÍMPAR?', visual: '', correta: alvo, opcoes: JG.embaralhar(final), classeOpcoes: 'jg-opcoes-grandes', dica: 'Números pares terminam em 0, 2, 4, 6 ou 8.', explicacao: `<b>${alvo}</b> é ${par ? 'par' : 'ímpar'}: termina em ${alvo % 10}.` };
    }
    return { pergunta: par ? 'Qual destes números é PAR?' : 'Qual destes números é ÍMPAR?', visual: '', correta: certa, opcoes: JG.embaralhar(final), classeOpcoes: 'jg-opcoes-grandes', dica: 'Números pares terminam em 0, 2, 4, 6 ou 8.', explicacao: `<b>${certa}</b> é ${par ? 'par' : 'ímpar'}: termina em ${certa % 10}.` };
});

/* 🔟 Contagem de Objetos: toque em cada figura para contar */
JG.jogos['Contagem de Objetos'] = {
    emoji: '🔟', tipo: 'ACERTO_SIMPLES', total: 5,
    instrucao: '👆 Toque em cada figura para <b>contar</b>. Depois escolha o número.',
    nova() {
        const f = JG.faixa();
        const n = f === 1 ? JG.rnd(2, 6) : (f === 2 ? JG.rnd(4, 10) : JG.rnd(7, 14));
        const [em, nome, plural, fem] = JG.um([['🍎', 'maçã', 'maçãs', 1], ['🐟', 'peixe', 'peixes'], ['⭐', 'estrela', 'estrelas', 1], ['🎈', 'balão', 'balões'], ['🐥', 'pintinho', 'pintinhos'], ['🍪', 'biscoito', 'biscoitos'], ['🚗', 'carro', 'carros'], ['🌸', 'flor', 'flores', 1]]);
        let outros = [];
        if (f >= 2) {
            const em2 = JG.um(['🍌', '🍇', '🐸', '🌙', '🏀', '🧸'].filter(e => e !== em));
            outros = Array.from({ length: f === 2 ? JG.rnd(1, 3) : JG.rnd(3, 5) }, () => em2);
        }
        const itens = JG.embaralhar([...Array.from({ length: n }, () => ({ e: em, conta: true })), ...outros.map(e => ({ e, conta: false }))]);
        return { n, em, nome, plural, fem: !!fem, itens, temOutros: outros.length > 0 };
    },
    desenhar(d, corpo) {
        corpo.innerHTML = `<div class="jg-card"><p class="jg-pergunta">${d.fem ? 'Quantas' : 'Quantos'} <b>${d.plural}</b> ${d.em} você vê?</p>
          <div class="jg-contar" id="jg-contar">${d.itens.map((it, i) => `<button type="button" class="jg-obj" data-conta="${it.conta ? 1 : 0}" aria-label="figura ${i + 1}">${it.e}</button>`).join('')}</div>
          <p class="jg-contador">Contei: <b id="jg-contado">0</b></p></div>`;
        let cont = 0;
        corpo.querySelector('#jg-contar').addEventListener('click', e => {
            const b = e.target.closest('.jg-obj'); if (!b || b.dataset.feito) return;
            b.dataset.feito = '1';
            if (b.dataset.conta === '1') { cont++; b.classList.add('jg-obj-contado'); b.insertAdjacentHTML('beforeend', `<span class="jg-num">${cont}</span>`); document.getElementById('jg-contado').textContent = cont; }
            else { b.classList.add('jg-obj-outro'); }
        });
        JG.escolhas(corpo, JG.numOpcoes(d.n, 4, 1, 16).map(o => ({ valor: o, html: String(o) })), d.n, {
            classe: 'jg-opcoes-grandes', dica: d.temOutros ? `Conte só os ${d.plural} ${d.em}. As outras figuras não entram na conta.` : 'Toque em cada figura, uma de cada vez, e veja o último número.',
            explicacao: `São <b>${d.n} ${d.n === 1 ? d.nome : d.plural}</b>. Tocando em cada um, o último número que aparece é o total.`, resposta: d.n
        });
    },
    dica(d) { if (JG.q.cincoZero) JG.q.cincoZero(); return d.temOutros ? `Conte só os ${d.plural} ${d.em}.` : 'Toque em cada figura para contar.'; }
};

/* 🎨 Classificação de Cores (tabuleiro) */
JG.jogos['Classificação de Cores'] = {
    emoji: '🎨', modo: 'tabuleiro', instrucao: '👆 Toque em uma figura e depois no balde da cor certa (ou arraste).',
    rotuloTabuleiro: () => `Guardadas: ${JG.q.dados ? JG.q.dados.feitas : 0} de ${JG.q.dados ? JG.q.dados.total : 0}`,
    montar(r, corpo) {
        const f = JG.faixa();
        const nB = f === 1 ? 3 : 4, porCor = f === 1 ? 2 : 3;
        const cores = JG.sortear(CORES, nB);
        let itens = [];
        cores.forEach(c => JG.sortear(c.itens, porCor).forEach(e => itens.push({ e, cor: c.id })));
        itens = JG.embaralhar(itens);
        const d = JG.q.dados = { total: itens.length, feitas: 0, errosItem: {} };
        corpo.innerHTML = `<div class="jg-baldes">${cores.map(c => `<div class="jg-balde jg-alvo" data-cor="${c.id}" style="--cor:${c.hex}" role="button" tabindex="0" aria-label="balde ${c.nome}">
            <div class="jg-balde-topo"><span class="jg-amostra" aria-hidden="true"></span><b>${c.nome}</b></div><div class="jg-balde-itens"></div></div>`).join('')}</div>
          <div class="jg-banco" id="jg-banco">${itens.map((it, i) => `<button type="button" class="jg-item jg-ficha" data-cor="${it.cor}" data-i="${i}" aria-label="figura">${it.e}</button>`).join('')}</div>`;
        const atualizar = () => { document.getElementById('jg-prog-texto').textContent = `Guardadas: ${d.feitas} de ${d.total}`; };
        atualizar();
        JG.mover(corpo, {
            item: '.jg-item', alvo: '.jg-alvo',
            aoSoltar(it, balde) {
                if (it.dataset.bloqueado === '1') return false;
                if (it.dataset.cor === balde.dataset.cor) {
                    it.dataset.bloqueado = '1'; it.classList.remove('jg-sel'); it.classList.add('jg-ficha-ok');
                    balde.querySelector('.jg-balde-itens').appendChild(it);
                    d.feitas++; atualizar(); JG.passoCerto(0.5);
                    JG.mostrarFeedback('ok', '<strong>Isso! ✅</strong>');
                    if (d.feitas === d.total) setTimeout(fim, 500);
                    return true;
                }
                JG.passoErrado();
                const k = it.dataset.i; d.errosItem[k] = (d.errosItem[k] || 0) + 1;
                const certo = corpo.querySelector(`.jg-balde[data-cor="${it.dataset.cor}"]`);
                balde.classList.add('jg-tremer'); setTimeout(() => balde.classList.remove('jg-tremer'), 500);
                if (d.errosItem[k] >= 2) { certo.classList.add('jg-pulsar'); setTimeout(() => certo.classList.remove('jg-pulsar'), 2500); }
                JG.mostrarFeedback('tente', `<strong>Quase! 💪</strong><p>💡 Olhe bem a cor desta figura e compare com o nome do balde.${d.errosItem[k] >= 2 ? ' Eu mostrei o balde certo!' : ''}</p>`);
                return false;
            }
        });
        function fim() { const e = r.erros; JG.fimRodada({ acertos: d.total, total: d.total, estrelas: e <= 1 && r.dicas === 0 ? 3 : (e <= 4 ? 2 : 1) }); }
    },
    dica() {
        const it = [...document.querySelectorAll('.jg-ficha:not([data-bloqueado="1"])')][0];
        if (!it) return false;
        const balde = document.querySelector(`.jg-balde[data-cor="${it.dataset.cor}"]`);
        it.classList.add('jg-pulsar'); balde.classList.add('jg-pulsar');
        setTimeout(() => { it.classList.remove('jg-pulsar'); balde.classList.remove('jg-pulsar'); }, 2500);
        return 'Olhe a figura que está brilhando e o balde que também está brilhando: eles combinam!';
    }
};

/* =====================================================================
   CIÊNCIAS (8 temas) – perguntas com explicação
   ===================================================================== */
Object.keys(CIENCIAS_RAW).forEach(tema => {
    const lista = CIENCIAS_RAW[tema];
    JG.jogos[tema] = {
        emoji: { 'Ciclo da Água': '💧', 'Animais e Habitats': '🐘', 'Corpo Humano': '🧠', 'Reciclagem': '♻️', 'Sistema Solar': '🪐', 'Estados da Matéria': '🧊', 'Plantas': '🌻', 'Sentidos': '👁️' }[tema],
        tipo: 'ACERTO_DIFICIL', total: 5,
        nova(r) {
            if (!r._ids) r._ids = JG.sortearSemRepetir(tema, lista.length, r.total);
            const [pergunta, visual, resp, ops, expl] = lista[r._ids[r.indice] % lista.length];
            return { pergunta, visual, resp, ops: JG.embaralhar(ops), expl };
        },
        desenhar(d, corpo) {
            corpo.innerHTML = `<div class="jg-card"><div class="jg-visual jg-visual-grande">${d.visual}</div><p class="jg-pergunta">${d.pergunta}</p></div>`;
            JG.escolhas(corpo, d.ops.map(o => ({ valor: o, html: JG.esc(o) })), d.resp, { dica: 'Leia com calma. Pense no que você já aprendeu sobre este assunto.', explicacao: d.expl, resposta: JG.esc(d.resp), max: 2 });
        },
        dica(d) { if (JG.q.cincoZero) JG.q.cincoZero(); return 'Tirei algumas respostas que não combinam. Agora ficou mais fácil! 😉'; }
    };
});

/* =====================================================================
   PALAVRAS
   ===================================================================== */
/* ---- montagem genérica: peças (letras, sílabas, passos) que vão para espaços em ordem ---- */
function montagem(corpo, cfg) {
    // cfg: {alvo:[rótulos], pecas:[{rotulo, html}], numerar, aoCorreto(), aoErrado(), dicaTexto, explicacao, resposta, max}
    const pecas = cfg.pecas.map((p, i) => ({ id: i, rotulo: p.rotulo, html: p.html || JG.esc(p.rotulo) }));
    const n = cfg.alvo.length;
    let slots = Array(n).fill(null), marcas = Array(n).fill(null), travado = false;
    corpo.insertAdjacentHTML('beforeend', `<div class="jg-slots" id="jg-slots"></div><div class="jg-pecas" id="jg-pecas"></div>
        <div class="jg-acoes"><button type="button" class="btn-verificar" id="jg-verificar" disabled>✅ Verificar</button>
        <button type="button" class="btn-voltar" id="jg-limpar">↺ Limpar</button></div>`);
    const elSlots = corpo.querySelector('#jg-slots'), elPecas = corpo.querySelector('#jg-pecas');
    const btnV = corpo.querySelector('#jg-verificar'), btnL = corpo.querySelector('#jg-limpar');
    const tileHtml = (p, extra) => `<button type="button" class="jg-item jg-tile ${extra || ''}" data-id="${p.id}">${p.html}</button>`;
    function desenhar() {
        elSlots.innerHTML = slots.map((id, i) => `<div class="jg-slot jg-alvo ${marcas[i] ? 'jg-slot-' + marcas[i] : ''}" data-i="${i}">${cfg.numerar ? `<span class="jg-slot-num">${i + 1}º</span>` : ''}${id !== null ? tileHtml(pecas[id], marcas[i] ? 'jg-tile-' + marcas[i] : '') : ''}${marcas[i] === 'ok' ? '<span class="jg-selo" aria-hidden="true">✔</span>' : marcas[i] === 'erro' ? '<span class="jg-selo" aria-hidden="true">✖</span>' : ''}</div>`).join('');
        elPecas.innerHTML = pecas.filter(p => !slots.includes(p.id)).map(p => tileHtml(p)).join('');
        btnV.disabled = travado || slots.some(s => s === null);
    }
    const limparMarcas = () => { marcas = Array(n).fill(null); };
    function colocar(id) {
        if (travado) return;
        const i = slots.indexOf(null); if (i < 0) return;
        slots[i] = id; limparMarcas(); desenhar();
    }
    function tirar(id) { if (travado) return; const i = slots.indexOf(id); if (i >= 0) { slots[i] = null; limparMarcas(); desenhar(); } }
    JG.mover(corpo, {
        item: '.jg-tile', alvo: '.jg-slot',
        aoTocarItem(it) { const id = +it.dataset.id; slots.includes(id) ? tirar(id) : colocar(id); },
        aoSoltar(it, slot) {
            if (travado) return false;
            const id = +it.dataset.id, idx = +slot.dataset.i;
            if (slots[idx] !== null && slots[idx] !== id) return false;
            const antes = slots.indexOf(id); if (antes >= 0) slots[antes] = null;
            slots[idx] = id; limparMarcas(); desenhar(); return true;
        }
    });
    btnL.onclick = () => { if (travado) return; slots = Array(n).fill(null); limparMarcas(); desenhar(); };
    btnV.onclick = () => {
        if (travado || slots.some(s => s === null)) return;
        const formado = slots.map(id => pecas[id].rotulo);
        const ok = formado.every((r, i) => r === cfg.alvo[i]);
        if (ok) {
            travado = true; marcas = Array(n).fill('ok'); desenhar(); btnV.disabled = true;
            JG.certo({ explicacao: cfg.explicacao });
        } else {
            marcas = formado.map((r, i) => r === cfg.alvo[i] ? 'ok' : 'erro');
            desenhar();
            JG.errado({
                dica: cfg.dicaErro || 'As peças com ✔ estão no lugar certo. Toque nas marcadas com ✖ para tirar e tentar outra ordem.',
                explicacao: cfg.explicacao, resposta: cfg.resposta, max: cfg.max || 3,
                revelar: () => {
                    travado = true; slots = Array(n).fill(null);
                    cfg.alvo.forEach((r, i) => { const p = pecas.find(p => p.rotulo === r && !slots.includes(p.id)); slots[i] = p ? p.id : null; });
                    marcas = Array(n).fill('ok'); desenhar(); btnV.disabled = true;
                }
            });
        }
    };
    // dica: coloca a próxima peça certa
    JG.q.dicaMontagem = () => {
        if (travado) return false;
        limparMarcas();
        let i = cfg.alvo.findIndex((r, k) => slots[k] === null || pecas[slots[k]].rotulo !== r);
        if (i < 0) return false;
        const alvo = cfg.alvo[i];
        const livre = pecas.find(p => p.rotulo === alvo && !slots.some((s, k) => s === p.id && cfg.alvo[k] === alvo));
        if (!livre) return false;
        const k = slots.indexOf(livre.id); if (k >= 0) slots[k] = null;
        slots[i] = livre.id;
        desenhar();
        const el = elSlots.querySelector(`.jg-slot[data-i="${i}"]`); if (el) { el.classList.add('jg-pulsar'); setTimeout(() => el.classList.remove('jg-pulsar'), 1500); }
        return true;
    };
    desenhar();
    return { desenhar };
}
const dicaMontagem = d => { if (JG.q.dicaMontagem && JG.q.dicaMontagem()) return 'Coloquei uma peça no lugar certo para você. Olhe o espaço que brilhou! ✨'; return false; };
const embaralharDiferente = (arr, igual) => { let r, g = 0; do { r = JG.embaralhar(arr); g++; } while (g < 20 && arr.length > 1 && igual(r)); return r; };
const palavrasPorFaixa = (f, minSil) => PALAVRAS.filter(p => {
    if (minSil && p.silabas.length < minSil) return false;
    if (f === 1) return p.palavra.length <= 5; if (f === 2) return p.palavra.length <= 8; return true;
});
function escolherPalavra(nome, r, filtroFn) {
    if (!r._ids) {
        const f = JG.faixa();
        const idx = JG.sortearSemRepetir(nome, PALAVRAS.length, r.total, i => filtroFn(PALAVRAS[i], f));
        r._ids = idx;
    }
    return PALAVRAS[r._ids[r.indice] % PALAVRAS.length];
}
const rotSilabas = p => p.silabas.join('-').toLowerCase();

/* 📝 Monte a Palavra */
JG.jogos['Monte a Palavra'] = {
    emoji: '📝', tipo: 'ACERTO_MEDIO', total: 5,
    instrucao: '👆 Toque nas letras (ou arraste) para formar o nome da figura.',
    nova(r) { return escolherPalavra('Monte a Palavra', r, (p, f) => (f === 1 ? p.palavra.length <= 5 : f === 2 ? p.palavra.length <= 8 : true) && p.palavra.length >= 3); },
    desenhar(p, corpo) {
        corpo.innerHTML = `<div class="jg-card"><div class="jg-visual jg-visual-grande">${p.emoji}</div><p class="jg-pergunta">Qual é o nome desta figura?</p></div>`;
        const letras = p.palavra.split('');
        const emb = embaralharDiferente(letras, a => a.join('') === p.palavra);
        montagem(corpo, {
            alvo: letras, pecas: emb.map(l => ({ rotulo: l })),
            explicacao: `<b>${p.palavra}</b> ${p.emoji} — separando em sílabas: <b>${rotSilabas(p)}</b>.`, resposta: p.palavra
        });
    },
    dica: dicaMontagem
};

/* 🔤 Sílabas Mágicas */
JG.jogos['Sílabas Mágicas'] = {
    emoji: '🔤', tipo: 'ACERTO_MEDIO', total: 5,
    instrucao: '👆 Junte as <b>sílabas</b> na ordem certa para formar o nome da figura.',
    nova(r) { return escolherPalavra('Sílabas Mágicas', r, (p, f) => p.silabas.length >= 2 && (f === 1 ? p.silabas.length === 2 : f === 2 ? p.silabas.length <= 3 : true)); },
    desenhar(p, corpo) {
        corpo.innerHTML = `<div class="jg-card"><div class="jg-visual jg-visual-grande">${p.emoji}</div><p class="jg-pergunta">Monte o nome da figura (${p.silabas.length} sílabas)</p></div>`;
        let pecas = p.silabas.map(s => ({ rotulo: s }));
        if (JG.faixa() === 3) {  // no nível avançado entra uma sílaba "intrusa"
            const outra = JG.um(PALAVRAS.filter(x => x.palavra !== p.palavra)).silabas[0];
            if (!p.silabas.includes(outra)) pecas.push({ rotulo: outra });
        }
        pecas = embaralharDiferente(pecas, a => a.slice(0, p.silabas.length).map(x => x.rotulo).join('') === p.palavra && a.length === p.silabas.length);
        montagem(corpo, {
            alvo: p.silabas, pecas: pecas.map(x => ({ rotulo: x.rotulo })),
            explicacao: `<b>${rotSilabas(p)}</b> forma <b>${p.palavra}</b> ${p.emoji}. Bata palmas a cada sílaba: ${p.silabas.length} palmas!`, resposta: rotSilabas(p),
            dicaErro: 'As sílabas com ✔ estão no lugar certo. Bata palmas ao falar a palavra para sentir a ordem.'
        });
    },
    dica: dicaMontagem
};

/* 🖼️ Ditado Visual */
function padraoLetras(pal, k) { return pal.split('').map((c, i) => i < k ? c : '_').join(' '); }
JG.jogos['Ditado Visual'] = {
    emoji: '🖼️', tipo: 'ACERTO_SIMPLES', total: 5,
    nova(r) { return escolherPalavra('Ditado Visual', r, (p, f) => f === 1 ? p.palavra.length <= 5 : f === 2 ? p.palavra.length <= 8 : true); },
    desenhar(p, corpo) {
        corpo.innerHTML = `<div class="jg-card"><div class="jg-visual jg-visual-grande">${p.emoji}</div><p class="jg-pergunta">Escreva o nome desta figura.</p></div>`;
        const ouvir = JG.botaoOuvir(p.palavra.toLowerCase()); ouvir.classList.add('jg-ouvir-topo');
        corpo.querySelector('.jg-card').appendChild(ouvir);
        JG.campo(corpo, {
            tipo: 'text', placeholder: 'Digite aqui', maxlen: 20,
            comparar: v => JG.semAcento(v) === JG.semAcento(p.palavra),
            dica: t => `A palavra tem ${p.palavra.length} letras: <b>${padraoLetras(p.palavra, Math.min(t + 1, 2))}</b>`,
            explicacao: `<b>${p.palavra}</b> ${p.emoji} — separando em sílabas: <b>${rotSilabas(p)}</b>.`, resposta: p.palavra, max: 3
        });
    },
    dica(p) { return `A palavra tem ${p.palavra.length} letras: <b>${padraoLetras(p.palavra, 1)}</b>`; }
};

/* 🎵 Rima Maluca */
const sufixoComum = (a, b) => { a = JG.semAcento(a); b = JG.semAcento(b); let k = 0; while (k < a.length && k < b.length && a[a.length - 1 - k] === b[b.length - 1 - k]) k++; return k; };
JG.jogos['Rima Maluca'] = {
    emoji: '🎵', tipo: 'ACERTO_SIMPLES', total: 5,
    nova(r) {
        const base = (typeof bancoRimas !== 'undefined' ? bancoRimas : []).filter(x => sufixoComum(x.alvo, x.certa) >= 2);
        if (!r._ids) r._ids = JG.sortearSemRepetir('Rima Maluca', base.length, r.total);
        const it = base[r._ids[r.indice] % base.length];
        let erradas = it.erradas.filter(e => sufixoComum(it.alvo, e) < 2);   // nenhuma opção errada pode rimar também
        if (erradas.length < 2) {
            const pool = base.map(x => x.certa).filter(w => sufixoComum(it.alvo, w) < 2 && !erradas.includes(w) && w !== it.certa);
            erradas = erradas.concat(JG.sortear(pool, 2 - erradas.length));
        }
        erradas = erradas.slice(0, 2);
        const k = Math.max(2, sufixoComum(it.alvo, it.certa));
        return { alvo: it.alvo, certa: it.certa, ops: JG.embaralhar([it.certa, ...erradas]), fim: it.alvo.slice(-k).toUpperCase() };
    },
    desenhar(d, corpo) {
        corpo.innerHTML = `<div class="jg-card"><p class="jg-pergunta">Qual palavra <b>rima</b> com</p><div class="jg-visual jg-palavra-grande">${d.alvo.toUpperCase()}</div></div>`;
        const ouvir = JG.botaoOuvir(d.alvo.toLowerCase()); ouvir.classList.add('jg-ouvir-topo');
        corpo.querySelector('.jg-card').appendChild(ouvir);
        JG.escolhas(corpo, d.ops.map(o => ({ valor: o, html: JG.esc(o.toUpperCase()) })), d.certa, {
            classe: 'jg-opcoes-grandes', dica: 'Rimar é terminar com o mesmo som. Fale as palavras em voz alta e escute o final de cada uma.',
            explicacao: `<b>${d.alvo.toUpperCase()}</b> e <b>${d.certa.toUpperCase()}</b> terminam com o mesmo som: <b>-${d.fim}</b>.`, resposta: JG.esc(d.certa.toUpperCase()), max: 2
        });
    },
    dica() { if (JG.q.cincoZero) JG.q.cincoZero(); return 'Tirei uma palavra que não rima. Fale em voz alta e escute o final de cada uma! 🎶'; }
};

/* ❓ Qual é a Letra? */
JG.jogos['Qual é a Letra?'] = {
    emoji: '❓', tipo: 'ACERTO_SIMPLES', total: 5,
    nova(r) {
        const p = escolherPalavra('Qual é a Letra?', r, (x, f) => f === 1 ? x.palavra.length <= 5 : true);
        const f = JG.faixa();
        const modo = (f === 1 || Math.random() < 0.4) ? 'inicial' : 'falta';
        const plain = p.palavra.split('').map(c => JG.semAcento(c));
        let pos = 0;
        if (modo === 'falta') {
            const candidatas = p.palavra.split('').map((c, i) => i).filter(i => i > 0 && JG.semAcento(p.palavra[i]) === p.palavra[i]);
            pos = candidatas.length ? JG.um(candidatas) : 0;
        }
        const certa = plain[pos];
        const ops = new Set([certa]);
        const vogais = ['A', 'E', 'I', 'O', 'U'];
        while (ops.size < 4) ops.add(JG.um(certa && vogais.includes(certa) && Math.random() < 0.6 ? vogais : letrasABC));
        return { p, modo: pos === 0 ? 'inicial' : 'falta', pos, certa, ops: JG.embaralhar([...ops]) };
    },
    desenhar(d, corpo) {
        const { p } = d;
        const mostra = d.modo === 'inicial' ? '' : `<div class="jg-lacuna">${p.palavra.split('').map((c, i) => i === d.pos ? '<span class="jg-interr">?</span>' : `<span>${c}</span>`).join('')}</div>`;
        corpo.innerHTML = `<div class="jg-card"><div class="jg-visual jg-visual-grande">${p.emoji}</div>
            <p class="jg-pergunta">${d.modo === 'inicial' ? 'Com qual <b>letra</b> começa o nome desta figura?' : 'Qual letra está faltando?'}</p>${mostra}</div>`;
        const ouvir = JG.botaoOuvir(p.palavra.toLowerCase()); ouvir.classList.add('jg-ouvir-topo');
        corpo.querySelector('.jg-card').appendChild(ouvir);
        JG.escolhas(corpo, d.ops.map(o => ({ valor: o, html: o })), d.certa, {
            classe: 'jg-opcoes-grandes', dica: d.modo === 'inicial' ? 'Fale o nome da figura bem devagar e escute o primeiro som.' : 'Fale a palavra devagar e escute qual som está faltando.',
            explicacao: d.modo === 'inicial' ? `<b>${p.palavra}</b> ${p.emoji} começa com a letra <b>${d.certa}</b>.` : `<b>${p.palavra}</b> ${p.emoji} — a letra que faltava era <b>${d.certa}</b>.`, resposta: d.certa, max: 2
        });
    },
    dica() { if (JG.q.cincoZero) JG.q.cincoZero(); return 'Tirei algumas letras que não combinam. Escute o som! 👂'; }
};

/* 🧠 Memória de Palavras (jogo da memória: figura ↔ palavra) */
JG.jogos['Memória de Palavras'] = {
    emoji: '🧠', modo: 'tabuleiro', instrucao: '👆 Vire duas cartas. Combine cada <b>figura</b> com a sua <b>palavra</b>.',
    rotuloTabuleiro: () => `Pares: ${JG.q.dados ? JG.q.dados.achados : 0} de ${JG.q.dados ? JG.q.dados.pares : 0} · Jogadas: ${JG.q.dados ? JG.q.dados.jogadas : 0}`,
    montar(r, corpo) {
        const f = JG.faixa();
        const pares = f === 1 ? 4 : (f === 2 ? 6 : 8);
        const escolhidas = JG.sortear(PALAVRAS.filter(p => p.palavra.length >= 3 && p.palavra.length <= 9), pares);
        const cartas = JG.embaralhar(escolhidas.flatMap((p, i) => [{ par: i, tipo: 'fig', html: p.emoji }, { par: i, tipo: 'pal', html: p.palavra }]));
        const d = JG.q.dados = { pares, achados: 0, jogadas: 0, abertas: [], travado: false };
        corpo.innerHTML = `<div class="jg-memoria jg-mem-${pares}">${cartas.map((c, i) => `<button type="button" class="jg-carta" data-i="${i}" aria-label="carta virada para baixo"><span class="jg-carta-frente ${c.tipo === 'pal' ? 'jg-carta-palavra' : ''}">${c.html}</span><span class="jg-carta-verso">❓</span></button>`).join('')}</div>`;
        const atualizar = () => { document.getElementById('jg-prog-texto').textContent = `Pares: ${d.achados} de ${d.pares} · Jogadas: ${d.jogadas}`; };
        atualizar();
        corpo.querySelector('.jg-memoria').addEventListener('click', e => {
            const b = e.target.closest('.jg-carta'); if (!b || d.travado || b.classList.contains('virada') || b.classList.contains('par')) return;
            b.classList.add('virada'); d.abertas.push(b);
            if (d.abertas.length === 2) {
                d.jogadas++; d.travado = true;
                const [a, c] = d.abertas;
                if (cartas[+a.dataset.i].par === cartas[+c.dataset.i].par) {
                    setTimeout(() => {
                        a.classList.add('par'); c.classList.add('par'); d.abertas = []; d.travado = false; d.achados++;
                        atualizar(); JG.passoCerto(0.6);
                        const p = escolhidas[cartas[+a.dataset.i].par];
                        JG.mostrarFeedback('ok', `<strong>Par encontrado! ✅</strong><p>${p.emoji} = <b>${p.palavra}</b></p>`);
                        if (d.achados === d.pares) setTimeout(fim, 600);
                    }, 500);
                } else {
                    JG.passoErrado();
                    setTimeout(() => { a.classList.remove('virada'); c.classList.remove('virada'); d.abertas = []; d.travado = false; atualizar(); }, 1300);
                }
                atualizar();
            }
        });
        function fim() {
            const j = d.jogadas;
            JG.fimRodada({ acertos: d.pares, total: d.pares, estrelas: j <= Math.ceil(d.pares * 1.6) && r.dicas === 0 ? 3 : (j <= d.pares * 2.6 ? 2 : 1), texto: `Você achou os ${d.pares} pares em ${j} jogadas! 🧠` });
        }
    },
    dica() {
        const todas = [...document.querySelectorAll('.jg-carta:not(.par)')];
        if (!todas.length) return false;
        JG.q.dados.travado = true;
        todas.forEach(c => c.classList.add('virada'));
        setTimeout(() => { todas.forEach(c => c.classList.remove('virada')); JG.q.dados.abertas = []; JG.q.dados.travado = false; }, 1600);
        return 'Espiei todas as cartas por um instante. Guarde as posições na memória! 👀';
    }
};

/* 🔎 Palavra Oculta */
JG.jogos['Palavra Oculta'] = {
    emoji: '🔎', tipo: 'ACERTO_DIFICIL', total: 5,
    nova(r) {
        const banco = (typeof bancoPalavraOculta !== 'undefined' ? bancoPalavraOculta : []).filter(x => /^[A-ZÀ-Ü]+$/i.test(x.palavra));
        const f = JG.faixa();
        if (!r._ids) r._ids = JG.sortearSemRepetir('Palavra Oculta', bancoPalavraOculta.length, r.total, i => /^[A-ZÀ-Ü]+$/i.test(bancoPalavraOculta[i].palavra) && (f === 1 ? bancoPalavraOculta[i].palavra.length <= 6 : f === 2 ? bancoPalavraOculta[i].palavra.length <= 8 : true));
        return bancoPalavraOculta[r._ids[r.indice] % bancoPalavraOculta.length];
    },
    desenhar(d, corpo) {
        const pal = d.palavra.toUpperCase();
        corpo.innerHTML = `<div class="jg-card"><span class="jg-chip">${JG.esc(d.categoria || 'Palavra')}</span>
            <p class="jg-pergunta">💡 ${JG.esc(d.dica)}</p><p class="jg-instrucao-sub">A palavra tem <b>${pal.length}</b> letras.</p>
            <div class="jg-letras" id="jg-letras">${pal.split('').map((_, i) => `<input type="text" class="jg-letra" maxlength="1" data-i="${i}" autocomplete="off" autocapitalize="characters" aria-label="letra ${i + 1}">`).join('')}</div></div>
            <div class="jg-acoes"><button type="button" class="btn-verificar" id="jg-verificar">✅ Verificar</button></div>`;
        const inputs = [...corpo.querySelectorAll('.jg-letra')];
        inputs.forEach((inp, i) => {
            inp.addEventListener('input', () => { inp.value = inp.value.toUpperCase().slice(-1); inp.classList.remove('jg-letra-erro'); if (inp.value && inputs[i + 1]) inputs[i + 1].focus(); });
            inp.addEventListener('keydown', e => {
                if (e.key === 'Backspace' && !inp.value && inputs[i - 1]) { inputs[i - 1].focus(); }
                if (e.key === 'Enter') corpo.querySelector('#jg-verificar').click();
                if (e.key === 'ArrowLeft' && inputs[i - 1]) inputs[i - 1].focus();
                if (e.key === 'ArrowRight' && inputs[i + 1]) inputs[i + 1].focus();
            });
        });
        setTimeout(() => { try { inputs[0].focus({ preventScroll: true }); } catch (_) { } }, 50);
        JG.q.revelarLetra = () => {
            const i = inputs.findIndex((inp, k) => JG.semAcento(inp.value) !== JG.semAcento(pal[k]));
            if (i < 0) return false;
            inputs[i].value = pal[i]; inputs[i].classList.add('jg-letra-dica'); inputs[i].readOnly = true; return true;
        };
        corpo.querySelector('#jg-verificar').onclick = () => {
            if (JG.q.resolvida) return;
            const resp = inputs.map(i => JG.semAcento(i.value || '_'));
            if (resp.includes('_')) { if (typeof exibirToast === 'function') exibirToast('Preencha todas as letras 🙂', false); return; }
            const alvo = pal.split('').map(c => JG.semAcento(c));
            if (resp.every((c, i) => c === alvo[i])) {
                inputs.forEach(i => { i.readOnly = true; i.classList.add('jg-letra-ok'); });
                corpo.querySelector('#jg-verificar').disabled = true;
                JG.certo({ explicacao: `A palavra é <b>${pal}</b>!` });
            } else {
                inputs.forEach((inp, i) => { if (resp[i] !== alvo[i]) inp.classList.add('jg-letra-erro'); else inp.classList.add('jg-letra-certa'); });
                JG.errado({
                    dica: 'As letras certas ficaram verdes e as erradas, vermelhas. Corrija as vermelhas!', explicacao: `A palavra é <b>${pal}</b>.`, resposta: pal, max: 3,
                    revelar: () => { inputs.forEach((inp, i) => { inp.value = pal[i]; inp.readOnly = true; inp.classList.remove('jg-letra-erro'); inp.classList.add('jg-letra-ok'); }); corpo.querySelector('#jg-verificar').disabled = true; }
                });
            }
        };
    },
    dica() { return JG.q.revelarLetra && JG.q.revelarLetra() ? 'Revelei uma letra para você. 🔤' : false; }
};

/* 🌑 Sombras Mágicas (tabuleiro) */
JG.jogos['Sombras Mágicas'] = {
    emoji: '🌑', modo: 'tabuleiro', instrucao: '👆 Toque na figura e depois na <b>sombra</b> dela (ou arraste).',
    rotuloTabuleiro: () => `Sombras encontradas: ${JG.q.dados ? JG.q.dados.feitas : 0} de ${JG.q.dados ? JG.q.dados.total : 0}`,
    montar(r, corpo) {
        const f = JG.faixa(); const n = f === 1 ? 4 : (f === 2 ? 5 : 6);
        const itens = JG.sortear(SOMBRAS, n);
        const d = JG.q.dados = { total: n, feitas: 0, errosItem: {} };
        const figuras = JG.embaralhar(itens), sombras = JG.embaralhar(itens);
        corpo.innerHTML = `<div class="jg-sombras">
            <div><h3 class="jg-sub">🖼️ Figuras</h3><div class="jg-fig-lista">${figuras.map(it => `<button type="button" class="jg-item jg-fig" data-k="${it[1]}" aria-label="figura">${it[0]}</button>`).join('')}</div></div>
            <div><h3 class="jg-sub">🌑 Sombras</h3><div class="jg-fig-lista">${sombras.map(it => `<div class="jg-alvo jg-sombra-slot" data-k="${it[1]}" role="button" tabindex="0" aria-label="sombra"><span class="jg-sombra">${it[0]}</span></div>`).join('')}</div></div></div>`;
        const atualizar = () => { document.getElementById('jg-prog-texto').textContent = `Sombras encontradas: ${d.feitas} de ${d.total}`; };
        atualizar();
        JG.mover(corpo, {
            item: '.jg-fig', alvo: '.jg-sombra-slot',
            aoSoltar(it, slot) {
                if (it.dataset.bloqueado === '1' || slot.classList.contains('jg-sombra-ok')) return false;
                if (it.dataset.k === slot.dataset.k) {
                    it.dataset.bloqueado = '1'; it.classList.remove('jg-sel'); it.classList.add('jg-fig-ok');
                    slot.classList.add('jg-sombra-ok'); slot.innerHTML = `<span>${it.textContent}</span><small>${it.dataset.k}</small>`;
                    d.feitas++; atualizar(); JG.passoCerto(0.5);
                    JG.mostrarFeedback('ok', `<strong>Isso! ✅</strong><p>Era o(a) <b>${it.dataset.k}</b>.</p>`);
                    if (d.feitas === d.total) setTimeout(() => JG.fimRodada({ acertos: d.total, total: d.total, estrelas: r.erros <= 1 && r.dicas === 0 ? 3 : (r.erros <= 4 ? 2 : 1) }), 600);
                    return true;
                }
                JG.passoErrado();
                const k = it.dataset.k; d.errosItem[k] = (d.errosItem[k] || 0) + 1;
                slot.classList.add('jg-tremer'); setTimeout(() => slot.classList.remove('jg-tremer'), 500);
                if (d.errosItem[k] >= 2) { const certo = corpo.querySelector(`.jg-sombra-slot[data-k="${k}"]`); certo.classList.add('jg-pulsar'); setTimeout(() => certo.classList.remove('jg-pulsar'), 2500); }
                JG.mostrarFeedback('tente', `<strong>Quase! 💪</strong><p>💡 Olhe o contorno: o formato da figura precisa ser igual ao da sombra.${d.errosItem[k] >= 2 ? ' Mostrei a sombra certa!' : ''}</p>`);
                return false;
            }
        });
    },
    dica() {
        const it = document.querySelector('.jg-fig:not([data-bloqueado="1"])'); if (!it) return false;
        const slot = document.querySelector(`.jg-sombra-slot[data-k="${it.dataset.k}"]`);
        it.classList.add('jg-pulsar'); slot.classList.add('jg-pulsar');
        setTimeout(() => { it.classList.remove('jg-pulsar'); slot.classList.remove('jg-pulsar'); }, 2500);
        return 'A figura e a sombra que estão brilhando combinam! ✨';
    }
};

/* 🔍 Caça-Palavras (tabuleiro, com várias palavras) */
const TEMAS_CACA = [
    { tema: '🐾 Animais', palavras: ['GATO', 'CACHORRO', 'PEIXE', 'VACA', 'CAVALO', 'COELHO', 'MACACO', 'ELEFANTE', 'GIRAFA', 'LEAO', 'TIGRE', 'ZEBRA', 'PATO', 'SAPO', 'COBRA', 'URSO'] },
    { tema: '🍎 Frutas', palavras: ['BANANA', 'MACA', 'LARANJA', 'UVA', 'MAMAO', 'ABACAXI', 'MORANGO', 'PERA', 'MELANCIA', 'LIMAO', 'GOIABA', 'CAJU', 'JACA', 'MANGA', 'KIWI', 'COCO'] },
    { tema: '📚 Escola', palavras: ['LIVRO', 'CADERNO', 'LAPIS', 'BORRACHA', 'MOCHILA', 'ALUNO', 'QUADRO', 'GIZ', 'TESOURA', 'REGUA', 'COLA', 'AULA', 'PROVA', 'TINTA', 'MESA', 'CANETA'] },
    { tema: '🧍 Corpo', palavras: ['MAO', 'PE', 'OLHO', 'NARIZ', 'BOCA', 'ORELHA', 'DEDO', 'PERNA', 'BRACO', 'CABECA', 'DENTE', 'LINGUA', 'JOELHO', 'COTOVELO', 'UNHA', 'BARRIGA'] },
    { tema: '🌳 Natureza', palavras: ['SOL', 'LUA', 'MAR', 'RIO', 'FLOR', 'ARVORE', 'NUVEM', 'CHUVA', 'VENTO', 'TERRA', 'FOLHA', 'PEDRA', 'AREIA', 'MONTANHA', 'ESTRELA', 'CEU'] }
];
JG.jogos['Caça-Palavras'] = {
    emoji: '🔍', modo: 'tabuleiro', instrucao: '👆 Arraste (ou toque no começo e depois no fim) para marcar cada palavra da lista.',
    rotuloTabuleiro: () => `Palavras: ${JG.q.dados ? JG.q.dados.achadas.size : 0} de ${JG.q.dados ? JG.q.dados.palavras.length : 0}`,
    montar(r, corpo) {
        const f = JG.faixa();
        const T = f === 1 ? 8 : (f === 2 ? 10 : 12), nPal = f === 1 ? 3 : (f === 2 ? 4 : 5), maxLen = f === 1 ? 5 : (f === 2 ? 8 : 9);
        const dirs = f === 1 ? [[0, 1], [1, 0]] : (f === 2 ? [[0, 1], [1, 0], [0, -1], [-1, 0]] : [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]]);
        const tema = JG.um(TEMAS_CACA);
        let grade, palavras, tentativas = 0;
        do {
            tentativas++;
            palavras = JG.sortear(tema.palavras.filter(p => p.length <= maxLen && p.length >= 3), nPal).sort((a, b) => b.length - a.length);
            grade = Array.from({ length: T }, () => Array(T).fill(''));
            let ok = true;
            for (const p of palavras) {
                let colocou = false;
                for (let t = 0; t < 300 && !colocou; t++) {
                    const [dr, dc] = JG.um(dirs), r0 = JG.rnd(0, T - 1), c0 = JG.rnd(0, T - 1);
                    const rf = r0 + dr * (p.length - 1), cf = c0 + dc * (p.length - 1);
                    if (rf < 0 || rf >= T || cf < 0 || cf >= T) continue;
                    let cabe = true;
                    for (let i = 0; i < p.length; i++) { const v = grade[r0 + dr * i][c0 + dc * i]; if (v !== '' && v !== p[i]) { cabe = false; break; } }
                    if (!cabe) continue;
                    for (let i = 0; i < p.length; i++) grade[r0 + dr * i][c0 + dc * i] = p[i];
                    colocou = true;
                }
                if (!colocou) { ok = false; break; }
            }
            if (ok) break;
        } while (tentativas < 30);
        for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) if (!grade[i][j]) grade[i][j] = JG.um(letrasABC);
        const d = JG.q.dados = { palavras, achadas: new Set(), T };
        const larg = Math.min(corpo.clientWidth || window.innerWidth - 40, 560);
        const cel = Math.max(26, Math.floor((larg - (T - 1) * 4) / T));
        corpo.innerHTML = `<p class="jg-tema">Tema: <b>${tema.tema}</b></p>
          <div class="jg-chips" id="jg-chips">${palavras.map(p => `<span class="jg-chip jg-chip-pal" data-p="${p}">${p}</span>`).join('')}</div>
          <div class="jg-grade" id="jg-grade" style="grid-template-columns:repeat(${T},${cel}px);--cel:${cel}px">${grade.map((lin, i) => lin.map((ch, j) => `<div class="jg-cel" data-r="${i}" data-c="${j}">${ch}</div>`).join('')).join('')}</div>
          <p class="jg-selecao" id="jg-selecao" aria-live="polite">&nbsp;</p>`;
        const elGrade = corpo.querySelector('#jg-grade'), elSel = corpo.querySelector('#jg-selecao');
        const celEl = (i, j) => elGrade.querySelector(`.jg-cel[data-r="${i}"][data-c="${j}"]`);
        const atualizar = () => { document.getElementById('jg-prog-texto').textContent = `Palavras: ${d.achadas.size} de ${d.palavras.length}`; };
        atualizar();
        const cores = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac'];
        let ini = null, atual = null, arrastando = false;
        const linha = (a, b) => {
            const dr = b.r - a.r, dc = b.c - a.c;
            if (!(dr === 0 || dc === 0 || Math.abs(dr) === Math.abs(dc))) return null;
            const n = Math.max(Math.abs(dr), Math.abs(dc)), sr = Math.sign(dr), sc = Math.sign(dc);
            return Array.from({ length: n + 1 }, (_, i) => ({ r: a.r + sr * i, c: a.c + sc * i }));
        };
        const limparSel = () => elGrade.querySelectorAll('.jg-cel-sel').forEach(c => c.classList.remove('jg-cel-sel'));
        const pinta = lin => { limparSel(); if (lin) lin.forEach(p => celEl(p.r, p.c).classList.add('jg-cel-sel')); elSel.textContent = lin ? lin.map(p => grade[p.r][p.c]).join('') : ' '; };
        const celaDe = (x, y) => { const el = document.elementFromPoint(x, y); const c = el && el.closest('.jg-cel'); return c && elGrade.contains(c) ? { r: +c.dataset.r, c: +c.dataset.c } : null; };
        function avaliar(lin) {
            if (!lin || lin.length < 2) { limparSel(); return; }
            const txt = lin.map(p => grade[p.r][p.c]).join(''), rev = txt.split('').reverse().join('');
            const p = d.palavras.find(w => !d.achadas.has(w) && (w === txt || w === rev));
            if (p) {
                const cor = cores[d.achadas.size % cores.length];
                d.achadas.add(p); limparSel();
                lin.forEach(q => { const c = celEl(q.r, q.c); c.classList.add('jg-cel-achada'); c.style.setProperty('--cor', cor); });
                const chip = corpo.querySelector(`.jg-chip-pal[data-p="${p}"]`); if (chip) { chip.classList.add('jg-chip-feito'); chip.insertAdjacentHTML('afterbegin', '✔ '); }
                atualizar(); JG.passoCerto(0.7);
                JG.mostrarFeedback('ok', `<strong>Achou! ✅</strong><p><b>${p}</b></p>`);
                elSel.innerHTML = '&nbsp;';
                if (d.achadas.size === d.palavras.length) setTimeout(() => JG.fimRodada({ acertos: d.palavras.length, total: d.palavras.length, estrelas: r.erros <= 1 && r.dicas === 0 ? 3 : (r.erros <= 4 ? 2 : 1) }), 700);
            } else {
                JG.passoErrado(); limparSel();
                JG.mostrarFeedback('tente', '<strong>Essas letras não formam uma palavra da lista. 💪</strong><p>💡 Tente de novo: a palavra fica em linha reta (para o lado, para baixo ou na diagonal).</p>');
                elSel.innerHTML = '&nbsp;';
            }
        }
        const sinal = new AbortController();
        if (JG._abort) JG._abort.abort(); JG._abort = sinal;
        elGrade.addEventListener('pointerdown', e => {
            const c = celaDe(e.clientX, e.clientY); if (!c) return;
            e.preventDefault();
            if (ini && !arrastando) { // modo "toque no começo e no fim"
                const lin = linha(ini, c); const i0 = ini; ini = null; atual = null; avaliar(lin); return;
            }
            ini = c; atual = c; arrastando = true; pinta([c]);
        }, { signal: sinal.signal });
        document.addEventListener('pointermove', e => {
            if (!arrastando || !ini) return;
            const c = celaDe(e.clientX, e.clientY); if (!c) return;
            const lin = linha(ini, c); if (lin) { atual = c; pinta(lin); }
        }, { signal: sinal.signal });
        document.addEventListener('pointerup', e => {
            if (!arrastando) return;
            arrastando = false;
            if (!atual || (atual.r === ini.r && atual.c === ini.c)) { return; }   // foi só um toque: espera o segundo toque
            const lin = linha(ini, atual); ini = null; atual = null; avaliar(lin);
        }, { signal: sinal.signal });
    },
    dica() {
        const d = JG.q.dados; const falta = d.palavras.filter(p => !d.achadas.has(p)); if (!falta.length) return false;
        const chip = document.querySelector(`.jg-chip-pal[data-p="${falta[0]}"]`); if (chip) { chip.classList.add('jg-pulsar'); setTimeout(() => chip.classList.remove('jg-pulsar'), 2500); }
        // destaca a primeira letra da palavra
        const T = d.T; const grade = [...document.querySelectorAll('.jg-cel')];
        const w = falta[0]; const dirs = [[0, 1], [1, 0], [0, -1], [-1, 0], [1, 1], [-1, -1], [1, -1], [-1, 1]];
        outer: for (let i = 0; i < T; i++) for (let j = 0; j < T; j++) for (const [dr, dc] of dirs) {
            let ok = true; for (let k = 0; k < w.length; k++) { const r = i + dr * k, c = j + dc * k; if (r < 0 || r >= T || c < 0 || c >= T || document.querySelector(`.jg-cel[data-r="${r}"][data-c="${c}"]`).textContent !== w[k]) { ok = false; break; } }
            if (ok) { const el = document.querySelector(`.jg-cel[data-r="${i}"][data-c="${j}"]`); el.classList.add('jg-pulsar'); setTimeout(() => el.classList.remove('jg-pulsar'), 3000); break outer; }
        }
        return `Procure a palavra <b>${falta[0]}</b>. A primeira letra dela está brilhando na grade! ✨`;
    }
};

/* =====================================================================
   HABILIDADES: Emoções · Minha Rotina · Cuidado com o Ambiente
   ===================================================================== */
JG.jogos['Emoções'] = {
    emoji: '😊', tipo: 'ACERTO_SIMPLES', total: 5,
    nova(r) {
        if (!r._ids) r._ids = JG.sortearSemRepetir('Emoções', EMOCOES_SITUACOES.length, r.total);
        const [situacao, id] = EMOCOES_SITUACOES[r._ids[r.indice] % EMOCOES_SITUACOES.length];
        const emo = EMOCOES.find(e => e.id === id);
        const f = JG.faixa();
        const modo = f === 1 || Math.random() < 0.65 ? 'situacao' : 'rosto';
        const qtd = f === 1 ? 3 : 4;
        const outras = JG.sortear(EMOCOES.filter(e => e.id !== id), qtd - 1);
        return { situacao, emo, modo, ops: JG.embaralhar([emo, ...outras]) };
    },
    desenhar(d, corpo) {
        if (d.modo === 'situacao') corpo.innerHTML = `<div class="jg-card"><div class="jg-visual jg-visual-grande">🧒</div><p class="jg-pergunta">“${JG.esc(d.situacao)}”</p><p class="jg-instrucao-sub">Como essa pessoa está se sentindo?</p></div>`;
        else corpo.innerHTML = `<div class="jg-card"><div class="jg-visual jg-visual-grande">${d.emo.rosto}</div><p class="jg-pergunta">Que emoção este rosto mostra?</p></div>`;
        JG.escolhas(corpo, d.ops.map(e => ({ valor: e.id, html: d.modo === 'situacao' ? `<span class="jg-op-rosto">${e.rosto}</span> ${e.nome}` : e.nome })), d.emo.id, {
            classe: 'jg-opcoes-grandes', dica: 'Pense: como VOCÊ se sentiria nessa situação? Olhe também a expressão do rosto.',
            explicacao: `Essa pessoa está <b>${d.emo.nome}</b> ${d.emo.rosto}.<br>💙 <b>O que posso fazer?</b> ${d.emo.fazer}`, resposta: `${d.emo.nome} ${d.emo.rosto}`, max: 2
        });
    },
    dica() { if (JG.q.cincoZero) JG.q.cincoZero(); return 'Tirei algumas emoções que não combinam. Pense em como o rosto fica quando sentimos isso. 😊'; }
};

JG.jogos['Minha Rotina'] = {
    emoji: '⏰', tipo: 'ACERTO_MEDIO', total: 3,
    instrucao: '👆 Toque nas atividades <b>na ordem em que acontecem</b> (do 1º ao último). Toque numa peça colocada para tirá-la.',
    nova(r) {
        const f = JG.faixa();
        if (!r._ids) {
            const lim = f === 1 ? 5 : (f === 2 ? 6 : 9);
            r._ids = JG.sortearSemRepetir('Minha Rotina', ROTINAS.length, r.total, i => ROTINAS[i].passos.length <= lim);
        }
        return ROTINAS[r._ids[r.indice] % ROTINAS.length];
    },
    desenhar(rot, corpo) {
        corpo.innerHTML = `<div class="jg-card"><div class="jg-visual">${rot.emoji}</div><p class="jg-pergunta">${rot.nome}: o que vem primeiro, depois, e por último?</p></div>`;
        const alvo = rot.passos.map(p => p[1]);
        const pecas = embaralharDiferente(rot.passos, a => a.every((p, i) => p[1] === alvo[i]));
        montagem(corpo, {
            numerar: true, alvo, pecas: pecas.map(p => ({ rotulo: p[1], html: `<span class="jg-passo-emoji">${p[0]}</span> ${JG.esc(p[1])}` })),
            explicacao: `A ordem é: ${rot.passos.map((p, i) => `<b>${i + 1}º</b> ${p[1]}`).join(' → ')}.<br>💙 Ter uma rotina ajuda a gente a saber o que vem depois e a ficar mais tranquilo.`,
            resposta: alvo.join(' → '), dicaErro: 'Os passos com ✔ estão na posição certa. Toque nos marcados com ✖ para tirar e pense: o que acontece antes?'
        });
    },
    dica: dicaMontagem
};

JG.jogos['Cuidado com o Ambiente'] = {
    emoji: '🌍', tipo: 'ACERTO_SIMPLES', total: 5,
    nova(r) {
        if (!r._ids) r._ids = JG.sortearSemRepetir('Cuidado com o Ambiente', AMBIENTE.length, r.total);
        const [emoji, texto, bom, expl] = AMBIENTE[r._ids[r.indice] % AMBIENTE.length];
        return { emoji, texto, bom, expl };
    },
    desenhar(d, corpo) {
        corpo.innerHTML = `<div class="jg-card"><div class="jg-visual jg-visual-grande">${d.emoji}</div><p class="jg-pergunta">${JG.esc(d.texto)}</p><p class="jg-instrucao-sub">👆 Arraste a figura para <b>Faz bem</b> ou <b>Faz mal</b> (ou toque nela e depois na caixa).</p></div>`;
        const bx = document.createElement('div'); bx.className = 'jg-baldes-2';
        bx.innerHTML = `<div class="jg-alvo-r jg-balde-resp jg-bem" data-valor="sim" role="button" tabindex="0"><span class="jg-balde-emoji">🌳</span><b>Faz bem</b></div><div class="jg-alvo-r jg-balde-resp jg-mal" data-valor="nao" role="button" tabindex="0"><span class="jg-balde-emoji">🗑️</span><b>Faz mal</b></div>`;
        corpo.appendChild(bx);
        const certa = d.bom ? 'sim' : 'nao';
        arrastarResposta(corpo, {
            pecas: [{ valor: 'p', html: `<span class="jg-peca-grande">${d.emoji}</span>` }],
            confere: (v, alvo) => alvo.dataset.valor === certa, explicacao: d.expl, resposta: d.bom ? '🌳 Faz bem' : '🗑️ Faz mal', max: 2,
            dica: 'Pense: isso ajuda a cuidar da natureza e dos animais, ou deixa tudo mais sujo e gasta demais?',
            revelar() { bx.querySelector(`[data-valor="${certa}"]`).classList.add('jg-alvo-ok'); }
        });
    }
};

/* ---------- conferência: todos os 30 jogos precisam existir ---------- */
(function conferir() {
    const faltando = Object.keys(JG.AREAS).filter(n => !JG.jogos[n]);
    if (faltando.length) console.warn('Jogos sem definição:', faltando);
})();
