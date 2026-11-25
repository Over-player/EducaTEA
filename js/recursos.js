/* =============================================================================
   RECURSOS DE ACESSIBILIDADE E AJUDA

   1. Fonte para dislexia      – liga/desliga no painel 🎨 Personalizar
   2. Reduzir movimento        – desliga animações e confete (segue o sistema, se a pessoa já pediu isso)
   3. Libras (VLibras)         – tradutor oficial do governo federal, liga/desliga no painel
   4. Tutorial "Como usar"     – passo a passo no menu lateral (e um convite na primeira visita)
   5. Avaliação do site        – página com o botão que abre o formulário

   PARA TROCAR O LINK DO FORMULÁRIO: edite FORMULARIO_URL logo abaixo.
   ============================================================================= */
(function () {
    'use strict';

    const FORMULARIO_URL = '';   // cole aqui o link do Google Forms (ex.: 'https://forms.gle/xxxx')

    const CHAVE = 'educatea_recursos';
    const $ = id => document.getElementById(id);

    /* --------------------------------------------------------------- PREFERÊNCIAS */
    const padrao = {
        dislexia: false,
        // quem já pediu menos movimento no sistema começa com a opção ligada
        movimento: !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches),
        libras: false
    };
    let pref = Object.assign({}, padrao);

    function carregar() {
        try { Object.assign(pref, JSON.parse(localStorage.getItem(CHAVE)) || {}); } catch (e) { /* usa o padrão */ }
    }
    function salvar() { try { localStorage.setItem(CHAVE, JSON.stringify(pref)); } catch (e) { /* sem armazenamento */ } }

    /* ---------------------------------------------------------- 1. FONTE DISLEXIA */
    let fonteCarregada = false;
    function carregarFonteDislexia() {
        if (fonteCarregada) return;
        fonteCarregada = true;
        ['https://cdn.jsdelivr.net/npm/@fontsource/opendyslexic@5.0.8/400.css',
         'https://cdn.jsdelivr.net/npm/@fontsource/opendyslexic@5.0.8/700.css',
         'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap'].forEach(href => {
            const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l);
        });
    }
    function aplicarDislexia(ligado) {
        pref.dislexia = ligado;
        if (ligado) carregarFonteDislexia();
        document.body.classList.toggle('fonte-dislexia', ligado);
    }

    /* -------------------------------------------------------- 2. REDUZIR MOVIMENTO */
    const confeteOriginal = window.confetti;
    function aplicarMovimento(ligado) {
        pref.movimento = ligado;
        document.body.classList.toggle('reduzir-movimento', ligado);
        // o confete (biblioteca externa) é trocado por uma função vazia enquanto a opção estiver ligada
        if (ligado) window.confetti = function () {};
        else if (confeteOriginal) window.confetti = confeteOriginal;
    }

    /* ----------------------------------------------------------------- 3. LIBRAS */
    let libras = false;
    function aplicarLibras(ligado) {
        pref.libras = ligado;
        if (ligado && !libras) {
            libras = true;
            document.body.insertAdjacentHTML('beforeend',
                '<div vw class="enabled" id="vlibras-caixa"><div vw-access-button class="active"></div>' +
                '<div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div></div>');
            const s = document.createElement('script');
            s.src = 'https://vlibras.gov.br/app/vlibras-plugin.js';
            s.onload = () => { try { new window.VLibras.Widget('https://vlibras.gov.br/app'); } catch (e) { /* sem internet */ } };
            document.body.appendChild(s);
        }
        const caixa = $('vlibras-caixa');
        if (caixa) caixa.style.display = ligado ? '' : 'none';
    }

    /* ------------------------------------------------- BOTÕES NO PAINEL PERSONALIZAR */
    function botao(id, emoji, titulo, desc, aoMudar, ligado) {
        return `<button type="button" class="btn-recurso" id="${id}" role="switch" aria-checked="${ligado}">
            <span class="btn-recurso-icone">${emoji}</span>
            <span class="btn-recurso-texto"><strong>${titulo}</strong><small>${desc}</small></span>
            <span class="btn-recurso-chave" aria-hidden="true"></span></button>`;
    }

    function montarPainel() {
        const ancora = document.querySelector('#personalizacao-menu .opcao-personalizacao:last-of-type');
        if (!ancora) return;
        ancora.insertAdjacentHTML('beforebegin', `
            <div class="opcao-personalizacao" id="recursos-extras">
                <label>♿ Acessibilidade</label>
                ${botao('rec-dislexia', '🔠', 'Fonte para dislexia', 'Letras mais fáceis de diferenciar', 0, pref.dislexia)}
                ${botao('rec-movimento', '🧘', 'Reduzir movimento', 'Menos animações e sem confete', 0, pref.movimento)}
                ${botao('rec-libras', '🤟', 'Libras', 'Tradutor de Libras (VLibras)', 0, pref.libras)}
            </div>`);
        [['rec-dislexia', 'dislexia', aplicarDislexia],
         ['rec-movimento', 'movimento', aplicarMovimento],
         ['rec-libras', 'libras', aplicarLibras]].forEach(([id, chave, aplicar]) => {
            $(id).addEventListener('click', () => { aplicar(!pref[chave]); salvar(); marcar(); });
        });
        marcar();
    }

    function marcar() {
        [['rec-dislexia', 'dislexia'], ['rec-movimento', 'movimento'], ['rec-libras', 'libras']].forEach(([id, chave]) => {
            const b = $(id); if (!b) return;
            b.setAttribute('aria-checked', String(pref[chave]));
            b.classList.toggle('ligado', pref[chave]);
        });
    }

    // chamado por "Restaurar Configurações" (script.js)
    window.resetRecursos = function () {
        pref = Object.assign({}, padrao, { movimento: padrao.movimento });
        aplicarDislexia(false); aplicarMovimento(padrao.movimento); aplicarLibras(false);
        salvar(); marcar();
    };

    /* ----------------------------------------------------------------- 4. TUTORIAL */
    const PASSOS = [
        ['👋', 'Bem-vindo ao EducaTEA!', 'Aqui você aprende brincando. Este passo a passo mostra como usar o site. Você pode voltar nele quando quiser, em "Como usar", no menu.'],
        ['🎮', 'Escolha um jogo', 'No menu da esquerda ficam as áreas: Palavras, Matemática e Ciências. Toque em uma área e depois no jogo que quiser. Em celular, abra o menu pelo botão ☰.'],
        ['⭐', 'Ganhe pontos e estrelas', 'Cada acerto vale pontos. Se errar, não tem problema: dá para tentar de novo, e há dicas para ajudar.'],
        ['🏆', 'Conquiste medalhas', 'Jogando, você desbloqueia conquistas. Toque em "🏆 Conquistas" na barra de cima para ver todas e quanto falta para a próxima.'],
        ['🎨', 'Deixe o site do seu jeito', 'No botão 🎨 você escolhe o tema, o tamanho da letra, o espaçamento, a fonte para dislexia, menos movimento e Libras.'],
        ['🎵', 'Música para relaxar', 'No player de música você escolhe uma trilha calma para ouvir enquanto joga.'],
        ['👤', 'Entre na sua conta', 'Com uma conta, seu progresso fica salvo e o professor pode acompanhar. Entrar é opcional: sem conta o site funciona do mesmo jeito.'],
        ['📝', 'Conte o que achou', 'Em "Avaliar o site", no menu, você nos ajuda a melhorar. Agora é só jogar. Divirta-se!']
    ];
    let passo = 0, quemAbriu = null;

    function htmlTutorial() {
        return `
        <div class="auth-modal" id="tutorial-modal" hidden>
            <div class="auth-caixa tutorial-caixa" role="dialog" aria-modal="true" aria-labelledby="tutorial-titulo">
                <button type="button" class="auth-fechar" id="tutorial-fechar" aria-label="Fechar tutorial">✕</button>
                <div class="tutorial-emoji" id="tutorial-emoji" aria-hidden="true"></div>
                <h2 id="tutorial-titulo"></h2>
                <p id="tutorial-texto"></p>
                <div class="tutorial-pontos" id="tutorial-pontos" aria-hidden="true"></div>
                <div class="tutorial-botoes">
                    <button type="button" class="auth-botao tutorial-sec" id="tutorial-anterior">← Voltar</button>
                    <button type="button" class="auth-botao" id="tutorial-proximo">Próximo →</button>
                </div>
                <p class="tutorial-contador" id="tutorial-contador" aria-live="polite"></p>
            </div>
        </div>`;
    }

    function desenharPasso() {
        const [emoji, titulo, texto] = PASSOS[passo];
        $('tutorial-emoji').textContent = emoji;
        $('tutorial-titulo').textContent = titulo;
        $('tutorial-texto').textContent = texto;
        $('tutorial-contador').textContent = `Passo ${passo + 1} de ${PASSOS.length}`;
        $('tutorial-pontos').innerHTML = PASSOS.map((_, i) => `<i class="${i === passo ? 'atual' : ''}"></i>`).join('');
        $('tutorial-anterior').style.visibility = passo === 0 ? 'hidden' : 'visible';
        $('tutorial-proximo').textContent = passo === PASSOS.length - 1 ? '✅ Começar a jogar' : 'Próximo →';
    }

    function abrirTutorial() {
        passo = 0; desenharPasso();
        quemAbriu = document.activeElement;
        $('tutorial-modal').hidden = false;
        document.body.classList.add('tcc-lendo');
        $('tutorial-proximo').focus();
    }
    function fecharTutorial() {
        $('tutorial-modal').hidden = true;
        document.body.classList.remove('tcc-lendo');
        try { localStorage.setItem(CHAVE + '_tutorial_visto', '1'); } catch (e) { /* ok */ }
        const convite = $('tutorial-convite'); if (convite) convite.remove();
        if (quemAbriu && quemAbriu.focus) quemAbriu.focus();
    }

    function ligarTutorial() {
        $('tutorial-fechar').addEventListener('click', fecharTutorial);
        $('tutorial-modal').addEventListener('click', e => { if (e.target.id === 'tutorial-modal') fecharTutorial(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('tutorial-modal').hidden) fecharTutorial(); });
        $('tutorial-anterior').addEventListener('click', () => { if (passo > 0) { passo--; desenharPasso(); } });
        $('tutorial-proximo').addEventListener('click', () => {
            if (passo < PASSOS.length - 1) { passo++; desenharPasso(); } else fecharTutorial();
        });
    }

    // na primeira visita, um convite pequeno (não abre sozinho para não assustar)
    function convidarPrimeiraVisita() {
        let visto = false;
        try { visto = localStorage.getItem(CHAVE + '_tutorial_visto') === '1'; } catch (e) { /* ok */ }
        if (visto) return;
        document.body.insertAdjacentHTML('beforeend', `
            <div class="tutorial-convite" id="tutorial-convite" role="region" aria-label="Convite para o tutorial">
                <span>👋 Primeira vez aqui?</span>
                <button type="button" id="convite-ver">Ver como usar</button>
                <button type="button" id="convite-fechar" aria-label="Dispensar">✕</button>
            </div>`);
        $('convite-ver').addEventListener('click', abrirTutorial);
        $('convite-fechar').addEventListener('click', () => {
            $('tutorial-convite').remove();
            try { localStorage.setItem(CHAVE + '_tutorial_visto', '1'); } catch (e) { /* ok */ }
        });
    }

    /* ---------------------------------------------------------------- 5. AVALIAÇÃO */
    function htmlAvaliacao() {
        const tem = !!FORMULARIO_URL;
        return `
        <div class="card-base avaliacao-card">
            <h2>📝 Avalie o EducaTEA</h2>
            <p>Sua opinião ajuda a melhorar a plataforma. Responder leva poucos minutos, e é para alunos, pais e professores.</p>
            ${tem ? `<a class="btn-tcc" href="${FORMULARIO_URL}" target="_blank" rel="noopener">Responder o formulário</a>`
                  : '<p class="prof-ajuda">O formulário será publicado aqui em breve.</p>'}
        </div>`;
    }

    function abrirAvaliacao() { mostrarPagina('avaliacao-section', 'nav-avaliacao'); }

    /* -------------------------------------------------------------------- INICIAR */
    function iniciar() {
        carregar();
        aplicarDislexia(pref.dislexia);
        aplicarMovimento(pref.movimento);
        aplicarLibras(pref.libras);
        montarPainel();

        document.body.insertAdjacentHTML('beforeend', htmlTutorial());
        ligarTutorial();
        const secao = $('avaliacao-section'); if (secao) secao.innerHTML = htmlAvaliacao();

        window.abrirTutorial = abrirTutorial;
        window.abrirAvaliacao = abrirAvaliacao;
        setTimeout(convidarPrimeiraVisita, 1500);
    }

    iniciar();
})();
