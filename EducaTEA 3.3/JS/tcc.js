/* =============================================================================
   ABA "NOSSO TCC"  —  tudo desta aba está neste arquivo (conteúdo + comportamento)

   COMO USAR
   • Trocar o PDF: substitua  tcc/TCC_EducaTEA.pdf  (mesmo nome).
   • Trocar a capa: salve a 1ª página do PDF como imagem em  tcc/capa.jpg
     (se a imagem não existir, aparece uma capa simples no lugar).
   • Trocar títulos e texto: edite apenas o bloco "1. DADOS".
   • Enquanto o PDF não existir, a aba mostra "O TCC será publicado em breve".

   ESTRUTURA DO ARQUIVO
   1. DADOS        – textos e caminhos (o que você edita)
   2. HTML         – monta a aba e a janela de leitura
   3. LEITOR       – abre e fecha a janela com o PDF
   4. PDF          – verifica se o arquivo existe
   5. ABRIR A ABA  – função chamada pelo menu lateral
   6. INICIAR      – roda ao carregar a página
   ============================================================================= */
(function () {
    'use strict';

    /* ------------------------------------------------------------------ 1. DADOS */
    const TCC = {
        arquivoPdf:   'tcc/TCC_EducaTEA.pdf',
        capa:         'tcc/capa.jpg',
        nomeDownload: 'TCC_EducaTEA.pdf',

        // título grande ao lado da capa
        titulo: 'Trabalho de Conclusão de Curso',
        // título completo do trabalho (aparece na capa simples e na janela de leitura)
        tituloCompleto: 'EducaTEA: Plataforma Interativa para uma Educação mais Inclusiva',
        // texto ao lado da capa (um parágrafo)
        texto: 'Confira o texto que deu origem ao EducaTEA: o nosso Trabalho de Conclusão de Curso, de Ana Carolina Gattes Roriz e Bruno Silva de Oliveira, orientado pela Prof.ª Me. Mônica Mendes Da Cunha Pestana, no IFMS – Campus Ponta Porã. Este trabalho explica como estamos utilizando a tecnologia como uma ponte, e não uma barreira, para a inclusão de estudantes com Transtorno do Espectro Autista (TEA) e de todos que aprendem de forma diferente. Nele você encontra a fundamentação teórica, o passo a passo da pesquisa e a construção da plataforma, com jogos, recursos de acessibilidade e conforto sensorial pensados para uma educação mais inclusiva.',
        textoBotao: 'Visualizar'
    };

    const ID_SECAO = 'tcc-section';
    const ID_MENU  = 'nav-tcc';

    /* -------------------------------------------------------------------- 2. HTML */
    function htmlCapa() {
        // se a imagem da capa não carregar, mostra uma capa simples (ver onerror)
        return `
            <div class="tcc-capa">
                <img src="${TCC.capa}" alt="Capa do TCC: ${TCC.tituloCompleto}"
                     onerror="this.parentNode.classList.add('sem-imagem'); this.remove();">
                <div class="tcc-capa-simples" aria-hidden="true">
                    <span>📄</span><strong>${TCC.tituloCompleto}</strong>
                </div>
            </div>`;
    }

    function htmlAba() {
        return `
            <div class="tcc-destaque" id="tcc-destaque">
                ${htmlCapa()}

                <div class="tcc-conteudo">
                    <h2 class="tcc-titulo">${TCC.titulo}</h2>
                    <p>${TCC.texto}</p>
                    <button type="button" class="btn-tcc" id="tcc-visualizar">${TCC.textoBotao}</button>
                </div>
            </div>

            <div class="card-base tcc-vazio" id="tcc-vazio" hidden>
                <h3>📄 O TCC será publicado aqui em breve</h3>
                <p>Estamos finalizando o envio do arquivo. Volte em breve para ler o trabalho completo.</p>
            </div>`;
    }

    function htmlJanela() {
        return `
            <div class="tcc-modal" id="tcc-modal" hidden>
                <div class="tcc-modal-caixa" role="dialog" aria-modal="true" aria-label="Leitura do TCC">
                    <div class="tcc-modal-topo">
                        <strong>${TCC.tituloCompleto}</strong>
                        <span class="tcc-modal-acoes">
                            <a class="tcc-modal-baixar" href="${TCC.arquivoPdf}" download="${TCC.nomeDownload}">Baixar PDF</a>
                            <button type="button" class="tcc-modal-fechar" id="tcc-fechar" aria-label="Fechar leitura">✕ Fechar</button>
                        </span>
                    </div>
                    <iframe title="TCC EducaTEA em PDF"></iframe>
                </div>
            </div>`;
    }

    /* ------------------------------------------------------------------- 3. LEITOR */
    let botaoQueAbriu = null;

    // celulares costumam não mostrar PDF dentro da página: nesses casos abre em outra aba
    function navegadorMostraPdf() {
        return window.innerWidth > 700 && navigator.pdfViewerEnabled !== false;
    }

    function abrirLeitor() {
        if (!navegadorMostraPdf()) { window.open(TCC.arquivoPdf, '_blank', 'noopener'); return; }

        const janela = document.getElementById('tcc-modal');
        const quadro = janela.querySelector('iframe');
        if (!quadro.getAttribute('src')) quadro.src = TCC.arquivoPdf + '#view=FitH';

        botaoQueAbriu = document.activeElement;
        janela.hidden = false;
        document.body.classList.add('tcc-lendo');
        document.getElementById('tcc-fechar').focus();
    }

    function fecharLeitor() {
        document.getElementById('tcc-modal').hidden = true;
        document.body.classList.remove('tcc-lendo');
        if (botaoQueAbriu) botaoQueAbriu.focus();
    }

    function ligarEventos() {
        document.getElementById('tcc-visualizar').addEventListener('click', abrirLeitor);
        document.getElementById('tcc-fechar').addEventListener('click', fecharLeitor);

        const janela = document.getElementById('tcc-modal');
        janela.addEventListener('click', e => { if (e.target === janela) fecharLeitor(); });   // clicou fora
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !janela.hidden) fecharLeitor(); });
    }

    /* --------------------------------------------------------------------- 4. PDF */
    function mostrarConteudo(pdfExiste) {
        document.getElementById('tcc-destaque').hidden = !pdfExiste;
        document.getElementById('tcc-vazio').hidden = pdfExiste;
    }

    function verificarPdf() {
        fetch(TCC.arquivoPdf, { method: 'HEAD' })
            .then(resposta => mostrarConteudo(resposta.ok))
            // abrindo o index.html direto do computador (file://) não dá para verificar: assume que existe
            .catch(() => mostrarConteudo(location.protocol === 'file:'));
    }

    /* --------------------------------------------------------------- 5. ABRIR A ABA */
    function abrirTCC() {
        mostrarPagina(ID_SECAO, ID_MENU);   // função do script.js que troca de página
        verificarPdf();
    }

    /* -------------------------------------------------------------------- 6. INICIAR */
    function iniciar() {
        const secao = document.getElementById(ID_SECAO);
        if (!secao) return;
        secao.innerHTML = htmlAba();
        document.body.insertAdjacentHTML('beforeend', htmlJanela());
        ligarEventos();
        window.abrirTCC = abrirTCC;          // usada pelo onclick do menu lateral
    }

    iniciar();   // o script fica no fim do <body>, então o HTML já existe
})();
