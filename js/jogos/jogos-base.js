/* =====================================================================
   EducaTEA – MOTOR DOS JOGOS (jogos-base.js)
   Tudo que os jogos têm em comum:
   - rodadas de 5 perguntas (ou 1 tabuleiro) com progresso visível;
   - errar NÃO entrega a resposta: aparece uma dica e a criança tenta de novo;
     só depois das tentativas é que a resposta aparece, com explicação;
   - depois de cada resposta a criança aperta "Continuar" (sem pressa nem
     troca de tela automática);
   - arrastar OU tocar (funciona com mouse, dedo e teclado);
   - dificuldade que acompanha o nível do jogador.
   ===================================================================== */
'use strict';

const JG = {
    jogos: {},          // nome -> definição do jogo
    rodada: null,       // estado da rodada atual
    q: null,            // estado da pergunta atual
    _abort: null
};

/* ---------- utilidades ---------- */
JG.container = () => document.getElementById('games-container');
JG.rnd = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;
JG.embaralhar = arr => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
    return a;
};
JG.sortear = (arr, n) => JG.embaralhar(arr).slice(0, n);
JG.um = arr => arr[Math.floor(Math.random() * arr.length)];
JG.semAcento = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/\s+/g, ' ').trim();
JG.esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
JG.nivel = () => (typeof estadoAtual !== 'undefined' && estadoAtual.nivelAtual) || 1;
// 1 = iniciante (níveis 1-2), 2 = intermediário (3-5), 3 = avançado (6+)
JG.faixa = () => { const n = JG.nivel(); return n <= 2 ? 1 : (n <= 5 ? 2 : 3); };

JG.AREAS = {
    'Monte a Palavra': 'palavras', 'Caça-Palavras': 'palavras', 'Sílabas Mágicas': 'palavras', 'Ditado Visual': 'palavras',
    'Rima Maluca': 'palavras', 'Qual é a Letra?': 'palavras', 'Memória de Palavras': 'palavras', 'Palavra Oculta': 'palavras',
    'Sombras Mágicas': 'palavras',
    'Soma Criativa': 'matematica', 'Subtração Divertida': 'matematica', 'Contagem': 'matematica', 'Qual é o Maior?': 'matematica',
    'Sequência': 'matematica', 'Formas Geométricas': 'matematica', 'Relógio Digital': 'matematica', 'Pares e Ímpares': 'matematica',
    'Classificação de Cores': 'matematica', 'Contagem de Objetos': 'matematica',
    'Ciclo da Água': 'ciencias', 'Animais e Habitats': 'ciencias', 'Corpo Humano': 'ciencias', 'Reciclagem': 'ciencias',
    'Sistema Solar': 'ciencias', 'Estados da Matéria': 'ciencias', 'Plantas': 'ciencias', 'Sentidos': 'ciencias',
    'Emoções': 'ciencias', 'Minha Rotina': 'ciencias', 'Cuidado com o Ambiente': 'ciencias'
};

/* ---------- estatísticas extras (usadas pelas conquistas) ---------- */
JG.extras = () => {
    if (typeof estadoAtual === 'undefined') return {};
    const e = estadoAtual.extras = estadoAtual.extras || {};
    e.rodadas = e.rodadas || 0;
    e.rodadasPerfeitas = e.rodadasPerfeitas || 0;
    e.estrelas3 = e.estrelas3 || 0;
    e.recuperadas = e.recuperadas || 0;      // acertou depois de errar (persistência)
    e.semDica = e.semDica || 0;
    e.dicas = e.dicas || 0;
    e.erros = e.erros || 0;
    e.areas = e.areas || { palavras: 0, matematica: 0, ciencias: 0 };
    e.rodadasPorJogo = e.rodadasPorJogo || {};
    e.dias = e.dias || [];
    e.ultimaPerfeitaSeguidas = e.ultimaPerfeitaSeguidas || 0;
    e.melhorPerfeitasSeguidas = e.melhorPerfeitasSeguidas || 0;
    return e;
};
JG.hoje = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
JG.marcarDia = () => { const e = JG.extras(); const h = JG.hoje(); const dt = new Date(); if (dt.getHours() < 9) e.manha = 1; if (dt.getHours() >= 19) e.noite = 1; if ([0, 6].includes(dt.getDay())) e.fimSemana = 1; if (!e.dias.includes(h)) { e.dias.push(h); if (e.dias.length > 400) e.dias.shift(); } };
JG.diasSeguidos = () => {
    const dias = new Set(JG.extras().dias || []);
    let n = 0; const d = new Date();
    const fmt = x => x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0');
    if (!dias.has(fmt(d))) d.setDate(d.getDate() - 1);
    while (dias.has(fmt(d))) { n++; d.setDate(d.getDate() - 1); }
    return n;
};

/* ---------- arrastar OU tocar ---------- */
/* raiz: elemento que contém tudo. item/alvo: seletores CSS.
   aoSoltar(itemEl, alvoEl) -> true se aceitou.
   aoTocarItem(itemEl): se existir, tocar no item chama isso (em vez de "selecionar"). */
JG.mover = function (raiz, cfg) {
    if (JG._abort) JG._abort.abort();
    JG._abort = new AbortController();
    const signal = JG._abort.signal;
    let sel = null, drag = null, suprimir = false;

    const limparSel = () => { if (sel) sel.classList.remove('jg-sel'); sel = null; raiz.classList.remove('jg-tem-sel'); };
    const alvoEm = (x, y) => {
        const el = document.elementFromPoint(x, y);
        const a = el && el.closest(cfg.alvo);
        return a && raiz.contains(a) ? a : null;
    };
    const fim = () => {
        if (drag && drag.ghost) drag.ghost.remove();
        if (drag && drag.it) drag.it.classList.remove('jg-arrastando');
        raiz.querySelectorAll('.jg-alvo-hover').forEach(n => n.classList.remove('jg-alvo-hover'));
        drag = null;
    };

    raiz.addEventListener('pointerdown', e => {
        if (e.button !== undefined && e.button > 0) return;
        const it = e.target.closest(cfg.item);
        if (!it || !raiz.contains(it) || it.dataset.bloqueado === '1' || it.disabled) return;
        drag = { it, x: e.clientX, y: e.clientY, ativo: false, ghost: null };
    }, { signal });

    document.addEventListener('pointermove', e => {
        if (!drag) return;
        if (!drag.ativo) {
            if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 8) return;
            drag.ativo = true;
            const r = drag.it.getBoundingClientRect();
            drag.dx = e.clientX - r.left; drag.dy = e.clientY - r.top;
            const g = drag.it.cloneNode(true);
            g.removeAttribute('id');
            g.classList.add('jg-ghost');
            g.style.width = r.width + 'px'; g.style.height = r.height + 'px';
            document.body.appendChild(g);
            drag.ghost = g;
            drag.it.classList.add('jg-arrastando');
        }
        e.preventDefault();
        drag.ghost.style.left = (e.clientX - drag.dx) + 'px';
        drag.ghost.style.top = (e.clientY - drag.dy) + 'px';
        raiz.querySelectorAll('.jg-alvo-hover').forEach(n => n.classList.remove('jg-alvo-hover'));
        const a = alvoEm(e.clientX, e.clientY);
        if (a) a.classList.add('jg-alvo-hover');
    }, { signal, passive: false });

    const soltar = e => {
        if (!drag) return;
        if (drag.ativo) {
            const a = alvoEm(e.clientX, e.clientY);
            const it = drag.it;
            suprimir = true; setTimeout(() => { suprimir = false; }, 0);
            fim();
            if (a) { cfg.aoSoltar(it, a); limparSel(); }
        } else {
            drag = null;
        }
    };
    document.addEventListener('pointerup', soltar, { signal });
    document.addEventListener('pointercancel', fim, { signal });

    raiz.addEventListener('click', e => {
        if (suprimir) return;
        const it = e.target.closest(cfg.item);
        const al = e.target.closest(cfg.alvo);
        if (it && raiz.contains(it) && it.dataset.bloqueado !== '1' && !it.disabled) {
            if (cfg.aoTocarItem) { cfg.aoTocarItem(it); return; }
            if (sel === it) { limparSel(); return; }
            limparSel();
            sel = it; it.classList.add('jg-sel'); raiz.classList.add('jg-tem-sel');
            return;
        }
        if (al && raiz.contains(al) && sel) {
            const it2 = sel;
            limparSel();
            cfg.aoSoltar(it2, al);
        }
    }, { signal });

    return { limparSel };
};

/* ---------- tela padrão ---------- */
JG.desenharTela = function () {
    const r = JG.rodada, def = r.def;
    const bolinhas = r.modo === 'perguntas'
        ? Array.from({ length: r.total }, (_, i) => {
            const s = r.resultados[i] || (i === r.indice ? 'atual' : 'pend');
            const ic = { ok: '✅', ajuda: '🟡', erro: '❌', atual: '🔵', pend: '⚪' }[s];
            return `<span class="jg-bola jg-bola-${s}" aria-hidden="true">${ic}</span>`;
        }).join('')
        : '';
    const textoProg = r.modo === 'perguntas'
        ? `Pergunta ${Math.min(r.indice + 1, r.total)} de ${r.total}`
        : (def.rotuloTabuleiro ? def.rotuloTabuleiro() : '');
    const pct = r.modo === 'perguntas' ? Math.round((r.indice / r.total) * 100) : 0;
    JG.container().innerHTML = `
      <div class="jogo-wrapper jg" data-jogo="${JG.esc(r.nome)}">
        <div class="jg-topo">
          <h2 class="jg-titulo">${def.emoji} ${JG.esc(r.nome)}</h2>
          <div class="jg-progresso" role="status" aria-live="polite">
            <span class="jg-prog-texto" id="jg-prog-texto">${textoProg}</span>
            ${r.modo === 'perguntas' ? `<div class="jg-barra" aria-hidden="true"><i id="jg-barra-i" style="width:${pct}%"></i></div>
            <div class="jg-bolas" id="jg-bolas">${bolinhas}</div>` : ''}
          </div>
        </div>
        ${def.instrucao ? `<p class="jg-instrucao" id="jg-instrucao"></p>` : ''}
        <div id="jg-corpo" class="jg-corpo"></div>
        <div id="jg-feedback" class="jg-feedback" role="status" aria-live="polite"></div>
        <div class="jg-rodape">
          <button id="jg-continuar" class="btn-verificar jg-continuar" hidden>Continuar ➜</button>
          <button id="jg-dica" class="btn-voltar jg-dica" ${def.dica ? '' : 'hidden'}>💡 Dica</button>
          <button class="btn-voltar" onclick="navigateHome()">🏠 Início</button>
        </div>
      </div>`;
    document.getElementById('jg-dica').onclick = () => JG.pedirDica();
};

JG.atualizarProgresso = function () {
    const r = JG.rodada;
    if (!r || r.modo !== 'perguntas') return;
    const b = document.getElementById('jg-bolas');
    if (b) {
        b.innerHTML = Array.from({ length: r.total }, (_, i) => {
            const s = r.resultados[i] || (i === r.indice ? 'atual' : 'pend');
            const ic = { ok: '✅', ajuda: '🟡', erro: '❌', atual: '🔵', pend: '⚪' }[s];
            return `<span class="jg-bola jg-bola-${s}" aria-hidden="true">${ic}</span>`;
        }).join('');
    }
    const t = document.getElementById('jg-prog-texto');
    if (t) t.textContent = `Pergunta ${Math.min(r.indice + 1, r.total)} de ${r.total}`;
    const bi = document.getElementById('jg-barra-i');
    if (bi) bi.style.width = Math.round((r.resultados.filter(Boolean).length / r.total) * 100) + '%';
};

JG.mostrarFeedback = function (tipo, html) {
    const f = document.getElementById('jg-feedback');
    if (!f) return;
    f.className = 'jg-feedback jg-fb-' + tipo;
    f.innerHTML = html;
    f.style.display = html ? 'block' : 'none';
};

/* ---------- abrir um jogo ---------- */
/* leva a tela até o jogo (no celular o painel de pontos fica em cima e empurra o jogo para baixo) */
JG.rolarParaJogo = function (forcar) {
    const w = document.querySelector('#games-container .jg');
    if (!w) return;
    const topo = w.getBoundingClientRect().top;
    if (forcar || topo < 0 || topo > window.innerHeight * 0.6) {
        try { w.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (_) { w.scrollIntoView(); }
    }
};

JG.abrir = function (nome) {
    const def = JG.jogos[nome];
    if (!def) return false;
    JG.marcarDia();
    JG.rodada = {
        nome, def, modo: def.modo || 'perguntas', total: def.total || 5, indice: 0,
        resultados: [], certas: 0, primeira: 0, ajudadas: 0, reveladas: 0, dicas: 0, pontos: 0,
        passos: 0, erros: 0, inicio: Date.now()
    };
    if (JG.rodada.modo === 'perguntas') JG.proxima(); else JG.novoTabuleiro();
    JG.rolarParaJogo(true);
    return true;
};

JG.proxima = function () {
    const r = JG.rodada;
    if (!r) return;
    if (r.indice >= r.total) { JG.fimRodada(); return; }
    JG.q = { tentativas: 0, resolvida: false, usouDica: false, dados: null };
    JG.desenharTela();
    if (r.def.instrucao) document.getElementById('jg-instrucao').innerHTML = r.def.instrucao;
    document.getElementById('jg-continuar').hidden = true;
    JG.mostrarFeedback('nenhum', '');
    JG.q.dados = r.def.nova(r);
    r.def.desenhar(JG.q.dados, document.getElementById('jg-corpo'), r);
    JG.atualizarProgresso();
    if (r.indice > 0) JG.rolarParaJogo(false);
};

JG.novoTabuleiro = function () {
    const r = JG.rodada;
    r.passos = 0; r.erros = 0; r.pontos = 0; r.dicas = 0;
    JG.q = { tentativas: 0, resolvida: false, usouDica: false, dados: null };
    JG.desenharTela();
    if (r.def.instrucao) document.getElementById('jg-instrucao').innerHTML = r.def.instrucao;
    document.getElementById('jg-continuar').hidden = true;
    JG.mostrarFeedback('nenhum', '');
    r.def.montar(r, document.getElementById('jg-corpo'));
};

/* ---------- respostas (perguntas) ---------- */
JG.mostrarContinuar = function (rotulo) {
    const b = document.getElementById('jg-continuar');
    if (!b) return;
    b.textContent = rotulo || (JG.rodada.indice + 1 >= JG.rodada.total ? 'Ver resultado 🏁' : 'Continuar ➜');
    b.hidden = false;
    b.onclick = () => { JG.rodada.indice++; JG.proxima(); };
    b.focus({ preventScroll: false });
};

JG.pontuar = function (tipo, fator) {
    const r = JG.rodada;
    const ganho = (typeof registrarAcerto === 'function')
        ? registrarAcerto(r.nome, tipo || r.def.tipo || 'ACERTO_MEDIO', 0, fator) : 0;
    r.pontos += ganho || 0;
    const e = JG.extras();
    const area = JG.AREAS[r.nome];
    if (area) e.areas[area] = (e.areas[area] || 0) + 1;
    return ganho;
};

/* acertou a pergunta atual */
JG.certo = function (opts) {
    opts = opts || {};
    const r = JG.rodada, q = JG.q;
    if (!r || q.resolvida) return;
    q.resolvida = true;
    const e = JG.extras();
    const fatorTent = [1, 0.6, 0.4][Math.min(q.tentativas, 2)];
    const fator = fatorTent * (q.usouDica ? 0.7 : 1);
    const ganho = JG.pontuar(opts.tipo, fator);
    r.certas++;
    if (q.tentativas === 0 && !q.usouDica) r.primeira++; else r.ajudadas++;
    if (q.tentativas > 0) e.recuperadas++;
    if (!q.usouDica) e.semDica++;
    r.resultados[r.indice] = (q.tentativas === 0 && !q.usouDica) ? 'ok' : 'ajuda';
    JG.atualizarProgresso();
    const elogio = q.tentativas === 0 && !q.usouDica
        ? JG.um(['Muito bem! 🎉', 'Isso mesmo! ⭐', 'Acertou! 👏', 'Perfeito! 🌟'])
        : JG.um(['Você conseguiu! 💪', 'Boa! Persistir funcionou! 🌈']);
    if (JG.confete) JG.confete();
    JG.mostrarFeedback('ok', `<strong>${elogio}</strong>${opts.explicacao ? `<p>${opts.explicacao}</p>` : ''}`);
    JG.mostrarContinuar();
    if (typeof salvarProgresso === 'function') salvarProgresso();
    if (typeof checarConquistas === 'function') checarConquistas();
    return ganho;
};

/* errou. opts: {dica, explicacao, resposta, max, revelar()} */
JG.errado = function (opts) {
    opts = opts || {};
    const r = JG.rodada, q = JG.q;
    if (!r || q.resolvida) return 0;
    const max = opts.max || 2;
    q.tentativas++;
    r.erros++;
    JG.extras().erros++;
    if (typeof registrarErro === 'function') registrarErro(r.nome);
    if (q.tentativas >= max) {
        q.resolvida = true;
        r.reveladas++;
        r.resultados[r.indice] = 'erro';
        JG.atualizarProgresso();
        if (opts.revelar) opts.revelar();
        JG.mostrarFeedback('erro', `<strong>Vamos aprender juntos! 💙</strong>${opts.resposta ? `<p>A resposta é <b>${opts.resposta}</b>.</p>` : ''}${opts.explicacao ? `<p>${opts.explicacao}</p>` : ''}`);
        JG.mostrarContinuar();
        if (typeof salvarProgresso === 'function') salvarProgresso();
        return 0;
    }
    if (typeof exibirToast === 'function') exibirToast('Quase! Tente de novo 💪', false);
    JG.mostrarFeedback('tente', `<strong>Quase! Tente de novo. 💪</strong>${opts.dica ? `<p>💡 ${opts.dica}</p>` : ''}`);
    return max - q.tentativas;
};

JG.pedirDica = function () {
    const r = JG.rodada, q = JG.q;
    if (!r || !r.def.dica || q.resolvida) return;
    const msg = r.def.dica(q.dados, r);
    if (msg === false) return;
    if (!q.usouDica) { q.usouDica = true; r.dicas++; JG.extras().dicas++; }
    if (msg) JG.mostrarFeedback('dica', `<strong>💡 Dica</strong><p>${msg}</p>`);
};

/* ---------- tabuleiros (jogos de uma tela só) ---------- */
JG.passoCerto = function (fator) {
    const r = JG.rodada;
    r.passos++;
    const e = JG.extras();
    const ganho = JG.pontuar('ACERTO_SIMPLES', fator === undefined ? 0.6 : fator);
    if (!JG.q.usouDica) e.semDica++;
    if (typeof salvarProgresso === 'function') salvarProgresso();
    if (typeof checarConquistas === 'function') checarConquistas();
    return ganho;
};
JG.passoErrado = function () {
    const r = JG.rodada;
    r.erros++;
    JG.extras().erros++;
    if (typeof registrarErro === 'function') registrarErro(r.nome);
};

/* termina a rodada. info: {acertos, total, estrelas?, texto?} */
JG.fimRodada = function (info) {
    const r = JG.rodada;
    const e = JG.extras();
    let estrelas, acertos, total;
    if (r.modo === 'perguntas') {
        total = r.total;
        acertos = r.certas;
        const pontosNota = r.primeira + r.ajudadas * 0.5;
        estrelas = pontosNota >= total - 0.5 ? 3 : (pontosNota >= total * 0.6 ? 2 : (pontosNota >= total * 0.3 ? 1 : 0));
    } else {
        info = info || {};
        total = info.total || 1;
        acertos = info.acertos === undefined ? total : info.acertos;
        estrelas = info.estrelas === undefined ? 3 : info.estrelas;
    }
    const perfeita = estrelas === 3 && r.reveladas === 0 && r.dicas === 0 && r.erros === 0;
    e.rodadas++;
    e.rodadasPorJogo[r.nome] = (e.rodadasPorJogo[r.nome] || 0) + 1;
    if (estrelas === 3) e.estrelas3++;
    if (perfeita) { e.rodadasPerfeitas++; e.ultimaPerfeitaSeguidas++; e.melhorPerfeitasSeguidas = Math.max(e.melhorPerfeitasSeguidas, e.ultimaPerfeitaSeguidas); }
    else e.ultimaPerfeitaSeguidas = 0;
    // bônus por concluir a rodada
    const cfg = (typeof SISTEMA_PROGRESSO !== 'undefined' && SISTEMA_PROGRESSO.JOGOS[r.nome]) || { completo: 30 };
    const bonus = Math.round(cfg.completo * [0.2, 0.4, 0.7, 1][estrelas]);
    if (bonus > 0 && typeof estadoAtual !== 'undefined') {
        estadoAtual.pontuacaoTotal = (estadoAtual.pontuacaoTotal || 0) + bonus;
        r.pontos += bonus;
        if (typeof atualizarProgresso === 'function') atualizarProgresso();
    }
    const frase = ['Continue praticando, você vai chegar lá! 💙', 'Bom começo! Vamos de novo? 🌱', 'Muito bem! Quase perfeito! 🌟', 'Incrível! Você mandou muito bem! 🏆'][estrelas];
    JG.container().innerHTML = `
      <div class="jogo-wrapper jg">
        <div class="jg-fim">
          <h2>${r.def.emoji} ${JG.esc(r.nome)}</h2>
          <div class="jg-estrelas" aria-label="${estrelas} de 3 estrelas">${[1, 2, 3].map(i => `<span class="${i <= estrelas ? 'on' : 'off'}">⭐</span>`).join('')}</div>
          <p class="jg-fim-frase">${(info && info.texto) || frase}</p>
          <ul class="jg-fim-lista">
            <li>✅ Acertos: <b>${acertos}</b> de ${total}</li>
            ${r.dicas ? `<li>💡 Dicas usadas: <b>${r.dicas}</b></li>` : ''}
            <li>⭐ Pontos nesta rodada: <b>${r.pontos}</b></li>
          </ul>
          <div class="jg-rodape">
            <button class="btn-verificar" id="jg-de-novo">▶️ Jogar de novo</button>
            <button class="btn-voltar" onclick="navigateHome()">🏠 Início</button>
          </div>
        </div>
      </div>`;
    document.getElementById('jg-de-novo').onclick = () => JG.abrir(r.nome);
    if (typeof confetti !== 'undefined' && estrelas >= 2) confetti({ particleCount: 60 + estrelas * 40, spread: 80, origin: { y: 0.5 } });
    if (typeof salvarProgresso === 'function') salvarProgresso();
    if (typeof checarConquistas === 'function') checarConquistas();
};

/* ---------- botões de opção (escolha) ---------- */
/* lista: [{valor, html}]. correta: valor. config:{dica, explicacao, resposta, max, classe} */
JG.escolhas = function (corpo, lista, correta, cfg) {
    cfg = cfg || {};
    const wrap = document.createElement('div');
    wrap.className = 'jg-opcoes ' + (cfg.classe || '');
    lista.forEach((o, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'jg-op';
        b.dataset.valor = String(o.valor);
        b.innerHTML = o.html;
        wrap.appendChild(b);
    });
    corpo.appendChild(wrap);
    const marcarCerta = () => {
        wrap.querySelectorAll('.jg-op').forEach(b => {
            if (b.dataset.valor === String(correta)) { b.classList.add('jg-op-ok'); b.insertAdjacentHTML('beforeend', '<span class="jg-selo" aria-hidden="true">✔</span>'); }
            b.disabled = true;
        });
    };
    wrap.addEventListener('click', ev => {
        const b = ev.target.closest('.jg-op');
        if (!b || b.disabled || JG.q.resolvida) return;
        if (b.dataset.valor === String(correta)) {
            marcarCerta();
            JG.certo({ explicacao: typeof cfg.explicacao === 'function' ? cfg.explicacao() : cfg.explicacao });
        } else {
            b.disabled = true;
            b.classList.add('jg-op-erro');
            b.insertAdjacentHTML('beforeend', '<span class="jg-selo" aria-hidden="true">✖</span>');
            JG.errado({
                dica: typeof cfg.dica === 'function' ? cfg.dica() : cfg.dica,
                explicacao: typeof cfg.explicacao === 'function' ? cfg.explicacao() : cfg.explicacao,
                resposta: cfg.resposta !== undefined ? cfg.resposta : undefined,
                max: cfg.max || 2,
                revelar: marcarCerta
            });
        }
    });
    // dica "50/50": tira duas opções erradas
    JG.q.cincoZero = () => {
        const erradas = [...wrap.querySelectorAll('.jg-op')].filter(b => b.dataset.valor !== String(correta) && !b.disabled);
        const tirar = JG.sortear(erradas, Math.max(1, Math.min(2, erradas.length - 1)));
        tirar.forEach(b => { b.disabled = true; b.classList.add('jg-op-fora'); });
        return tirar.length;
    };
    return wrap;
};

/* ---------- entrada numérica / de texto ---------- */
JG.campo = function (corpo, cfg) {
    // cfg: {tipo:'number'|'text', largura, placeholder, comparar(valor)->bool, dica, explicacao, resposta, max, maxlen}
    const div = document.createElement('div');
    div.className = 'jg-campo';
    div.innerHTML = `<input class="jg-input" type="${cfg.tipo === 'number' ? 'number' : 'text'}" inputmode="${cfg.tipo === 'number' ? 'numeric' : 'text'}"
        autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="${cfg.placeholder || '?'}" aria-label="Sua resposta" ${cfg.maxlen ? `maxlength="${cfg.maxlen}"` : ''}>
        <button type="button" class="btn-verificar jg-enviar">✅ Responder</button>`;
    corpo.appendChild(div);
    const inp = div.querySelector('input'), btn = div.querySelector('button');
    const enviar = () => {
        if (JG.q.resolvida) return;
        const v = inp.value.trim();
        if (v === '') { if (typeof exibirToast === 'function') exibirToast('Escreva uma resposta primeiro 🙂', false); inp.focus(); return; }
        if (cfg.comparar(v)) {
            inp.disabled = true; btn.disabled = true; inp.classList.add('jg-input-ok');
            JG.certo({ explicacao: typeof cfg.explicacao === 'function' ? cfg.explicacao() : cfg.explicacao });
        } else {
            inp.classList.add('jg-input-erro'); setTimeout(() => inp.classList.remove('jg-input-erro'), 600);
            JG.errado({
                dica: typeof cfg.dica === 'function' ? cfg.dica(JG.q.tentativas) : cfg.dica,
                explicacao: typeof cfg.explicacao === 'function' ? cfg.explicacao() : cfg.explicacao,
                resposta: cfg.resposta,
                max: cfg.max || 3,
                revelar: () => { inp.disabled = true; btn.disabled = true; inp.classList.add('jg-input-erro'); }
            });
            inp.select();
        }
    };
    btn.onclick = enviar;
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') enviar(); });
    setTimeout(() => { try { inp.focus({ preventScroll: true }); } catch (_) { } }, 50);
    return { inp, btn };
};

/* ---------- voz (ouvir a palavra) ---------- */
JG.falar = function (texto) {
    try {
        if (!('speechSynthesis' in window)) return false;
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(texto);
        u.lang = 'pt-BR'; u.rate = 0.85;
        window.speechSynthesis.speak(u);
        return true;
    } catch (_) { return false; }
};
JG.botaoOuvir = function (texto) {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'btn-voltar jg-ouvir'; b.textContent = '🔊 Ouvir';
    b.onclick = () => { if (!JG.falar(texto) && typeof exibirToast === 'function') exibirToast('Seu aparelho não tem voz disponível 😕', false); };
    return b;
};

/* ---------- chuvinha de confete ao acertar ---------- */
JG.confete = function () {
    try {
        if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const alvo = document.getElementById('jg-corpo'); if (!alvo) return;
        const r = alvo.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = Math.max(r.top, 0) + Math.min(r.height, innerHeight) / 3;
        const lista = ['⭐', '✨', '🎉', '💙', '🌟', '🎈'];
        for (let i = 0; i < 12; i++) {
            const s = document.createElement('span');
            s.className = 'jg-confete'; s.textContent = lista[i % lista.length];
            s.style.left = cx + 'px'; s.style.top = cy + 'px';
            s.style.setProperty('--dx', (Math.random() * 280 - 140) + 'px');
            s.style.setProperty('--dy', (Math.random() * -160 - 30) + 'px');
            document.body.appendChild(s);
            setTimeout(() => s.remove(), 1100);
        }
    } catch (_) { }
};
