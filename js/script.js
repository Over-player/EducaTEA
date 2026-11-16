// ================= ARRASTAR E SOLTAR NO TOQUE (CELULAR/TABLET) =================
// Os jogos usam Drag and Drop nativo do HTML5 (dragstart/dragover/drop), que não
// existe em telas de toque. Este bloco "traduz" toque em eventos de arrastar,
// reaproveitando exatamente as mesmas funções de cada jogo (ondragstart/ondrop),
// então nenhum jogo precisa ser reescrito individualmente.
(function () {
    let elementoArrastado = null;
    let fantasma = null;
    let dataTransferFalso = null;
    let alvoAtual = null;
    let inicioX = 0, inicioY = 0;
    let arrastando = false;
    const LIMIAR_ARRASTE = 8; // px de tolerância antes de considerar "arrastando"

    function criarDataTransfer() {
        const dados = {};
        return {
            setData(tipo, valor) { dados[tipo] = valor; },
            getData(tipo) { return dados[tipo] !== undefined ? dados[tipo] : ''; },
            effectAllowed: 'move',
            dropEffect: 'move'
        };
    }

    function encontrarArrastavel(el) {
        let saltos = 0;
        while (el && el !== document.body && saltos < 8) {
            if (el.draggable === true) return el;
            el = el.parentElement;
            saltos++;
        }
        return null;
    }

    function encontrarAlvoSolto(el) {
        let saltos = 0;
        while (el && el !== document.body && saltos < 8) {
            if (typeof el.ondrop === 'function') return el;
            el = el.parentElement;
            saltos++;
        }
        return null;
    }

    function elementoSobPonto(x, y) {
        if (fantasma) fantasma.style.display = 'none';
        const el = document.elementFromPoint(x, y);
        if (fantasma) fantasma.style.display = '';
        return el;
    }

    function criarFantasma(origem, toque) {
        const rect = origem.getBoundingClientRect();
        const clone = origem.cloneNode(true);
        clone.classList.add('touch-drag-ghost');
        clone.style.position = 'fixed';
        clone.style.left = (toque.clientX - rect.width / 2) + 'px';
        clone.style.top = (toque.clientY - rect.height / 2) + 'px';
        clone.style.width = rect.width + 'px';
        clone.style.height = rect.height + 'px';
        clone.style.margin = '0';
        clone.style.pointerEvents = 'none';
        clone.style.zIndex = '99999';
        clone.style.opacity = '0.9';
        clone.style.transform = 'scale(1.08)';
        clone.style.transition = 'none';
        document.body.appendChild(clone);
        return clone;
    }

    function onTouchStart(e) {
        if (e.touches.length > 1) return;
        const alvo = encontrarArrastavel(e.target);
        if (!alvo) return;
        elementoArrastado = alvo;
        arrastando = false;
        const toque = e.touches[0];
        inicioX = toque.clientX;
        inicioY = toque.clientY;
    }

    function onTouchMove(e) {
        if (!elementoArrastado) return;
        const toque = e.touches[0];

        if (!arrastando) {
            const dx = Math.abs(toque.clientX - inicioX);
            const dy = Math.abs(toque.clientY - inicioY);
            if (dx < LIMIAR_ARRASTE && dy < LIMIAR_ARRASTE) return;
            arrastando = true;
            dataTransferFalso = criarDataTransfer();
            fantasma = criarFantasma(elementoArrastado, toque);
            elementoArrastado.classList.add('touch-dragging');
            const eventoFalso = {
                target: elementoArrastado,
                currentTarget: elementoArrastado,
                dataTransfer: dataTransferFalso,
                preventDefault() {},
                stopPropagation() {}
            };
            if (typeof elementoArrastado.ondragstart === 'function') {
                elementoArrastado.ondragstart.call(elementoArrastado, eventoFalso);
            }
        }

        if (arrastando) {
            e.preventDefault();
            if (fantasma) {
                fantasma.style.left = (toque.clientX - fantasma.offsetWidth / 2) + 'px';
                fantasma.style.top = (toque.clientY - fantasma.offsetHeight / 2) + 'px';
            }
            const elSobDedo = elementoSobPonto(toque.clientX, toque.clientY);
            const alvoSolto = encontrarAlvoSolto(elSobDedo);

            if (alvoSolto !== alvoAtual) {
                if (alvoAtual) alvoAtual.classList.remove('touch-drop-hover');
                if (alvoSolto) alvoSolto.classList.add('touch-drop-hover');
                alvoAtual = alvoSolto;
            }
            if (alvoSolto && typeof alvoSolto.ondragover === 'function') {
                alvoSolto.ondragover.call(alvoSolto, { target: alvoSolto, preventDefault() {} });
            }
        }
    }

    function onTouchEnd(e) {
        if (!elementoArrastado) return;
        if (arrastando) {
            const toque = e.changedTouches[0];
            const elSobDedo = elementoSobPonto(toque.clientX, toque.clientY);
            const alvoSolto = encontrarAlvoSolto(elSobDedo);
            if (alvoSolto && typeof alvoSolto.ondrop === 'function') {
                const eventoFalso = {
                    target: alvoSolto,
                    currentTarget: alvoSolto,
                    dataTransfer: dataTransferFalso,
                    preventDefault() {},
                    stopPropagation() {}
                };
                alvoSolto.ondrop.call(alvoSolto, eventoFalso);
            }
            if (alvoAtual) alvoAtual.classList.remove('touch-drop-hover');
            elementoArrastado.classList.remove('touch-dragging');
            if (fantasma && fantasma.parentNode) fantasma.parentNode.removeChild(fantasma);
        }
        elementoArrastado = null;
        fantasma = null;
        dataTransferFalso = null;
        alvoAtual = null;
        arrastando = false;
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true });
    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
})();

// ================= MENU LATERAL (GAVETA NO CELULAR/TABLET) =================
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const botao = document.getElementById('menu-toggle');
    if (!sidebar) return;
    const abrir = !sidebar.classList.contains('open');
    sidebar.classList.toggle('open', abrir);
    if (overlay) overlay.classList.toggle('active', abrir);
    if (botao) {
        botao.classList.toggle('active', abrir);
        botao.setAttribute('aria-expanded', abrir ? 'true' : 'false');
    }
    document.body.classList.toggle('sidebar-open-lock', abrir);
}

function closeSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const botao = document.getElementById('menu-toggle');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
    if (botao) {
        botao.classList.remove('active');
        botao.setAttribute('aria-expanded', 'false');
    }
    document.body.classList.remove('sidebar-open-lock');
}

// ================= VARIÁVEIS DE ESTADO =================
let estadoAtual = { 
    palavra: "", 
    palavrasCaca: [], 
    palavrasExibicao: [], 
    silabasWords: [], 
    jogoCacaAtual: null, 
    nivelAtual: 1, 
    pontuacao: 0,
    pontuacaoTotal: 0,
    // Histórico de perguntas respondidas por jogo
    historicoPerguntas: {
        "Soma Criativa": [],
        "Subtração Divertida": [],
        "Contagem": [],
        "Qual é o Maior?": [],
        "Sequência": [],
        "Formas Geométricas": [],
        "Relógio Digital": [],
        "Pares e Ímpares": [],
        "Ciclo da Água": [],
        "Animais e Habitats": [],
        "Corpo Humano": [],
        "Reciclagem": [],
        "Sistema Solar": [],
        "Estados da Matéria": [],
        "Plantas": [],
        "Sentidos": [],
        "Ditado Visual": [],
        "Rima Maluca": [],
        "Qual é a Letra?": [],
        "Palavra Oculta": [],
        "Monte a Palavra": [],
        "Sílabas Mágicas": [],
        "Memória de Palavras": [],
        "Sombras Mágicas": [],
        "Classificação de Cores": [],
        "Contagem de Objetos": [],
        "Emoções": [],
        "Minha Rotina": [],
        "Cuidado com o Ambiente": []
    }
};
let mathRespostaCorreta = null, mathOpcaoSelecionada = null;
let cienciaRespostaCorreta = null, cienciaOpcaoSelecionada = null;

// ================= SISTEMA DE PROGRESSO =================
const SISTEMA_PROGRESSO = {
    PONTOS_POR_NIVEL: 100,
    PONTOS: {
        ACERTO_SIMPLES: 10,
        ACERTO_MEDIO: 15,
        ACERTO_DIFICIL: 20,
        BONUS_COMPLETO: 50,
        BONUS_NIVEL: 30
    },
    MULTIPLICADOR_NIVEL: 0.1,
    JOGOS: {
        "Monte a Palavra": { base: 15, completo: 40 },
        "Caça-Palavras": { base: 15, completo: 50 },
        "Sílabas Mágicas": { base: 15, completo: 35 },
        "Ditado Visual": { base: 10, completo: 30 },
        "Rima Maluca": { base: 10, completo: 30 },
        "Qual é a Letra?": { base: 5, completo: 25 },
        "Memória de Palavras": { base: 15, completo: 40 },
        "Palavra Oculta": { base: 20, completo: 45 },
        "Sombras Mágicas": { base: 10, completo: 35 },
        "Soma Criativa": { base: 15, completo: 40 },
        "Subtração Divertida": { base: 15, completo: 40 },
        "Contagem": { base: 10, completo: 30 },
        "Qual é o Maior?": { base: 10, completo: 30 },
        "Sequência": { base: 15, completo: 35 },
        "Formas Geométricas": { base: 12, completo: 35 },
        "Relógio Digital": { base: 15, completo: 40 },
        "Pares e Ímpares": { base: 10, completo: 30 },
        "Classificação de Cores": { base: 10, completo: 35 },
        "Contagem de Objetos": { base: 10, completo: 30 },
        "Ciclo da Água": { base: 15, completo: 40 },
        "Animais e Habitats": { base: 12, completo: 35 },
        "Corpo Humano": { base: 15, completo: 40 },
        "Reciclagem": { base: 12, completo: 35 },
        "Sistema Solar": { base: 15, completo: 40 },
        "Estados da Matéria": { base: 15, completo: 40 },
        "Plantas": { base: 12, completo: 35 },
        "Sentidos": { base: 12, completo: 35 },
        "Emoções": { base: 10, completo: 30 },
        "Minha Rotina": { base: 15, completo: 40 },
        "Cuidado com o Ambiente": { base: 10, completo: 30 }
    }
};

// ================= FUNÇÃO PARA NÃO REPETIR PERGUNTAS =================
function getProximaPergunta(jogoNome, listaPerguntas) {
    // Inicializa o histórico se não existir
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    
    // Se já respondeu todas as perguntas, reseta o histórico
    if (historico.length >= listaPerguntas.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        mostrarMensagem("🎉 Parabéns! Você respondeu todas as perguntas! Vamos começar de novo! 🎉", true);
        return listaPerguntas[Math.floor(Math.random() * listaPerguntas.length)];
    }
    
    // Filtra perguntas que ainda não foram respondidas
    const perguntasNaoRespondidas = listaPerguntas.filter((_, index) => !historico.includes(index));
    
    // Escolhe uma pergunta aleatória das não respondidas
    const novaIndex = Math.floor(Math.random() * perguntasNaoRespondidas.length);
    const perguntaEscolhida = perguntasNaoRespondidas[novaIndex];
    const indexOriginal = listaPerguntas.findIndex(p => p === perguntaEscolhida);
    
    // Adiciona ao histórico
    historico.push(indexOriginal);
    
    return perguntaEscolhida;
}

// ================= FUNÇÕES DE PROGRESSO =================
function atualizarProgresso(pontosGanhos = null) {
    if (pontosGanhos !== null && pontosGanhos > 0) {
        estadoAtual.pontuacaoTotal = estadoAtual.pontuacaoTotal || 0;
        estadoAtual.pontuacaoTotal += pontosGanhos;
    }
    
    if (estadoAtual.pontuacaoTotal === undefined || estadoAtual.pontuacaoTotal === null) {
        estadoAtual.pontuacaoTotal = 0;
    }
    
    const pontuacaoAtual = estadoAtual.pontuacaoTotal;
    const pontosPorNivel = SISTEMA_PROGRESSO.PONTOS_POR_NIVEL;
    const nivelAtual = estadoAtual.nivelAtual || 1;
    const progressoNoNivel = pontuacaoAtual % pontosPorNivel;
    const porcentagem = (progressoNoNivel / pontosPorNivel) * 100;
    
    const fill = document.getElementById('progresso-fill-principal');
    const texto = document.getElementById('progresso-texto-principal');
    const nivelSpan = document.getElementById('nivel-atual');
    const pontosSpan = document.getElementById('pontuacao-total');
    
    if (fill) fill.style.width = porcentagem + '%';
    if (texto) texto.innerText = Math.floor(porcentagem) + '%';
    if (nivelSpan) nivelSpan.innerText = nivelAtual;
    if (pontosSpan) pontosSpan.innerText = pontuacaoAtual;
    
    const novoNivel = Math.floor(pontuacaoAtual / pontosPorNivel) + 1;
    if (novoNivel > nivelAtual) {
        estadoAtual.nivelAtual = novoNivel;
        const bonusNivel = SISTEMA_PROGRESSO.PONTOS.BONUS_NIVEL;
        estadoAtual.pontuacaoTotal += bonusNivel;
        atualizarProgresso();
        if (typeof mostrarMensagem === 'function') {
            mostrarMensagem(`🌟 Nível ${novoNivel}! +${bonusNivel} pts!`, true);
        }
        return true;
    }
    return false;
}

function registrarAcerto(jogoNome, tipoAcerto = 'ACERTO_SIMPLES', bonusAdicional = 0, fator = 1) {
    const configJogo = SISTEMA_PROGRESSO.JOGOS[jogoNome] || { base: 10, completo: 30 };
    let pontosBase = SISTEMA_PROGRESSO.PONTOS[tipoAcerto] || 10;
    const nivel = estadoAtual.nivelAtual || 1;
    const multiplicador = 1 + ((nivel - 1) * 0.1);

    // Sequência de acertos (streak) e bônus de combo
    estadoAtual.streakAtual = (estadoAtual.streakAtual || 0) + 1;
    estadoAtual.melhorStreak = Math.max(estadoAtual.melhorStreak || 0, estadoAtual.streakAtual);
    estadoAtual.totalAcertos = (estadoAtual.totalAcertos || 0) + 1;
    const bonusCombo = Math.min((estadoAtual.streakAtual - 1) * 2, 20);

    // Estatísticas por jogo
    estadoAtual.estatisticasJogos = estadoAtual.estatisticasJogos || {};
    if (!estadoAtual.estatisticasJogos[jogoNome]) estadoAtual.estatisticasJogos[jogoNome] = { acertos: 0, erros: 0 };
    estadoAtual.estatisticasJogos[jogoNome].acertos++;

    let pontosGanhos = Math.max(1, Math.floor((configJogo.base + pontosBase) * multiplicador * fator)) + bonusAdicional + bonusCombo;

    estadoAtual.pontuacaoTotal = (estadoAtual.pontuacaoTotal || 0) + pontosGanhos;
    atualizarProgresso();
    atualizarStreakVisual();
    salvarProgresso();
    checarConquistas();

    let textoMsg = `✅ +${pontosGanhos} pontos!`;
    if (bonusCombo > 0) textoMsg += ` (combo +${bonusCombo})`;
    if (estadoAtual.streakAtual >= 3) textoMsg += ` 🔥 Sequência: ${estadoAtual.streakAtual}`;
    if (typeof mostrarMensagem === 'function') {
        mostrarMensagem(textoMsg, true);
    }
    return pontosGanhos;
}

function registrarErro(jogoNome) {
    estadoAtual.estatisticasJogos = estadoAtual.estatisticasJogos || {};
    if (!estadoAtual.estatisticasJogos[jogoNome]) estadoAtual.estatisticasJogos[jogoNome] = { acertos: 0, erros: 0 };
    estadoAtual.estatisticasJogos[jogoNome].erros++;
    quebrarStreak();
    salvarProgresso();
}

// O botão "Limpar Progresso" usa esta função (antes ela não existia)
function limparProgressoSalvo() { return resetarProgresso(); }

function salvarProgresso() {
    const progresso = {
        nivel: estadoAtual.nivelAtual || 1,
        pontuacaoTotal: estadoAtual.pontuacaoTotal || 0,
        historicoPerguntas: estadoAtual.historicoPerguntas,
        melhorStreak: estadoAtual.melhorStreak || 0,
        totalAcertos: estadoAtual.totalAcertos || 0,
        conquistas: estadoAtual.conquistas || [],
        estatisticasJogos: estadoAtual.estatisticasJogos || {},
        extras: estadoAtual.extras || {},
        data: new Date().toISOString()
    };
    localStorage.setItem('progresso_educa_tea', JSON.stringify(progresso));
}

function carregarProgresso() {
    const salvo = localStorage.getItem('progresso_educa_tea');
    if (salvo) {
        try {
            const progresso = JSON.parse(salvo);
            estadoAtual.nivelAtual = (progresso.nivel && progresso.nivel >= 1) ? progresso.nivel : 1;
            estadoAtual.pontuacaoTotal = (progresso.pontuacaoTotal && progresso.pontuacaoTotal >= 0) ? progresso.pontuacaoTotal : 0;
            if (progresso.historicoPerguntas) {
                estadoAtual.historicoPerguntas = progresso.historicoPerguntas;
            }
            estadoAtual.melhorStreak = progresso.melhorStreak || 0;
            estadoAtual.totalAcertos = progresso.totalAcertos || 0;
            estadoAtual.conquistas = progresso.conquistas || [];
            estadoAtual.estatisticasJogos = progresso.estatisticasJogos || {};
            estadoAtual.extras = progresso.extras || {};
            estadoAtual.streakAtual = 0;
            atualizarProgresso();
            atualizarStreakVisual();
            return true;
        } catch(e) {
            console.log("Erro ao carregar progresso");
            estadoAtual.nivelAtual = 1;
            estadoAtual.pontuacaoTotal = 0;
            atualizarProgresso();
        }
    } else {
        estadoAtual.nivelAtual = 1;
        estadoAtual.pontuacaoTotal = 0;
        atualizarProgresso();
    }
    return false;
}

function resetarProgresso() {
    if (confirm("⚠️ Tem certeza que deseja resetar todo seu progresso?")) {
        estadoAtual.nivelAtual = 1;
        estadoAtual.pontuacaoTotal = 0;
        estadoAtual.historicoPerguntas = {};
        estadoAtual.streakAtual = 0;
        estadoAtual.melhorStreak = 0;
        estadoAtual.totalAcertos = 0;
        estadoAtual.conquistas = [];
        estadoAtual.estatisticasJogos = {};
        estadoAtual.extras = {};
        localStorage.removeItem('progresso_educa_tea');
        atualizarProgresso();
        atualizarStreakVisual();
        if (typeof mostrarMensagem === 'function') {
            mostrarMensagem("🔄 Progresso resetado! Você voltou ao Nível 1.", true);
        }
        return true;
    }
    return false;
}

// ================= BANCO DE DADOS COM MAIS DE 20 PERGUNTAS POR JOGO =================
let bancoDePalavras = [];
let bancoDitadoVisual = [];
let bancoRimas = [];
let bancoPalavraOculta = [];
let bancoMatematica = {};
let bancoCiencias = {};
let dadosCarregados = false;

const BANCO_LOCAL = {
    palavras: ["CASA", "BOLA", "GATO", "CACHORRO", "SOL", "LUA", "ESTRELA", "FLOR", "ÁRVORE", "CARRO", "AVIÃO", "ESCOLA", "PROFESSOR", "ALUNO", "LIVRO", "BICICLETA", "BORBOLETA", "COMPUTADOR", "TELEVISÃO", "CHOCOLATE", "ELEFANTE", "GIRAFA", "MACACO", "PEIXE", "PASSARO", "TARTARUGA", "COELHO", "CANGURU", "POLVO", "BALEIA"],
    
    ditadoVisual: [
        { imagem: "🐶", palavra: "CACHORRO" }, { imagem: "🐱", palavra: "GATO" }, { imagem: "🏠", palavra: "CASA" },
        { imagem: "⚽", palavra: "BOLA" }, { imagem: "☀️", palavra: "SOL" }, { imagem: "🌙", palavra: "LUA" },
        { imagem: "⭐", palavra: "ESTRELA" }, { imagem: "🌸", palavra: "FLOR" }, { imagem: "🚗", palavra: "CARRO" },
        { imagem: "✈️", palavra: "AVIÃO" }, { imagem: "📚", palavra: "LIVRO" }, { imagem: "🍎", palavra: "MAÇÃ" },
        { imagem: "🍌", palavra: "BANANA" }, { imagem: "🍕", palavra: "PIZZA" }, { imagem: "🐟", palavra: "PEIXE" },
        { imagem: "🐘", palavra: "ELEFANTE" }, { imagem: "🦒", palavra: "GIRAFA" }, { imagem: "🐒", palavra: "MACACO" },
        { imagem: "🚲", palavra: "BICICLETA" }, { imagem: "🏫", palavra: "ESCOLA" }, { imagem: "👨‍🏫", palavra: "PROFESSOR" },
        { imagem: "📝", palavra: "CADERNO" }, { imagem: "✏️", palavra: "LAPIS" }, { imagem: "🎂", palavra: "BOLO" },
        { imagem: "🍦", palavra: "SORVETE" }, { imagem: "🏀", palavra: "BASQUETE" }, { imagem: "🎸", palavra: "VIOLAO" },
        { imagem: "🐧", palavra: "PINGUIM" }, { imagem: "🦁", palavra: "LEAO" }, { imagem: "🐨", palavra: "COALA" },
        { imagem: "🦋", palavra: "BORBOLETA" }, { imagem: "🐝", palavra: "ABELHA" }, { imagem: "🐙", palavra: "POLVO" }
    ],
    
    rimas: [
        { alvo: "GATO", certa: "RATO", erradas: ["CASA", "BOLA", "PATO", "MALHO"] },
        { alvo: "CASA", certa: "ASA", erradas: ["GATO", "MESA", "PESA", "FRESA"] },
        { alvo: "BOLA", certa: "ESCOLA", erradas: ["CASA", "GATO", "MOLA", "AMOLA"] },
        { alvo: "SOL", certa: "COL", erradas: ["LUA", "MAR", "MEL", "FOL"] },
        { alvo: "FLOR", certa: "AMOR", erradas: ["COR", "DOR", "MOR", "LOR"] },
        { alvo: "PÃO", certa: "MÃO", erradas: ["PÉ", "BOLO", "CÃO", "CHÃO"] },
        { alvo: "PATO", certa: "MATO", erradas: ["LUA", "MESA", "RATO", "TRATO"] },
        { alvo: "MESA", certa: "PRESA", erradas: ["CASA", "BOLA", "LESA", "RESA"] },
        { alvo: "LUA", certa: "JUA", erradas: ["SOL", "MAR", "RUA", "FUÁ"] },
        { alvo: "MAR", certa: "TAR", erradas: ["SOL", "LUA", "BAR", "CAR"] },
        { alvo: "COR", certa: "DOR", erradas: ["AMOR", "FLOR", "MOR", "LOR"] },
        { alvo: "PÉ", certa: "MÉ", erradas: ["PÃO", "MÃO", "CHÁ", "RÉ"] },
        { alvo: "RUA", certa: "LUA", erradas: ["SOL", "MAR", "FUÁ", "TUA"] },
        { alvo: "BAR", certa: "MAR", erradas: ["SOL", "LUA", "CAR", "DAR"] },
        { alvo: "MOR", certa: "COR", erradas: ["DOR", "AMOR", "FLOR", "TOR"] },
        { alvo: "CÃO", certa: "PÃO", erradas: ["MÃO", "CASA", "BOLA", "CHÃO"] },
        { alvo: "MEL", certa: "PEL", erradas: ["SOL", "LUA", "MOR", "BEL"] },
        { alvo: "CHÁ", certa: "MÁ", erradas: ["PÉ", "MÉ", "SOL", "RÁ"] },
        { alvo: "FRIO", certa: "RIO", erradas: ["CALOR", "SOL", "LUA", "TIO"] },
        { alvo: "VENTO", certa: "DENTRO", erradas: ["FORA", "SOL", "LUA", "CENTRO"] },
        { alvo: "AMIGO", certa: "TIGO", erradas: ["CASA", "BOLA", "FRIO", "PERIGO"] },
        { alvo: "FELIZ", certa: "RIZ", erradas: ["TRISTE", "BOM", "RUIM", "APRENDIZ"] }
    ],
    
    palavraOculta: [
        { palavra: "CACHORRO", dica: "Animal de estimação que late" },
        { palavra: "BORBOLETA", dica: "Inseto colorido que voa" },
        { palavra: "COMPUTADOR", dica: "Máquina usada para estudar e jogar" },
        { palavra: "ESCOLA", dica: "Lugar onde se aprende" },
        { palavra: "GIRAFA", dica: "Tem um pescoço muito comprido" },
        { palavra: "BANANA", dica: "Fruta amarela que o macaco adora" },
        { palavra: "ELEFANTE", dica: "Animal grande com tromba" },
        { palavra: "PROFESSOR", dica: "Quem ensina na escola" },
        { palavra: "BICICLETA", dica: "Veículo de duas rodas" },
        { palavra: "CHOCOLATE", dica: "Doce feito de cacau" },
        { palavra: "TELEVISÃO", dica: "Aparelho para assistir desenhos" },
        { palavra: "MICROONDAS", dica: "Aparelho para esquentar comida" },
        { palavra: "HELICOPTERO", dica: "Veículo que voa com hélices" },
        { palavra: "MELANCIA", dica: "Fruta grande, verde por fora e vermelha por dentro" },
        { palavra: "ARQUITETO", dica: "Profissional que projeta casas" },
        { palavra: "DENTISTA", dica: "Cuida dos dentes" },
        { palavra: "VETERINARIO", dica: "Cuida dos animais" },
        { palavra: "BOMBEIRO", dica: "Apaga incêndios" },
        { palavra: "ASTRONAUTA", dica: "Viaja para o espaço" },
        { palavra: "MAGICO", dica: "Faz truques e ilusionismo" },
        { palavra: "PIRATA", dica: "Navega em busca de tesouros" },
        { palavra: "PRINCESA", dica: "Mora em um castelo" }
    ],
    
    matematica: {
        "Soma Criativa": [
            { pergunta: "Quanto é 2 + 2?", visual: "🍎🍎 + 🍎🍎", resposta: 4 },
            { pergunta: "Quanto é 3 + 1?", visual: "⭐ ⭐ ⭐ + ⭐", resposta: 4 },
            { pergunta: "Quanto é 5 + 2?", visual: "🎈🎈🎈🎈🎈 + 🎈🎈", resposta: 7 },
            { pergunta: "Quanto é 1 + 4?", visual: "🐶 + 🐶🐶🐶🐶", resposta: 5 },
            { pergunta: "Quanto é 3 + 3?", visual: "🍎🍎🍎 + 🍎🍎🍎", resposta: 6 },
            { pergunta: "Quanto é 4 + 4?", visual: "⭐⭐⭐⭐ + ⭐⭐⭐⭐", resposta: 8 },
            { pergunta: "Quanto é 2 + 5?", visual: "🐱🐱 + 🐱🐱🐱🐱🐱", resposta: 7 },
            { pergunta: "Quanto é 0 + 3?", visual: " + 🍎🍎🍎", resposta: 3 },
            { pergunta: "Quanto é 6 + 1?", visual: "🎈🎈🎈🎈🎈🎈 + 🎈", resposta: 7 },
            { pergunta: "Quanto é 4 + 2?", visual: "⭐⭐⭐⭐ + ⭐⭐", resposta: 6 },
            { pergunta: "Quanto é 3 + 4?", visual: "🐶🐶🐶 + 🐶🐶🐶🐶", resposta: 7 },
            { pergunta: "Quanto é 5 + 5?", visual: "🍎🍎🍎🍎🍎 + 🍎🍎🍎🍎🍎", resposta: 10 },
            { pergunta: "Quanto é 7 + 1?", visual: "⭐⭐⭐⭐⭐⭐⭐ + ⭐", resposta: 8 },
            { pergunta: "Quanto é 2 + 8?", visual: "🎈🎈 + 🎈🎈🎈🎈🎈🎈🎈🎈", resposta: 10 },
            { pergunta: "Quanto é 4 + 3?", visual: "🐱🐱🐱🐱 + 🐱🐱🐱", resposta: 7 },
            { pergunta: "Quanto é 6 + 2?", visual: "🍎🍎🍎🍎🍎🍎 + 🍎🍎", resposta: 8 },
            { pergunta: "Quanto é 1 + 9?", visual: "⭐ + ⭐⭐⭐⭐⭐⭐⭐⭐⭐", resposta: 10 },
            { pergunta: "Quanto é 5 + 3?", visual: "🎈🎈🎈🎈🎈 + 🎈🎈🎈", resposta: 8 },
            { pergunta: "Quanto é 2 + 4?", visual: "🐶🐶 + 🐶🐶🐶🐶", resposta: 6 },
            { pergunta: "Quanto é 7 + 2?", visual: "⭐⭐⭐⭐⭐⭐⭐ + ⭐⭐", resposta: 9 },
            { pergunta: "Quanto é 3 + 5?", visual: "🍎🍎🍎 + 🍎🍎🍎🍎🍎", resposta: 8 },
            { pergunta: "Quanto é 4 + 6?", visual: "🐱🐱🐱🐱 + 🐱🐱🐱🐱🐱🐱", resposta: 10 }
        ],
        "Subtração Divertida": [
            { pergunta: "Quanto é 5 - 2?", visual: "🍎🍎🍎🍎🍎 (🍎🍎)", resposta: 3 },
            { pergunta: "Quanto é 4 - 1?", visual: "⭐⭐⭐⭐ (⭐)", resposta: 3 },
            { pergunta: "Quanto é 6 - 3?", visual: "🎈🎈🎈🎈🎈🎈 (🎈🎈🎈)", resposta: 3 },
            { pergunta: "Quanto é 10 - 4?", visual: "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎 (🍎🍎🍎🍎)", resposta: 6 },
            { pergunta: "Quanto é 8 - 2?", visual: "⭐⭐⭐⭐⭐⭐⭐⭐ (⭐⭐)", resposta: 6 },
            { pergunta: "Quanto é 7 - 5?", visual: "🐶🐶🐶🐶🐶🐶🐶 (🐶🐶🐶🐶🐶)", resposta: 2 },
            { pergunta: "Quanto é 9 - 3?", visual: "🎈🎈🎈🎈🎈🎈🎈🎈🎈 (🎈🎈🎈)", resposta: 6 },
            { pergunta: "Quanto é 5 - 1?", visual: "🍎🍎🍎🍎🍎 (🍎)", resposta: 4 },
            { pergunta: "Quanto é 6 - 2?", visual: "⭐⭐⭐⭐⭐⭐ (⭐⭐)", resposta: 4 },
            { pergunta: "Quanto é 10 - 7?", visual: "🐶🐶🐶🐶🐶🐶🐶🐶🐶🐶 (🐶🐶🐶🐶🐶🐶🐶)", resposta: 3 },
            { pergunta: "Quanto é 4 - 3?", visual: "🎈🎈🎈🎈 (🎈🎈🎈)", resposta: 1 },
            { pergunta: "Quanto é 9 - 5?", visual: "🍎🍎🍎🍎🍎🍎🍎🍎🍎 (🍎🍎🍎🍎🍎)", resposta: 4 },
            { pergunta: "Quanto é 7 - 3?", visual: "⭐⭐⭐⭐⭐⭐⭐ (⭐⭐⭐)", resposta: 4 },
            { pergunta: "Quanto é 8 - 4?", visual: "🐶🐶🐶🐶🐶🐶🐶🐶 (🐶🐶🐶🐶)", resposta: 4 },
            { pergunta: "Quanto é 6 - 4?", visual: "🎈🎈🎈🎈🎈🎈 (🎈🎈🎈🎈)", resposta: 2 },
            { pergunta: "Quanto é 10 - 2?", visual: "🍎🍎🍎🍎🍎🍎🍎🍎🍎🍎 (🍎🍎)", resposta: 8 },
            { pergunta: "Quanto é 5 - 3?", visual: "⭐⭐⭐⭐⭐ (⭐⭐⭐)", resposta: 2 },
            { pergunta: "Quanto é 9 - 7?", visual: "🐶🐶🐶🐶🐶🐶🐶🐶🐶 (🐶🐶🐶🐶🐶🐶🐶)", resposta: 2 },
            { pergunta: "Quanto é 8 - 6?", visual: "🎈🎈🎈🎈🎈🎈🎈🎈 (🎈🎈🎈🎈🎈🎈)", resposta: 2 },
            { pergunta: "Quanto é 7 - 4?", visual: "🍎🍎🍎🍎🍎🍎🍎 (🍎🍎🍎🍎)", resposta: 3 },
            { pergunta: "Quanto é 10 - 5?", visual: "⭐⭐⭐⭐⭐⭐⭐⭐⭐⭐ (⭐⭐⭐⭐⭐)", resposta: 5 },
            { pergunta: "Quanto é 6 - 1?", visual: "🐶🐶🐶🐶🐶🐶 (🐶)", resposta: 5 }
        ],
        "Contagem": [
            { pergunta: "Quantos dedos tem uma mão?", visual: "✋", resposta: 5, opcoes: ["3", "4", "5", "6"] },
            { pergunta: "Quantas patas tem um cachorro?", visual: "🐕", resposta: 4, opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Quantos olhos você tem?", visual: "👀", resposta: 2, opcoes: ["1", "2", "3", "4"] },
            { pergunta: "Quantas rodas tem um carro?", visual: "🚗", resposta: 4, opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Quantas cores tem o arco-íris?", visual: "🌈", resposta: 7, opcoes: ["5", "6", "7", "8"] },
            { pergunta: "Quantos meses tem um ano?", visual: "📅", resposta: 12, opcoes: ["10", "11", "12", "13"] },
            { pergunta: "Quantos dias tem uma semana?", visual: "📆", resposta: 7, opcoes: ["5", "6", "7", "8"] },
            { pergunta: "Quantas pernas tem uma cadeira?", visual: "🪑", resposta: 4, opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Quantas letras tem a palavra SOL?", visual: "☀️", resposta: 3, opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Quantas estrelas tem no exemplo?", visual: "⭐ ⭐ ⭐ ⭐", resposta: 4, opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Quantas patas tem uma galinha?", visual: "🐔", resposta: 2, opcoes: ["1", "2", "3", "4"] },
            { pergunta: "Quantos lados tem um triângulo?", visual: "🔺", resposta: 3, opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Quantos dedos tem duas mãos?", visual: "✋ ✋", resposta: 10, opcoes: ["8", "9", "10", "11"] },
            { pergunta: "Quantas horas tem um dia?", visual: "⏰", resposta: 24, opcoes: ["12", "24", "36", "48"] },
            { pergunta: "Quantos minutos tem uma hora?", visual: "⏱️", resposta: 60, opcoes: ["30", "45", "60", "90"] },
            { pergunta: "Quantas asas tem um pássaro?", visual: "🐦", resposta: 2, opcoes: ["1", "2", "3", "4"] },
            { pergunta: "Quantas rodas tem uma bicicleta?", visual: "🚲", resposta: 2, opcoes: ["1", "2", "3", "4"] },
            { pergunta: "Quantos pés tem uma mesa?", visual: "🪑", resposta: 4, opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Quantos furos tem uma tesoura?", visual: "✂️", resposta: 2, opcoes: ["1", "2", "3", "4"] },
            { pergunta: "Quantos lados tem um quadrado?", visual: "⬛", resposta: 4, opcoes: ["3", "4", "5", "6"] },
            { pergunta: "Quantas pontas tem uma estrela?", visual: "⭐", resposta: 5, opcoes: ["4", "5", "6", "7"] },
            { pergunta: "Quantos braços tem um ser humano?", visual: "🧑", resposta: 2, opcoes: ["1", "2", "3", "4"] }
        ],
        "Qual é o Maior?": [
            { pergunta: "Qual número é maior?", visual: "5 ou 7?", resposta: "7", opcoes: ["5", "7"] },
            { pergunta: "Qual número é maior?", visual: "10 ou 3?", resposta: "10", opcoes: ["3", "10"] },
            { pergunta: "Qual número é maior?", visual: "8 ou 12?", resposta: "12", opcoes: ["8", "12"] },
            { pergunta: "Qual número é maior?", visual: "15 ou 9?", resposta: "15", opcoes: ["9", "15"] },
            { pergunta: "Qual número é maior?", visual: "20 ou 18?", resposta: "20", opcoes: ["18", "20"] },
            { pergunta: "Qual número é maior?", visual: "3 ou 6?", resposta: "6", opcoes: ["3", "6"] },
            { pergunta: "Qual número é maior?", visual: "100 ou 50?", resposta: "100", opcoes: ["50", "100"] },
            { pergunta: "Qual número é maior?", visual: "25 ou 30?", resposta: "30", opcoes: ["25", "30"] },
            { pergunta: "Qual número é maior?", visual: "7 ou 9?", resposta: "9", opcoes: ["7", "9"] },
            { pergunta: "Qual número é maior?", visual: "40 ou 35?", resposta: "40", opcoes: ["35", "40"] },
            { pergunta: "Qual número é maior?", visual: "2 ou 8?", resposta: "8", opcoes: ["2", "8"] },
            { pergunta: "Qual número é maior?", visual: "13 ou 11?", resposta: "13", opcoes: ["11", "13"] },
            { pergunta: "Qual número é maior?", visual: "22 ou 18?", resposta: "22", opcoes: ["18", "22"] },
            { pergunta: "Qual número é maior?", visual: "45 ou 54?", resposta: "54", opcoes: ["45", "54"] },
            { pergunta: "Qual número é maior?", visual: "33 ou 29?", resposta: "33", opcoes: ["29", "33"] },
            { pergunta: "Qual número é maior?", visual: "99 ou 100?", resposta: "100", opcoes: ["99", "100"] },
            { pergunta: "Qual número é maior?", visual: "17 ou 71?", resposta: "71", opcoes: ["17", "71"] },
            { pergunta: "Qual número é maior?", visual: "56 ou 65?", resposta: "65", opcoes: ["56", "65"] },
            { pergunta: "Qual número é maior?", visual: "82 ou 28?", resposta: "82", opcoes: ["28", "82"] },
            { pergunta: "Qual número é maior?", visual: "44 ou 44?", resposta: "44", opcoes: ["44", "44"] },
            { pergunta: "Qual número é maior?", visual: "93 ou 39?", resposta: "93", opcoes: ["39", "93"] },
            { pergunta: "Qual número é maior?", visual: "77 ou 70?", resposta: "77", opcoes: ["70", "77"] }
        ],
        "Sequência": [
            { pergunta: "Complete: 2, 4, 6, ___", visual: "2, 4, 6, ?", resposta: 8, opcoes: ["7", "8", "9", "10"] },
            { pergunta: "Complete: 1, 3, 5, ___", visual: "1, 3, 5, ?", resposta: 7, opcoes: ["6", "7", "8", "9"] },
            { pergunta: "Complete: 10, 20, 30, ___", visual: "10, 20, 30, ?", resposta: 40, opcoes: ["35", "40", "45", "50"] },
            { pergunta: "Complete: 5, 10, 15, ___", visual: "5, 10, 15, ?", resposta: 20, opcoes: ["18", "19", "20", "21"] },
            { pergunta: "Complete: 1, 4, 7, ___", visual: "1, 4, 7, ?", resposta: 10, opcoes: ["8", "9", "10", "11"] },
            { pergunta: "Complete: 2, 5, 8, ___", visual: "2, 5, 8, ?", resposta: 11, opcoes: ["9", "10", "11", "12"] },
            { pergunta: "Complete: 3, 6, 9, ___", visual: "3, 6, 9, ?", resposta: 12, opcoes: ["10", "11", "12", "13"] },
            { pergunta: "Complete: 4, 8, 12, ___", visual: "4, 8, 12, ?", resposta: 16, opcoes: ["14", "15", "16", "17"] },
            { pergunta: "Complete: 1, 2, 4, 7, ___", visual: "1, 2, 4, 7, ?", resposta: 11, opcoes: ["10", "11", "12", "13"] },
            { pergunta: "Complete: 2, 4, 8, 16, ___", visual: "2, 4, 8, 16, ?", resposta: 32, opcoes: ["24", "28", "30", "32"] },
            { pergunta: "Complete: 1, 1, 2, 3, 5, ___", visual: "1, 1, 2, 3, 5, ?", resposta: 8, opcoes: ["6", "7", "8", "9"] },
            { pergunta: "Complete: 10, 9, 8, ___", visual: "10, 9, 8, ?", resposta: 7, opcoes: ["5", "6", "7", "8"] },
            { pergunta: "Complete: 3, 6, 12, 24, ___", visual: "3, 6, 12, 24, ?", resposta: 48, opcoes: ["36", "42", "48", "54"] },
            { pergunta: "Complete: 5, 7, 9, ___", visual: "5, 7, 9, ?", resposta: 11, opcoes: ["10", "11", "12", "13"] },
            { pergunta: "Complete: 11, 22, 33, ___", visual: "11, 22, 33, ?", resposta: 44, opcoes: ["40", "42", "44", "46"] },
            { pergunta: "Complete: 2, 6, 10, ___", visual: "2, 6, 10, ?", resposta: 14, opcoes: ["12", "13", "14", "15"] },
            { pergunta: "Complete: 1, 8, 27, 64, ___", visual: "1, 8, 27, 64, ?", resposta: 125, opcoes: ["100", "110", "120", "125"] },
            { pergunta: "Complete: 10, 7, 4, ___", visual: "10, 7, 4, ?", resposta: 1, opcoes: ["0", "1", "2", "3"] },
            { pergunta: "Complete: 2, 3, 5, 7, 11, ___", visual: "2, 3, 5, 7, 11, ?", resposta: 13, opcoes: ["12", "13", "14", "15"] },
            { pergunta: "Complete: 100, 90, 80, ___", visual: "100, 90, 80, ?", resposta: 70, opcoes: ["60", "65", "70", "75"] },
            { pergunta: "Complete: 1, 3, 9, 27, ___", visual: "1, 3, 9, 27, ?", resposta: 81, opcoes: ["54", "72", "81", "90"] },
            { pergunta: "Complete: 50, 45, 40, ___", visual: "50, 45, 40, ?", resposta: 35, opcoes: ["30", "33", "35", "38"] }
        ],
        "Formas Geométricas": [
            { pergunta: "Quantos lados tem um quadrado?", visual: "⬛", resposta: 4, opcoes: ["3", "4", "5", "6"] },
            { pergunta: "Quantos lados tem um triângulo?", visual: "🔺", resposta: 3, opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Quantos lados tem um círculo?", visual: "⚪", resposta: 0, opcoes: ["0", "1", "2", "3"] },
            { pergunta: "Quantos lados tem um retângulo?", visual: "📏", resposta: 4, opcoes: ["3", "4", "5", "6"] },
            { pergunta: "Quantos lados tem um pentágono?", visual: "⬟", resposta: 5, opcoes: ["4", "5", "6", "7"] },
            { pergunta: "Quantos lados tem um hexágono?", visual: "⬡", resposta: 6, opcoes: ["5", "6", "7", "8"] },
            { pergunta: "Quantos lados tem um octógono?", visual: "⭕", resposta: 8, opcoes: ["6", "7", "8", "9"] },
            { pergunta: "Qual forma tem 3 lados?", visual: "🔺", resposta: "triângulo", opcoes: ["quadrado", "triângulo", "círculo", "retângulo"] },
            { pergunta: "Qual forma tem 4 lados iguais?", visual: "⬛", resposta: "quadrado", opcoes: ["retângulo", "quadrado", "losango", "trapézio"] },
            { pergunta: "Qual forma é redonda?", visual: "⚪", resposta: "círculo", opcoes: ["quadrado", "triângulo", "círculo", "retângulo"] },
            { pergunta: "Qual forma parece um ovo?", visual: "🥚", resposta: "oval", opcoes: ["círculo", "oval", "triângulo", "quadrado"] },
            { pergunta: "Quantos lados tem um losango?", visual: "🔶", resposta: 4, opcoes: ["3", "4", "5", "6"] },
            { pergunta: "Qual forma tem 5 lados?", visual: "⬟", resposta: "pentágono", opcoes: ["quadrado", "triângulo", "pentágono", "hexágono"] },
            { pergunta: "Qual forma tem 6 lados?", visual: "⬡", resposta: "hexágono", opcoes: ["pentágono", "hexágono", "heptágono", "octógono"] },
            { pergunta: "Qual forma tem 8 lados?", visual: "🔴", resposta: "octógono", opcoes: ["hexágono", "heptágono", "octógono", "nonágono"] },
            { pergunta: "Qual forma é usada em placas de pare?", visual: "🛑", resposta: "octógono", opcoes: ["triângulo", "quadrado", "círculo", "octógono"] },
            { pergunta: "Qual forma tem 4 lados, sendo 2 pares iguais?", visual: "📺", resposta: "retângulo", opcoes: ["quadrado", "retângulo", "losango", "trapézio"] },
            { pergunta: "Qual forma tem 3 lados iguais?", visual: "🔺", resposta: "triângulo equilátero", opcoes: ["triângulo isósceles", "triângulo equilátero", "triângulo escaleno", "quadrado"] },
            { pergunta: "Qual forma é uma bola?", visual: "⚽", resposta: "esfera", opcoes: ["círculo", "esfera", "oval", "elipse"] },
            { pergunta: "Qual forma é uma caixa?", visual: "📦", resposta: "cubo", opcoes: ["quadrado", "cubo", "retângulo", "paralelepípedo"] },
            { pergunta: "Quantos lados tem um heptágono?", visual: "🔷", resposta: 7, opcoes: ["6", "7", "8", "9"] },
            { pergunta: "Qual forma tem 10 lados?", visual: "🔟", resposta: "decágono", opcoes: ["nonágono", "decágono", "hendecágono", "dodecágono"] }
        ],
        "Relógio Digital": [
            { pergunta: "Que horas são? 12:00", visual: "🕛", resposta: "12", opcoes: ["10", "11", "12", "1"] },
            { pergunta: "Que horas são? 3:00", visual: "🕒", resposta: "3", opcoes: ["2", "3", "4", "5"] },
            { pergunta: "Que horas são? 6:00", visual: "🕕", resposta: "6", opcoes: ["5", "6", "7", "8"] },
            { pergunta: "Que horas são? 9:00", visual: "🕘", resposta: "9", opcoes: ["8", "9", "10", "11"] },
            { pergunta: "Que horas são? 1:00", visual: "🕐", resposta: "1", opcoes: ["12", "1", "2", "3"] },
            { pergunta: "Que horas são? 4:00", visual: "🕓", resposta: "4", opcoes: ["3", "4", "5", "6"] },
            { pergunta: "Que horas são? 7:00", visual: "🕖", resposta: "7", opcoes: ["6", "7", "8", "9"] },
            { pergunta: "Que horas são? 10:00", visual: "🕙", resposta: "10", opcoes: ["9", "10", "11", "12"] },
            { pergunta: "Que horas são? 2:00", visual: "🕑", resposta: "2", opcoes: ["1", "2", "3", "4"] },
            { pergunta: "Que horas são? 8:00", visual: "🕗", resposta: "8", opcoes: ["7", "8", "9", "10"] },
            { pergunta: "Que horas são? 11:00", visual: "🕚", resposta: "11", opcoes: ["10", "11", "12", "1"] },
            { pergunta: "Que horas são? 5:00", visual: "🕔", resposta: "5", opcoes: ["4", "5", "6", "7"] },
            { pergunta: "Que horas são? 12:30", visual: "🕧", resposta: "12:30", opcoes: ["12:00", "12:15", "12:30", "12:45"] },
            { pergunta: "Que horas são? 3:15", visual: "🕞", resposta: "3:15", opcoes: ["3:00", "3:15", "3:30", "3:45"] },
            { pergunta: "Que horas são? 6:45", visual: "🕡", resposta: "6:45", opcoes: ["6:15", "6:30", "6:45", "7:00"] },
            { pergunta: "Que horas são? 9:20", visual: "🕤", resposta: "9:20", opcoes: ["9:00", "9:15", "9:20", "9:30"] },
            { pergunta: "Que horas são? 4:40", visual: "🕟", resposta: "4:40", opcoes: ["4:15", "4:30", "4:40", "4:45"] },
            { pergunta: "Que horas são? 7:50", visual: "🕢", resposta: "7:50", opcoes: ["7:30", "7:45", "7:50", "8:00"] },
            { pergunta: "Que horas são? 2:25", visual: "🕝", resposta: "2:25", opcoes: ["2:00", "2:15", "2:25", "2:30"] },
            { pergunta: "Que horas são? 8:10", visual: "🕣", resposta: "8:10", opcoes: ["8:00", "8:10", "8:15", "8:30"] },
            { pergunta: "Que horas são? 5:35", visual: "🕔", resposta: "5:35", opcoes: ["5:15", "5:30", "5:35", "5:45"] },
            { pergunta: "Que horas são? 10:55", visual: "🕙", resposta: "10:55", opcoes: ["10:30", "10:45", "10:55", "11:00"] }
        ],
        "Pares e Ímpares": [
            { pergunta: "O número 4 é par ou ímpar?", visual: "4", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 7 é par ou ímpar?", visual: "7", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 10 é par ou ímpar?", visual: "10", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 3 é par ou ímpar?", visual: "3", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 8 é par ou ímpar?", visual: "8", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 5 é par ou ímpar?", visual: "5", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 2 é par ou ímpar?", visual: "2", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 9 é par ou ímpar?", visual: "9", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 6 é par ou ímpar?", visual: "6", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 1 é par ou ímpar?", visual: "1", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 12 é par ou ímpar?", visual: "12", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 15 é par ou ímpar?", visual: "15", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 20 é par ou ímpar?", visual: "20", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 11 é par ou ímpar?", visual: "11", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 14 é par ou ímpar?", visual: "14", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 17 é par ou ímpar?", visual: "17", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 18 é par ou ímpar?", visual: "18", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 13 é par ou ímpar?", visual: "13", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 16 é par ou ímpar?", visual: "16", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 19 é par ou ímpar?", visual: "19", resposta: "ímpar", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 22 é par ou ímpar?", visual: "22", resposta: "par", opcoes: ["par", "ímpar"] },
            { pergunta: "O número 21 é par ou ímpar?", visual: "21", resposta: "ímpar", opcoes: ["par", "ímpar"] }
        ]
    },
    
    ciencias: {
        "Ciclo da Água": [
            { pergunta: "O que acontece quando o sol aquece a água?", resposta: "evaporação", opcoes: ["evaporação", "condensação", "precipitação"] },
            { pergunta: "O que forma as nuvens?", resposta: "condensação", opcoes: ["evaporação", "condensação", "precipitação"] },
            { pergunta: "O que é quando a água cai das nuvens?", resposta: "precipitação", opcoes: ["evaporação", "condensação", "precipitação"] },
            { pergunta: "Chuva, neve e granizo são exemplos de?", resposta: "precipitação", opcoes: ["evaporação", "condensação", "precipitação"] },
            { pergunta: "O vapor d'água sobe e se transforma em?", resposta: "nuvens", opcoes: ["gelo", "nuvens", "chuva"] },
            { pergunta: "Qual a energia que aquece a água?", resposta: "sol", opcoes: ["lua", "sol", "vento"] },
            { pergunta: "A água da chuva volta para onde?", resposta: "rios e mares", opcoes: ["nuvens", "sol", "rios e mares"] },
            { pergunta: "O ciclo da água é um processo?", resposta: "contínuo", opcoes: ["contínuo", "parado", "rápido"] },
            { pergunta: "O que é quando a água vira gelo?", resposta: "solidificação", opcoes: ["evaporação", "solidificação", "fusão"] },
            { pergunta: "O gelo derretendo vira?", resposta: "água líquida", opcoes: ["vapor", "gelo", "água líquida"] },
            { pergunta: "Qual o nome da água que está no ar?", resposta: "vapor d'água", opcoes: ["gelo", "vapor d'água", "neblina"] },
            { pergunta: "O que acontece com o vapor d'água ao esfriar?", resposta: "condensa", opcoes: ["evapora", "condensa", "congela"] },
            { pergunta: "Como se chama a água que escorre pela superfície?", resposta: "escoamento", opcoes: ["infiltração", "escoamento", "evaporação"] },
            { pergunta: "Quando a água penetra no solo, chamamos de?", resposta: "infiltração", opcoes: ["evaporação", "condensação", "infiltração"] },
            { pergunta: "Onde fica armazenada a maior parte da água doce?", resposta: "geleiras", opcoes: ["rios", "lagos", "geleiras"] },
            { pergunta: "Qual o percentual de água salgada no planeta?", resposta: "97%", opcoes: ["70%", "80%", "97%", "99%"] },
            { pergunta: "O ciclo da água é movido principalmente por?", resposta: "sol", opcoes: ["lua", "sol", "ventos"] },
            { pergunta: "O que as nuvens liberam quando ficam pesadas?", resposta: "precipitação", opcoes: ["evaporação", "precipitação", "condensação"] },
            { pergunta: "Qual o nome do processo oposto à evaporação?", resposta: "condensação", opcoes: ["solidificação", "fusão", "condensação"] },
            { pergunta: "A transpiração das plantas libera?", resposta: "vapor d'água", opcoes: ["oxigênio", "vapor d'água", "gás carbônico"] },
            { pergunta: "Onde a água da chuva pode se infiltrar?", resposta: "solo", opcoes: ["nuvens", "sol", "solo"] },
            { pergunta: "Qual a importância do ciclo da água?", resposta: "renova a água", opcoes: ["polui a água", "renova a água", "destrói a água"] }
        ],
        "Animais e Habitats": [
            { pergunta: "Onde vive o peixe?", resposta: "água", opcoes: ["água", "terra", "ar"] },
            { pergunta: "Onde vive o pássaro?", resposta: "ar", opcoes: ["água", "terra", "ar"] },
            { pergunta: "Onde vive o leão?", resposta: "terra", opcoes: ["água", "terra", "ar"] },
            { pergunta: "Onde vive o golfinho?", resposta: "água", opcoes: ["água", "terra", "ar"] },
            { pergunta: "Onde vive a minhoca?", resposta: "terra", opcoes: ["água", "terra", "ar"] },
            { pergunta: "Onde vive a abelha?", resposta: "ar", opcoes: ["água", "terra", "ar"] },
            { pergunta: "Onde vive o urso polar?", resposta: "gelo", opcoes: ["gelo", "floresta", "deserto"] },
            { pergunta: "Onde vive o camelo?", resposta: "deserto", opcoes: ["gelo", "floresta", "deserto"] },
            { pergunta: "Onde vive o macaco?", resposta: "floresta", opcoes: ["gelo", "floresta", "deserto"] },
            { pergunta: "Onde vive o pinguim?", resposta: "gelo", opcoes: ["gelo", "floresta", "deserto"] },
            { pergunta: "Onde vive a baleia?", resposta: "mar", opcoes: ["rio", "mar", "lago"] },
            { pergunta: "Onde vive o tigre?", resposta: "floresta", opcoes: ["savana", "floresta", "deserto"] },
            { pergunta: "Onde vive o canguru?", resposta: "savana", opcoes: ["floresta", "savana", "montanha"] },
            { pergunta: "Onde vive a aranha?", resposta: "terra", opcoes: ["água", "terra", "ar"] },
            { pergunta: "Onde vive o morcego?", resposta: "caverna", opcoes: ["árvore", "caverna", "solo"] },
            { pergunta: "Onde vive o polvo?", resposta: "mar", opcoes: ["rio", "mar", "lago"] },
            { pergunta: "Onde vive a zebra?", resposta: "savana", opcoes: ["floresta", "savana", "deserto"] },
            { pergunta: "Onde vive o esquilo?", resposta: "árvore", opcoes: ["solo", "árvore", "água"] },
            { pergunta: "Onde vive o sapo?", resposta: "terra e água", opcoes: ["água", "terra", "terra e água"] },
            { pergunta: "Onde vive o boi?", resposta: "campo", opcoes: ["floresta", "campo", "deserto"] },
            { pergunta: "Onde vive o tubarão?", resposta: "mar", opcoes: ["rio", "mar", "lago"] },
            { pergunta: "Onde vive a coruja?", resposta: "árvore", opcoes: ["caverna", "árvore", "solo"] }
        ],
        "Corpo Humano": [
            { pergunta: "Qual órgão bombeia o sangue?", resposta: "coração", opcoes: ["coração", "pulmão", "cérebro"] },
            { pergunta: "Qual órgão usamos para pensar?", resposta: "cérebro", opcoes: ["coração", "pulmão", "cérebro"] },
            { pergunta: "Qual órgão usamos para respirar?", resposta: "pulmão", opcoes: ["coração", "pulmão", "cérebro"] },
            { pergunta: "Onde fica o estômago?", resposta: "abdômen", opcoes: ["cabeça", "abdômen", "perna"] },
            { pergunta: "Qual osso protege o cérebro?", resposta: "crânio", opcoes: ["costela", "crânio", "fêmur"] },
            { pergunta: "Quantos dentes tem um adulto?", resposta: "32", opcoes: ["28", "30", "32", "34"] },
            { pergunta: "Qual é o maior osso do corpo?", resposta: "fêmur", opcoes: ["tíbia", "fêmur", "úmero"] },
            { pergunta: "Onde fica o joelho?", resposta: "perna", opcoes: ["braço", "perna", "cabeça"] },
            { pergunta: "Quantos ossos tem o corpo humano?", resposta: "206", opcoes: ["200", "206", "210", "215"] },
            { pergunta: "Qual órgão filtra o sangue?", resposta: "rim", opcoes: ["coração", "pulmão", "rim"] },
            { pergunta: "Qual é a função do fígado?", resposta: "limpar o sangue", opcoes: ["bombear sangue", "limpar o sangue", "respirar"] },
            { pergunta: "Onde fica o cotovelo?", resposta: "braço", opcoes: ["braço", "perna", "mão"] },
            { pergunta: "Quantos litros de sangue temos?", resposta: "5", opcoes: ["3", "4", "5", "6"] },
            { pergunta: "Qual o nome da célula do sangue que transporta oxigênio?", resposta: "hemácia", opcoes: ["leucócito", "hemácia", "plaqueta"] },
            { pergunta: "O que protege o coração?", resposta: "costelas", opcoes: ["crânio", "costelas", "coluna"] },
            { pergunta: "Qual a temperatura normal do corpo?", resposta: "36-37°C", opcoes: ["35-36°C", "36-37°C", "37-38°C"] },
            { pergunta: "Quantos batimentos por minuto tem o coração?", resposta: "60-100", opcoes: ["30-50", "60-100", "100-150"] },
            { pergunta: "Qual órgão produz a insulina?", resposta: "pâncreas", opcoes: ["fígado", "pâncreas", "rim"] },
            { pergunta: "Onde fica a traqueia?", resposta: "pescoço", opcoes: ["cabeça", "pescoço", "tórax"] },
            { pergunta: "Qual é a função dos rins?", resposta: "filtrar o sangue", opcoes: ["produzir urina", "filtrar o sangue", "ambas"] },
            { pergunta: "Quantos pares de costelas temos?", resposta: "12", opcoes: ["10", "11", "12", "13"] },
            { pergunta: "Qual a parte do corpo que controla o equilíbrio?", resposta: "cerebelo", opcoes: ["cérebro", "cerebelo", "tronco"] }
        ],
        "Reciclagem": [
            { pergunta: "Qual a cor da lixeira para papel?", resposta: "azul", opcoes: ["azul", "verde", "amarelo"] },
            { pergunta: "Qual a cor da lixeira para vidro?", resposta: "verde", opcoes: ["azul", "verde", "amarelo"] },
            { pergunta: "Qual a cor da lixeira para plástico?", resposta: "amarelo", opcoes: ["azul", "verde", "amarelo"] },
            { pergunta: "Qual a cor da lixeira para metal?", resposta: "cinza", opcoes: ["azul", "verde", "cinza"] },
            { pergunta: "Qual a cor da lixeira para orgânico?", resposta: "marrom", opcoes: ["azul", "verde", "marrom"] },
            { pergunta: "O que significa reciclar?", resposta: "reutilizar", opcoes: ["jogar fora", "reutilizar", "queimar"] },
            { pergunta: "Garrafa PET vai em qual lixeira?", resposta: "amarela", opcoes: ["azul", "verde", "amarela"] },
            { pergunta: "Jornal vai em qual lixeira?", resposta: "azul", opcoes: ["azul", "verde", "amarela"] },
            { pergunta: "O que podemos fazer para ajudar o planeta?", resposta: "reciclar", opcoes: ["poluir", "reciclar", "desperdiçar"] },
            { pergunta: "Vidro vai em qual lixeira?", resposta: "verde", opcoes: ["azul", "verde", "amarela"] },
            { pergunta: "Latinha de alumínio vai em qual lixeira?", resposta: "cinza", opcoes: ["amarela", "cinza", "azul"] },
            { pergunta: "Restos de comida vão em qual lixeira?", resposta: "marrom", opcoes: ["azul", "verde", "marrom"] },
            { pergunta: "Qual é o símbolo da reciclagem?", resposta: "triângulo", opcoes: ["círculo", "triângulo", "quadrado"] },
            { pergunta: "O que significa os 3 Rs?", resposta: "Reduzir, Reutilizar, Reciclar", opcoes: ["Reciclar, Repetir, Reduzir", "Reduzir, Reutilizar, Reciclar", "Reutilizar, Reciclar, Repetir"] },
            { pergunta: "Pilhas e baterias devem ir onde?", resposta: "coleta especial", opcoes: ["lixo comum", "reciclável", "coleta especial"] },
            { pergunta: "Medicamentos vencidos devem ir onde?", resposta: "farmácia", opcoes: ["lixo", "pia", "farmácia"] },
            { pergunta: "Óleo de cozinha usado deve ir onde?", resposta: "coleta especial", opcoes: ["pia", "lixo", "coleta especial"] },
            { pergunta: "Qual é a cor da lixeira para lixo hospitalar?", resposta: "branca", opcoes: ["vermelha", "branca", "amarela"] },
            { pergunta: "Qual material leva mais tempo para se decompor?", resposta: "plástico", opcoes: ["papel", "vidro", "plástico"] },
            { pergunta: "O que é compostagem?", resposta: "transformar orgânico em adubo", opcoes: ["queimar lixo", "transformar em adubo", "jogar no mar"] },
            { pergunta: "Garrafa de vidro pode ser reciclada?", resposta: "sim", opcoes: ["sim", "não", "às vezes"] },
            { pergunta: "O que acontece com o lixo não reciclado?", resposta: "vai para aterro", opcoes: ["some", "vai para aterro", "vira comida"] }
        ],
        "Sistema Solar": [
            { pergunta: "Qual é o planeta mais próximo do Sol?", resposta: "Mercúrio", opcoes: ["Vênus", "Mercúrio", "Terra"] },
            { pergunta: "Qual é o planeta mais quente?", resposta: "Vênus", opcoes: ["Mercúrio", "Vênus", "Marte"] },
            { pergunta: "Onde vivemos?", resposta: "Terra", opcoes: ["Marte", "Vênus", "Terra"] },
            { pergunta: "Qual é o planeta vermelho?", resposta: "Marte", opcoes: ["Marte", "Júpiter", "Saturno"] },
            { pergunta: "Qual é o maior planeta?", resposta: "Júpiter", opcoes: ["Saturno", "Júpiter", "Netuno"] },
            { pergunta: "Qual planeta tem anéis?", resposta: "Saturno", opcoes: ["Júpiter", "Saturno", "Urano"] },
            { pergunta: "O que é o Sol?", resposta: "estrela", opcoes: ["planeta", "estrela", "lua"] },
            { pergunta: "Quantos planetas tem o Sistema Solar?", resposta: "8", opcoes: ["7", "8", "9", "10"] },
            { pergunta: "Qual é o planeta mais distante do Sol?", resposta: "Netuno", opcoes: ["Urano", "Netuno", "Plutão"] },
            { pergunta: "O que gira em torno da Terra?", resposta: "Lua", opcoes: ["Sol", "Lua", "Marte"] },
            { pergunta: "Qual o planeta mais frio?", resposta: "Netuno", opcoes: ["Urano", "Netuno", "Plutão"] },
            { pergunta: "Qual o planeta mais parecido com a Terra?", resposta: "Marte", opcoes: ["Vênus", "Marte", "Mercúrio"] },
            { pergunta: "O que são os asteroides?", resposta: "rochas espaciais", opcoes: ["estrelas", "rochas espaciais", "planetas"] },
            { pergunta: "Qual é a estrela mais próxima da Terra?", resposta: "Sol", opcoes: ["Próxima Centauri", "Sol", "Sirius"] },
            { pergunta: "Quanto tempo a luz do Sol leva para chegar à Terra?", resposta: "8 minutos", opcoes: ["1 minuto", "8 minutos", "1 hora"] },
            { pergunta: "Qual planeta é conhecido como 'gigante gasoso'?", resposta: "Júpiter", opcoes: ["Marte", "Júpiter", "Netuno"] },
            { pergunta: "Qual planeta tem a maior quantidade de luas?", resposta: "Saturno", opcoes: ["Júpiter", "Saturno", "Urano"] },
            { pergunta: "O que causa as estações do ano?", resposta: "inclinação da Terra", opcoes: ["distância do Sol", "inclinação da Terra", "rotação"] },
            { pergunta: "Qual é a galáxia em que vivemos?", resposta: "Via Láctea", opcoes: ["Andrômeda", "Via Láctea", "Triângulo"] },
            { pergunta: "O que é um buraco negro?", resposta: "região com alta gravidade", opcoes: ["buraco no espaço", "região com alta gravidade", "estrela morta"] },
            { pergunta: "Qual sonda já chegou em Marte?", resposta: "Perseverance", opcoes: ["Apollo", "Perseverance", "Voyager"] },
            { pergunta: "Qual foi o primeiro homem a pisar na Lua?", resposta: "Neil Armstrong", opcoes: ["Buzz Aldrin", "Neil Armstrong", "Yuri Gagarin"] }
        ],
        "Estados da Matéria": [
            { pergunta: "A água no estado sólido é:", resposta: "gelo", opcoes: ["gelo", "vapor", "líquido"] },
            { pergunta: "A água no estado líquido é:", resposta: "água", opcoes: ["gelo", "vapor", "água"] },
            { pergunta: "A água no estado gasoso é:", resposta: "vapor", opcoes: ["gelo", "vapor", "líquido"] },
            { pergunta: "O que acontece quando a água congela?", resposta: "vira gelo", opcoes: ["evapora", "vira gelo", "ferve"] },
            { pergunta: "O que acontece quando a água ferve?", resposta: "evapora", opcoes: ["congela", "evapora", "solidifica"] },
            { pergunta: "O gelo derretendo vira:", resposta: "água", opcoes: ["vapor", "água", "gelo"] },
            { pergunta: "Quantos estados da matéria existem?", resposta: "3", opcoes: ["2", "3", "4", "5"] },
            { pergunta: "A pedra é um estado:", resposta: "sólido", opcoes: ["sólido", "líquido", "gasoso"] },
            { pergunta: "O leite é um estado:", resposta: "líquido", opcoes: ["sólido", "líquido", "gasoso"] },
            { pergunta: "O ar é um estado:", resposta: "gasoso", opcoes: ["sólido", "líquido", "gasoso"] },
            { pergunta: "O que é a fusão?", resposta: "passar do sólido ao líquido", opcoes: ["líquido para sólido", "sólido para líquido", "líquido para gasoso"] },
            { pergunta: "O que é a solidificação?", resposta: "passar do líquido ao sólido", opcoes: ["sólido para líquido", "líquido para sólido", "gasoso para líquido"] },
            { pergunta: "O que é a vaporização?", resposta: "passar do líquido ao gasoso", opcoes: ["gasoso para líquido", "líquido para gasoso", "sólido para gasoso"] },
            { pergunta: "O que é a condensação?", resposta: "passar do gasoso ao líquido", opcoes: ["líquido para gasoso", "gasoso para líquido", "sólido para gasoso"] },
            { pergunta: "O que é a sublimação?", resposta: "sólido para gasoso", opcoes: ["sólido para líquido", "líquido para gasoso", "sólido para gasoso"] },
            { pergunta: "O gelo seco é exemplo de?", resposta: "sublimação", opcoes: ["fusão", "solidificação", "sublimação"] },
            { pergunta: "O ponto de ebulição da água é?", resposta: "100°C", opcoes: ["0°C", "50°C", "100°C"] },
            { pergunta: "O ponto de congelamento da água é?", resposta: "0°C", opcoes: ["-10°C", "0°C", "10°C"] },
            { pergunta: "O plasma é o que?", resposta: "quarto estado da matéria", opcoes: ["terceiro estado", "quarto estado", "quinto estado"] },
            { pergunta: "Onde encontramos plasma na natureza?", resposta: "estrelas", opcoes: ["oceanos", "estrelas", "montanhas"] },
            { pergunta: "A madeira é um estado?", resposta: "sólido", opcoes: ["sólido", "líquido", "gasoso"] },
            { pergunta: "O mercúrio é um metal que é?", resposta: "líquido", opcoes: ["sólido", "líquido", "gasoso"] }
        ],
        "Plantas": [
            { pergunta: "Qual parte da planta fica no solo?", resposta: "raiz", opcoes: ["raiz", "caule", "folha"] },
            { pergunta: "Qual parte sustenta a planta?", resposta: "caule", opcoes: ["raiz", "caule", "folha"] },
            { pergunta: "Onde a planta faz a fotossíntese?", resposta: "folha", opcoes: ["raiz", "caule", "folha"] },
            { pergunta: "O que a planta precisa para crescer?", resposta: "sol, água, terra", opcoes: ["só água", "só sol", "sol, água, terra"] },
            { pergunta: "Qual é o processo que a planta produz oxigênio?", resposta: "fotossíntese", opcoes: ["respiração", "fotossíntese", "evaporação"] },
            { pergunta: "A planta respira por onde?", resposta: "estômatos", opcoes: ["raiz", "caule", "estômatos"] },
            { pergunta: "O que a planta absorve pela raiz?", resposta: "água e nutrientes", opcoes: ["ar", "luz", "água e nutrientes"] },
            { pergunta: "Qual é a cor da clorofila?", resposta: "verde", opcoes: ["amarelo", "verde", "azul"] },
            { pergunta: "O que a planta libera na fotossíntese?", resposta: "oxigênio", opcoes: ["gás carbônico", "oxigênio", "nitrogênio"] },
            { pergunta: "A planta é um ser?", resposta: "vivo", opcoes: ["vivo", "morto", "inanimado"] },
            { pergunta: "Qual a função da flor?", resposta: "reprodução", opcoes: ["alimentação", "reprodução", "proteção"] },
            { pergunta: "O que é o fruto?", resposta: "protege a semente", opcoes: ["alimenta a planta", "protege a semente", "faz fotossíntese"] },
            { pergunta: "Qual é a maior planta do mundo?", resposta: "sequoia", opcoes: ["coqueiro", "sequoia", "eucalipto"] },
            { pergunta: "As plantas carnívoras comem?", resposta: "insetos", opcoes: ["folhas", "insetos", "frutas"] },
            { pergunta: "Qual é a parte que atrai polinizadores?", resposta: "flor", opcoes: ["folha", "caule", "flor"] },
            { pergunta: "O que a planta absorve do ar?", resposta: "gás carbônico", opcoes: ["oxigênio", "gás carbônico", "nitrogênio"] },
            { pergunta: "Qual a importância das plantas?", resposta: "produzem oxigênio", opcoes: ["embelezam", "produzem oxigênio", "dão sombra"] },
            { pergunta: "As algas são plantas?", resposta: "sim", opcoes: ["sim", "não", "às vezes"] },
            { pergunta: "O que é a germinação?", resposta: "nascimento da planta", opcoes: ["morte da planta", "nascimento da planta", "crescimento"] },
            { pergunta: "Qual a parte que absorve água?", resposta: "raiz", opcoes: ["caule", "folha", "raiz"] },
            { pergunta: "O cacto armazena água onde?", resposta: "caule", opcoes: ["raiz", "caule", "folha"] },
            { pergunta: "As plantas aquáticas vivem onde?", resposta: "água", opcoes: ["terra", "água", "ar"] }
        ],
        "Sentidos": [
            { pergunta: "Qual sentido usamos para ver?", resposta: "visão", opcoes: ["visão", "audição", "olfato"] },
            { pergunta: "Qual sentido usamos para ouvir?", resposta: "audição", opcoes: ["visão", "audição", "olfato"] },
            { pergunta: "Qual sentido usamos para cheirar?", resposta: "olfato", opcoes: ["visão", "audição", "olfato"] },
            { pergunta: "Qual sentido usamos para sentir o gosto?", resposta: "paladar", opcoes: ["visão", "tato", "paladar"] },
            { pergunta: "Qual sentido usamos para tocar?", resposta: "tato", opcoes: ["visão", "tato", "paladar"] },
            { pergunta: "Quantos sentidos temos?", resposta: "5", opcoes: ["4", "5", "6", "7"] },
            { pergunta: "Qual órgão usamos para ver?", resposta: "olhos", opcoes: ["ouvidos", "olhos", "nariz"] },
            { pergunta: "Qual órgão usamos para ouvir?", resposta: "ouvidos", opcoes: ["ouvidos", "olhos", "boca"] },
            { pergunta: "Qual órgão usamos para cheirar?", resposta: "nariz", opcoes: ["boca", "nariz", "pele"] },
            { pergunta: "Qual órgão usamos para sentir o gosto?", resposta: "língua", opcoes: ["língua", "nariz", "mão"] },
            { pergunta: "Qual órgão usamos para o tato?", resposta: "pele", opcoes: ["mão", "pele", "dedos"] },
            { pergunta: "Qual parte do olho dá cor?", resposta: "íris", opcoes: ["pupila", "íris", "córnea"] },
            { pergunta: "Qual parte do ouvido capta o som?", resposta: "tímpano", opcoes: ["canal", "tímpano", "cóclea"] },
            { pergunta: "As papilas gustativas ficam onde?", resposta: "língua", opcoes: ["boca", "língua", "céu da boca"] },
            { pergunta: "Quantos sabores básicos existem?", resposta: "5", opcoes: ["4", "5", "6"] },
            { pergunta: "Quais são os sabores básicos?", resposta: "doce, salgado, azedo, amargo, umami", opcoes: ["doce, salgado, azedo", "doce, salgado, azedo, amargo", "doce, salgado, azedo, amargo, umami"] },
            { pergunta: "O que a pupila faz?", resposta: "controla a entrada de luz", opcoes: ["dá cor", "controla a luz", "protege o olho"] },
            { pergunta: "Onde ficam os receptores do olfato?", resposta: "nariz", opcoes: ["boca", "nariz", "garganta"] },
            { pergunta: "O sentido mais aguçado dos cães é?", resposta: "olfato", opcoes: ["visão", "audição", "olfato"] },
            { pergunta: "A cegueira é a perda de qual sentido?", resposta: "visão", opcoes: ["audição", "visão", "tato"] },
            { pergunta: "A surdez é a perda de qual sentido?", resposta: "audição", opcoes: ["visão", "audição", "olfato"] },
            { pergunta: "Qual animal tem a melhor visão noturna?", resposta: "coruja", opcoes: ["gato", "coruja", "morcego"] }
        ]
    }
};

function carregarDadosOnline() {
    bancoDePalavras = [...BANCO_LOCAL.palavras];
    bancoDitadoVisual = [...BANCO_LOCAL.ditadoVisual];
    bancoRimas = [...BANCO_LOCAL.rimas];
    bancoPalavraOculta = [...BANCO_LOCAL.palavraOculta];
    bancoMatematica = { ...BANCO_LOCAL.matematica };
    bancoCiencias = { ...BANCO_LOCAL.ciencias };
    dadosCarregados = true;
    console.log("✅ Banco de dados carregado com sucesso!");
    console.log("📚 Matemática: Soma Criativa=" + bancoMatematica["Soma Criativa"].length + " perguntas");
    console.log("📚 Matemática: Subtração=" + bancoMatematica["Subtração Divertida"].length + " perguntas");
    console.log("📚 Matemática: Contagem=" + bancoMatematica["Contagem"].length + " perguntas");
    console.log("📚 Matemática: Maior=" + bancoMatematica["Qual é o Maior?"].length + " perguntas");
    console.log("📚 Matemática: Sequência=" + bancoMatematica["Sequência"].length + " perguntas");
    console.log("📚 Matemática: Formas=" + bancoMatematica["Formas Geométricas"].length + " perguntas");
    console.log("📚 Matemática: Relógio=" + bancoMatematica["Relógio Digital"].length + " perguntas");
    console.log("📚 Matemática: Pares/Ímpares=" + bancoMatematica["Pares e Ímpares"].length + " perguntas");
    console.log("🔬 Ciências: Ciclo da Água=" + bancoCiencias["Ciclo da Água"].length + " perguntas");
    console.log("🔬 Ciências: Animais=" + bancoCiencias["Animais e Habitats"].length + " perguntas");
    console.log("🔬 Ciências: Corpo Humano=" + bancoCiencias["Corpo Humano"].length + " perguntas");
    console.log("🔬 Ciências: Reciclagem=" + bancoCiencias["Reciclagem"].length + " perguntas");
    console.log("🔬 Ciências: Sistema Solar=" + bancoCiencias["Sistema Solar"].length + " perguntas");
    console.log("🔬 Ciências: Estados da Matéria=" + bancoCiencias["Estados da Matéria"].length + " perguntas");
    console.log("🔬 Ciências: Plantas=" + bancoCiencias["Plantas"].length + " perguntas");
    console.log("🔬 Ciências: Sentidos=" + bancoCiencias["Sentidos"].length + " perguntas");
}

carregarDadosOnline();

// ================= NAVEGAÇÃO =================
// Mostra uma única página (.page) e marca o item do menu correspondente
function mostrarPagina(idPagina, idNav) {
    document.querySelectorAll('.sub-menu').forEach(sub => sub.classList.remove('open'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active', 'open'));
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const pagina = document.getElementById(idPagina);
    if (pagina) pagina.classList.add('active');
    const nav = idNav ? document.getElementById(idNav) : document.querySelector('.nav-item');
    if (nav) nav.classList.add('active');
    const main = document.querySelector('.main-content');
    if (main) main.scrollTop = 0;
    window.scrollTo(0, 0);
    if (window.innerWidth <= 900) closeSidebar();
}

function navigateHome() { mostrarPagina('home-section', null); }

// Aba de resultados (feiras e agradecimentos)
function abrirResultados() { mostrarPagina('resultados-section', 'nav-resultados'); }

// A aba do TCC (abrirTCC) está toda em tcc.js

function toggleSubMenu(id, element) {
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    element.classList.add('active');
    const sub = document.getElementById('sub-' + id);
    const estaAberto = sub.classList.contains('open');
    document.querySelectorAll('.sub-menu').forEach(subMenu => subMenu.classList.remove('open'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('open'));
    if (!estaAberto) {
        sub.classList.add('open');
        element.classList.add('open');
    }
}

function carregarJogos(nomeJogo) {
    if (!dadosCarregados) {
        mostrarMensagem("Carregando dados... Aguarde um momento.", false);
        setTimeout(() => carregarJogos(nomeJogo), 500);
        return;
    }

    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('#nav-resultados, #nav-tcc').forEach(n => n.classList.remove('active'));
    document.getElementById('games-section').classList.add('active');
    document.getElementById('category-name').innerText = "Jogo: " + nomeJogo;
    if (window.innerWidth <= 900) closeSidebar();

    // Todos os jogos agora rodam no motor novo (jogos-base.js + jogos.js)
    if (typeof JG !== 'undefined' && JG.abrir(nomeJogo)) return;

    if (false) { }
    else mostrarMensagem("O jogo '" + nomeJogo + "' está em desenvolvimento.", false);
}

function carregarJogo(nomeJogo) { return carregarJogos(nomeJogo); }

// ================= FEEDBACK VISUAL (TOASTS) E SOM =================
// Mensagens que NÃO representam um erro de resposta (avisos, validação, carregando),
// então não devem quebrar a sequência de acertos do usuário.
const IGNORAR_QUEBRA_STREAK = [
    "Escolha ou digite", "Selecione as letras", "já está preenchido",
    "Carregando dados", "em desenvolvimento", "Nenhum dado disponível",
    "primeiro!"
];

function exibirToast(mensagem, sucesso) {
    if (!mensagem) return;
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.setAttribute('aria-live', 'polite');
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast ' + (sucesso ? 'toast-sucesso' : 'toast-erro');
    toast.innerHTML = `<span class="toast-texto">${mensagem}</span>`;
    container.appendChild(toast);
    requestAnimationFrame(() => toast.classList.add('toast-visivel'));
    setTimeout(() => {
        toast.classList.remove('toast-visivel');
        setTimeout(() => toast.remove(), 400);
    }, 3200);
}

function mostrarMensagem(mensagem, sucesso = true) {
    if (sucesso) {
        if (typeof confetti !== "undefined") {
            confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
        }
        tocarSom('acerto');
    } else {
        tocarSom('erro');
        const ignorar = IGNORAR_QUEBRA_STREAK.some(sub => mensagem.includes(sub));
        if (!ignorar) quebrarStreak();
    }
    exibirToast(mensagem, sucesso);
}

// ================= SEQUÊNCIA DE ACERTOS (STREAK/COMBO) =================
function atualizarStreakVisual() {
    const el = document.getElementById('streak-atual');
    if (!el) return;
    el.innerText = estadoAtual.streakAtual || 0;
    el.classList.remove('streak-pulso');
    void el.offsetWidth;
    el.classList.add('streak-pulso');
}

function quebrarStreak() {
    if (estadoAtual.streakAtual) {
        estadoAtual.streakAtual = 0;
        atualizarStreakVisual();
    }
}

// ================= CONQUISTAS =================
const CONQUISTAS_CATEGORIAS = [
    { id: 'inicio',  nome: '🌱 Primeiros passos' },
    { id: 'acertos', nome: '🎯 Acertos' },
    { id: 'sequencia', nome: '🔥 Sequências' },
    { id: 'nivel',   nome: '🏆 Níveis e pontos' },
    { id: 'rodadas', nome: '🏁 Rodadas e estrelas' },
    { id: 'areas',   nome: '📚 Áreas de estudo' },
    { id: 'jogos',   nome: '🎲 Jogos especiais' },
    { id: 'jeito',   nome: '💪 Jeito de aprender' },
    { id: 'dias',    nome: '📅 Constância' },
    { id: 'mestres', nome: '🎮 Craques de cada jogo' },
    { id: 'colecao', nome: '🏛️ Coleção' }
];
// Cada conquista tem prog(e) -> [valorAtual, meta]. Quando valorAtual >= meta ela é desbloqueada.
const _x = e => (e.extras || {});
const _area = (e, a) => ((_x(e).areas || {})[a] || 0);
const _jogoRod = (e, j) => ((_x(e).rodadasPorJogo || {})[j] || 0);
const _jogoAc = (e, j) => (((e.estatisticasJogos || {})[j] || {}).acertos || 0);
const CONQUISTAS = [
    // Primeiros passos
    { id: 'primeiro_acerto', cat: 'inicio', nome: 'Primeiro Passo', emoji: '🥇', desc: 'Acertou sua primeira pergunta!', prog: e => [e.totalAcertos || 0, 1] },
    { id: 'jogos_variados', cat: 'inicio', nome: 'Curioso', emoji: '🎲', desc: 'Jogou 5 jogos diferentes!', prog: e => [Object.keys(e.estatisticasJogos || {}).length, 5] },
    { id: 'jogos_todos', cat: 'inicio', nome: 'Explorador Completo', emoji: '🗺️', desc: 'Experimentou 10 jogos diferentes!', prog: e => [Object.keys(e.estatisticasJogos || {}).length, 10] },
    { id: 'jogos_20', cat: 'inicio', nome: 'Aventureiro', emoji: '🧗', desc: 'Experimentou 20 jogos diferentes!', prog: e => [Object.keys(e.estatisticasJogos || {}).length, 20] },
    { id: 'jogos_30', cat: 'inicio', nome: 'Mestre dos Jogos', emoji: '🎪', desc: 'Experimentou TODOS os 30 jogos!', prog: e => [Object.keys(e.estatisticasJogos || {}).length, 30] },
    // Acertos
    { id: 'acertos_25', cat: 'acertos', nome: 'Na Mosca', emoji: '🎯', desc: '25 acertos no total!', prog: e => [e.totalAcertos || 0, 25] },
    { id: 'acertos_100', cat: 'acertos', nome: 'Cem Acertos', emoji: '💯', desc: '100 acertos no total!', prog: e => [e.totalAcertos || 0, 100] },
    { id: 'acertos_300', cat: 'acertos', nome: 'Super Aprendiz', emoji: '🚀', desc: '300 acertos no total!', prog: e => [e.totalAcertos || 0, 300] },
    { id: 'acertos_1000', cat: 'acertos', nome: 'Mestre dos Acertos', emoji: '🎓', desc: '1000 acertos no total!', prog: e => [e.totalAcertos || 0, 1000] },
    // Sequências
    { id: 'streak_5', cat: 'sequencia', nome: 'Sequência de Ouro', emoji: '🔥', desc: '5 acertos seguidos!', prog: e => [e.melhorStreak || 0, 5] },
    { id: 'streak_10', cat: 'sequencia', nome: 'Imparável', emoji: '⚡', desc: '10 acertos seguidos!', prog: e => [e.melhorStreak || 0, 10] },
    { id: 'streak_15', cat: 'sequencia', nome: 'Cometa', emoji: '☄️', desc: '15 acertos seguidos!', prog: e => [e.melhorStreak || 0, 15] },
    { id: 'streak_25', cat: 'sequencia', nome: 'Inabalável', emoji: '🛡️', desc: '25 acertos seguidos!', prog: e => [e.melhorStreak || 0, 25] },
    // Níveis e pontos
    { id: 'nivel_3', cat: 'nivel', nome: 'Aprendiz Dedicado', emoji: '🌱', desc: 'Chegou ao Nível 3!', prog: e => [e.nivelAtual || 1, 3] },
    { id: 'nivel_5', cat: 'nivel', nome: 'Explorador', emoji: '🧭', desc: 'Chegou ao Nível 5!', prog: e => [e.nivelAtual || 1, 5] },
    { id: 'nivel_10', cat: 'nivel', nome: 'Mestre do Saber', emoji: '👑', desc: 'Chegou ao Nível 10!', prog: e => [e.nivelAtual || 1, 10] },
    { id: 'nivel_15', cat: 'nivel', nome: 'Sábio', emoji: '🦉', desc: 'Chegou ao Nível 15!', prog: e => [e.nivelAtual || 1, 15] },
    { id: 'nivel_20', cat: 'nivel', nome: 'Gênio', emoji: '🧠', desc: 'Chegou ao Nível 20!', prog: e => [e.nivelAtual || 1, 20] },
    { id: 'pontos_250', cat: 'nivel', nome: 'Juntando Estrelas', emoji: '⭐', desc: 'Juntou 250 pontos!', prog: e => [e.pontuacaoTotal || 0, 250] },
    { id: 'pontos_500', cat: 'nivel', nome: 'Colecionador de Estrelas', emoji: '🌟', desc: 'Juntou 500 pontos!', prog: e => [e.pontuacaoTotal || 0, 500] },
    { id: 'pontos_1000', cat: 'nivel', nome: 'Lenda do EducaTEA', emoji: '🏆', desc: 'Juntou 1000 pontos!', prog: e => [e.pontuacaoTotal || 0, 1000] },
    { id: 'pontos_2500', cat: 'nivel', nome: 'Chuva de Estrelas', emoji: '🌠', desc: 'Juntou 2500 pontos!', prog: e => [e.pontuacaoTotal || 0, 2500] },
    { id: 'pontos_5000', cat: 'nivel', nome: 'Constelação', emoji: '🌌', desc: 'Juntou 5000 pontos!', prog: e => [e.pontuacaoTotal || 0, 5000] },
    // Rodadas e estrelas
    { id: 'rodada_1', cat: 'rodadas', nome: 'Rodada Completa', emoji: '🏁', desc: 'Terminou a sua primeira rodada!', prog: e => [_x(e).rodadas || 0, 1] },
    { id: 'rodada_10', cat: 'rodadas', nome: 'Maratonista', emoji: '🏃', desc: 'Terminou 10 rodadas!', prog: e => [_x(e).rodadas || 0, 10] },
    { id: 'rodada_30', cat: 'rodadas', nome: 'Incansável', emoji: '🏅', desc: 'Terminou 30 rodadas!', prog: e => [_x(e).rodadas || 0, 30] },
    { id: 'estrela3_1', cat: 'rodadas', nome: 'Três Estrelas', emoji: '🌟', desc: 'Ganhou 3 estrelas em uma rodada!', prog: e => [_x(e).estrelas3 || 0, 1] },
    { id: 'estrela3_10', cat: 'rodadas', nome: 'Brilhante', emoji: '✨', desc: 'Ganhou 3 estrelas em 10 rodadas!', prog: e => [_x(e).estrelas3 || 0, 10] },
    { id: 'perfeita_1', cat: 'rodadas', nome: 'Rodada Perfeita', emoji: '💎', desc: 'Acertou tudo de primeira, sem dicas!', prog: e => [_x(e).rodadasPerfeitas || 0, 1] },
    { id: 'perfeita_5', cat: 'rodadas', nome: 'Diamante', emoji: '💠', desc: '5 rodadas perfeitas!', prog: e => [_x(e).rodadasPerfeitas || 0, 5] },
    { id: 'perfeita_3_seg', cat: 'rodadas', nome: 'Trio Perfeito', emoji: '🔱', desc: '3 rodadas perfeitas seguidas!', prog: e => [_x(e).melhorPerfeitasSeguidas || 0, 3] },
    // Áreas de estudo
    { id: 'palavras_20', cat: 'areas', nome: 'Amigo das Palavras', emoji: '📚', desc: '20 acertos em jogos de Palavras!', prog: e => [_area(e, 'palavras'), 20] },
    { id: 'palavras_60', cat: 'areas', nome: 'Pequeno Escritor', emoji: '✍️', desc: '60 acertos em jogos de Palavras!', prog: e => [_area(e, 'palavras'), 60] },
    { id: 'mat_20', cat: 'areas', nome: 'Craque dos Números', emoji: '🔢', desc: '20 acertos em jogos de Matemática!', prog: e => [_area(e, 'matematica'), 20] },
    { id: 'mat_60', cat: 'areas', nome: 'Matemático', emoji: '📐', desc: '60 acertos em jogos de Matemática!', prog: e => [_area(e, 'matematica'), 60] },
    { id: 'ciencias_20', cat: 'areas', nome: 'Pequeno Cientista', emoji: '🔬', desc: '20 acertos em jogos de Ciências!', prog: e => [_area(e, 'ciencias'), 20] },
    { id: 'ciencias_60', cat: 'areas', nome: 'Cientista', emoji: '🧪', desc: '60 acertos em jogos de Ciências!', prog: e => [_area(e, 'ciencias'), 60] },
    { id: 'areas_todas', cat: 'areas', nome: 'Sabe-Tudo', emoji: '🌍', desc: '15 acertos em cada uma das 3 áreas!', prog: e => [Math.min(_area(e, 'palavras'), _area(e, 'matematica'), _area(e, 'ciencias')), 15] },
    // Jogos especiais
    { id: 'caca_3', cat: 'jogos', nome: 'Detetive de Palavras', emoji: '🕵️', desc: 'Terminou 3 Caça-Palavras!', prog: e => [_jogoRod(e, 'Caça-Palavras'), 3] },
    { id: 'memoria_3', cat: 'jogos', nome: 'Memória de Elefante', emoji: '🐘', desc: 'Terminou 3 jogos da Memória de Palavras!', prog: e => [_jogoRod(e, 'Memória de Palavras'), 3] },
    { id: 'emocoes_10', cat: 'jogos', nome: 'Coração Atento', emoji: '💗', desc: '10 acertos em Emoções!', prog: e => [_jogoAc(e, 'Emoções'), 10] },
    { id: 'rotina_3', cat: 'jogos', nome: 'Rei da Rotina', emoji: '⏱️', desc: 'Organizou 3 rotinas!', prog: e => [_jogoRod(e, 'Minha Rotina'), 3] },
    { id: 'ambiente_10', cat: 'jogos', nome: 'Guardião do Planeta', emoji: '🌎', desc: '10 acertos em Cuidado com o Ambiente!', prog: e => [_jogoAc(e, 'Cuidado com o Ambiente'), 10] },
    { id: 'sombras_3', cat: 'jogos', nome: 'Caçador de Sombras', emoji: '🌑', desc: 'Completou 3 jogos de Sombras Mágicas!', prog: e => [_jogoRod(e, 'Sombras Mágicas'), 3] },
    // Jeito de aprender
    { id: 'dica_1', cat: 'jeito', nome: 'Pedir Ajuda é Legal', emoji: '🤝', desc: 'Usou uma dica. Pedir ajuda faz parte de aprender!', prog: e => [_x(e).dicas || 0, 1] },
    { id: 'recuperada_1', cat: 'jeito', nome: 'Não Desisto', emoji: '💪', desc: 'Errou, tentou de novo e acertou!', prog: e => [_x(e).recuperadas || 0, 1] },
    { id: 'recuperada_20', cat: 'jeito', nome: 'Persistente', emoji: '🧗‍♀️', desc: 'Tentou de novo e acertou 20 vezes!', prog: e => [_x(e).recuperadas || 0, 20] },
    { id: 'sem_dica_30', cat: 'jeito', nome: 'Pensador', emoji: '🤔', desc: '30 acertos sem usar dicas!', prog: e => [_x(e).semDica || 0, 30] },
    // Constância
    { id: 'dias_3', cat: 'dias', nome: 'Voltou!', emoji: '📅', desc: 'Jogou 3 dias seguidos!', prog: e => [(typeof JG !== 'undefined' ? JG.diasSeguidos() : 0), 3] },
    { id: 'dias_7', cat: 'dias', nome: 'Semana de Estudos', emoji: '🗓️', desc: 'Jogou 7 dias seguidos!', prog: e => [(typeof JG !== 'undefined' ? JG.diasSeguidos() : 0), 7] },
    { id: 'dias_10', cat: 'dias', nome: 'Rotina de Aprendizado', emoji: '⏰', desc: 'Jogou em 10 dias diferentes!', prog: e => [(_x(e).dias || []).length, 10] }
];

// ---------- conquistas extras (mais metas em cada categoria) ----------
const _jogosLista = [
    ['Monte a Palavra','🔤'],['Caça-Palavras','🔎'],['Sílabas Mágicas','🪄'],['Ditado Visual','🖼️'],['Rima Maluca','🎵'],['Qual é a Letra?','🅰️'],
    ['Memória de Palavras','🃏'],['Palavra Oculta','🕵️‍♀️'],['Sombras Mágicas','🌑'],
    ['Soma Criativa','➕'],['Subtração Divertida','➖'],['Contagem','🔢'],['Qual é o Maior?','📊'],['Sequência','➡️'],['Formas Geométricas','🔷'],
    ['Relógio Digital','⏰'],['Pares e Ímpares','👯'],['Classificação de Cores','🎨'],['Contagem de Objetos','🔟'],
    ['Ciclo da Água','💧'],['Animais e Habitats','🦁'],['Corpo Humano','🫀'],['Reciclagem','♻️'],['Sistema Solar','🪐'],['Estados da Matéria','🧊'],
    ['Plantas','🌿'],['Sentidos','👂'],['Emoções','😊'],['Minha Rotina','🗓️'],['Cuidado com o Ambiente','🌍']
];
const _novas = [
    // acertos / sequências / níveis / pontos
    ['acertos_500', 'acertos', 'Gigante do Saber', '🦁', '500 acertos no total!', e => [e.totalAcertos || 0, 500]],
    ['acertos_2000', 'acertos', 'Lenda dos Acertos', '🐉', '2000 acertos no total!', e => [e.totalAcertos || 0, 2000]],
    ['acertos_50', 'acertos', 'Cinquentinha', '🎈', '50 acertos no total!', e => [e.totalAcertos || 0, 50]],
    ['streak_3', 'sequencia', 'Aquecendo', '🌤️', '3 acertos seguidos!', e => [e.melhorStreak || 0, 3]],
    ['streak_40', 'sequencia', 'Fogo Eterno', '🌋', '40 acertos seguidos!', e => [e.melhorStreak || 0, 40]],
    ['streak_50', 'sequencia', 'Invencível', '🦸', '50 acertos seguidos!', e => [e.melhorStreak || 0, 50]],
    ['nivel_2', 'nivel', 'Subindo!', '🪜', 'Chegou ao Nível 2!', e => [e.nivelAtual || 1, 2]],
    ['nivel_25', 'nivel', 'Mago do Saber', '🧙', 'Chegou ao Nível 25!', e => [e.nivelAtual || 1, 25]],
    ['nivel_30', 'nivel', 'Mestre Supremo', '🏯', 'Chegou ao Nível 30!', e => [e.nivelAtual || 1, 30]],
    ['pontos_100', 'nivel', 'Primeiras Estrelinhas', '✨', 'Juntou 100 pontos!', e => [e.pontuacaoTotal || 0, 100]],
    ['pontos_10000', 'nivel', 'Tesouro Real', '💰', 'Juntou 10000 pontos!', e => [e.pontuacaoTotal || 0, 10000]],
    ['pontos_25000', 'nivel', 'Universo de Pontos', '🪐', 'Juntou 25000 pontos!', e => [e.pontuacaoTotal || 0, 25000]],
    // rodadas
    ['rodada_5', 'rodadas', 'Pegando o Ritmo', '🎶', 'Terminou 5 rodadas!', e => [_x(e).rodadas || 0, 5]],
    ['rodada_50', 'rodadas', 'Cinquentão', '🏔️', 'Terminou 50 rodadas!', e => [_x(e).rodadas || 0, 50]],
    ['rodada_100', 'rodadas', 'Centenário', '🏰', 'Terminou 100 rodadas!', e => [_x(e).rodadas || 0, 100]],
    ['estrela3_25', 'rodadas', 'Céu Estrelado', '🌃', 'Ganhou 3 estrelas em 25 rodadas!', e => [_x(e).estrelas3 || 0, 25]],
    ['estrela3_50', 'rodadas', 'Galáxia', '🌌', 'Ganhou 3 estrelas em 50 rodadas!', e => [_x(e).estrelas3 || 0, 50]],
    ['perfeita_10', 'rodadas', 'Cristal', '🔮', '10 rodadas perfeitas!', e => [_x(e).rodadasPerfeitas || 0, 10]],
    ['perfeita_25', 'rodadas', 'Joia Rara', '👑', '25 rodadas perfeitas!', e => [_x(e).rodadasPerfeitas || 0, 25]],
    ['perfeita_5_seg', 'rodadas', 'Sem Falhas', '🎖️', '5 rodadas perfeitas seguidas!', e => [_x(e).melhorPerfeitasSeguidas || 0, 5]],
    // áreas
    ['palavras_120', 'areas', 'Mestre das Palavras', '📖', '120 acertos em jogos de Palavras!', e => [_area(e, 'palavras'), 120]],
    ['mat_120', 'areas', 'Mestre dos Números', '🧮', '120 acertos em jogos de Matemática!', e => [_area(e, 'matematica'), 120]],
    ['ciencias_120', 'areas', 'Mestre da Ciência', '🔭', '120 acertos em jogos de Ciências!', e => [_area(e, 'ciencias'), 120]],
    ['palavras_5', 'areas', 'Primeiras Letras', '🔡', '5 acertos em jogos de Palavras!', e => [_area(e, 'palavras'), 5]],
    ['mat_5', 'areas', 'Primeiras Contas', '1️⃣', '5 acertos em jogos de Matemática!', e => [_area(e, 'matematica'), 5]],
    ['ciencias_5', 'areas', 'Primeira Descoberta', '💡', '5 acertos em jogos de Ciências!', e => [_area(e, 'ciencias'), 5]],
    ['areas_todas_50', 'areas', 'Gênio Completo', '🌟', '50 acertos em cada uma das 3 áreas!', e => [Math.min(_area(e, 'palavras'), _area(e, 'matematica'), _area(e, 'ciencias')), 50]],
    // jeito de aprender
    ['dica_10', 'jeito', 'Boa Equipe', '🫶', 'Usou 10 dicas. Pedir ajuda é coisa de gente esperta!', e => [_x(e).dicas || 0, 10]],
    ['dica_50', 'jeito', 'Sempre Aprendendo', '📘', 'Usou 50 dicas!', e => [_x(e).dicas || 0, 50]],
    ['recuperada_5', 'jeito', 'Quase Lá', '🎯', 'Errou, tentou de novo e acertou 5 vezes!', e => [_x(e).recuperadas || 0, 5]],
    ['recuperada_50', 'jeito', 'Gigante da Persistência', '🏔️', 'Tentou de novo e acertou 50 vezes!', e => [_x(e).recuperadas || 0, 50]],
    ['sem_dica_10', 'jeito', 'Confiante', '😎', '10 acertos sem usar dicas!', e => [_x(e).semDica || 0, 10]],
    ['sem_dica_100', 'jeito', 'Mente Afiada', '🧩', '100 acertos sem usar dicas!', e => [_x(e).semDica || 0, 100]],
    ['sem_dica_300', 'jeito', 'Cérebro de Ouro', '🥇', '300 acertos sem usar dicas!', e => [_x(e).semDica || 0, 300]],
    ['erros_10', 'jeito', 'Errar é Aprender', '🌈', 'Errou 10 vezes e continuou tentando. Errar faz parte!', e => [_x(e).erros || 0, 10]],
    ['erros_50', 'jeito', 'Coragem de Tentar', '🦁', 'Continuou tentando depois de 50 erros. Que coragem!', e => [_x(e).erros || 0, 50]],
    // constância
    ['dia_1', 'dias', 'Primeiro Dia', '🌅', 'Jogou o primeiro dia!', e => [(_x(e).dias || []).length, 1]],
    ['dias_14', 'dias', 'Quinzena de Estudos', '🌗', 'Jogou 14 dias seguidos!', e => [(typeof JG !== 'undefined' ? JG.diasSeguidos() : 0), 14]],
    ['dias_30', 'dias', 'Mês Inteiro', '🌕', 'Jogou 30 dias seguidos!', e => [(typeof JG !== 'undefined' ? JG.diasSeguidos() : 0), 30]],
    ['dias_20t', 'dias', 'Visita Fiel', '🏡', 'Jogou em 20 dias diferentes!', e => [(_x(e).dias || []).length, 20]],
    ['dias_50t', 'dias', 'Veterano', '🎖️', 'Jogou em 50 dias diferentes!', e => [(_x(e).dias || []).length, 50]],
    ['manha_1', 'dias', 'Madrugador', '🐦', 'Jogou antes das 9 da manhã!', e => [_x(e).manha ? 1 : 0, 1]],
    ['noite_1', 'dias', 'Coruja', '🦉', 'Jogou depois das 19 horas!', e => [_x(e).noite ? 1 : 0, 1]],
    ['fds_1', 'dias', 'Fim de Semana Divertido', '🎈', 'Jogou no sábado ou no domingo!', e => [_x(e).fimSemana ? 1 : 0, 1]],
    // jogos especiais
    ['caca_10', 'jogos', 'Mestre dos Caça-Palavras', '🔍', 'Terminou 10 Caça-Palavras!', e => [_jogoRod(e, 'Caça-Palavras'), 10]],
    ['memoria_10', 'jogos', 'Memória de Ouro', '🏆', 'Terminou 10 jogos da Memória de Palavras!', e => [_jogoRod(e, 'Memória de Palavras'), 10]],
    ['emocoes_30', 'jogos', 'Mestre das Emoções', '🫂', '30 acertos em Emoções!', e => [_jogoAc(e, 'Emoções'), 30]],
    ['ambiente_30', 'jogos', 'Herói do Planeta', '🦸‍♀️', '30 acertos em Cuidado com o Ambiente!', e => [_jogoAc(e, 'Cuidado com o Ambiente'), 30]],
    ['rotina_10', 'jogos', 'Mestre da Rotina', '📆', 'Organizou 10 rotinas!', e => [_jogoRod(e, 'Minha Rotina'), 10]],
    ['relogio_20', 'jogos', 'Senhor do Tempo', '⌛', '20 acertos no Relógio Digital!', e => [_jogoAc(e, 'Relógio Digital'), 20]],
    ['soma_30', 'jogos', 'Rei da Soma', '➕', '30 acertos na Soma Criativa!', e => [_jogoAc(e, 'Soma Criativa'), 30]],
    ['subtracao_30', 'jogos', 'Rei da Subtração', '➖', '30 acertos na Subtração Divertida!', e => [_jogoAc(e, 'Subtração Divertida'), 30]],
    ['cores_5', 'jogos', 'Arco-Íris', '🌈', 'Terminou 5 jogos de Classificação de Cores!', e => [_jogoRod(e, 'Classificação de Cores'), 5]],
    ['reciclagem_20', 'jogos', 'Amigo da Natureza', '♻️', '20 acertos em Reciclagem!', e => [_jogoAc(e, 'Reciclagem'), 20]],
    ['solar_20', 'jogos', 'Astronauta', '🚀', '20 acertos no Sistema Solar!', e => [_jogoAc(e, 'Sistema Solar'), 20]]
];
_novas.forEach(([id, cat, nome, emoji, desc, prog]) => CONQUISTAS.push({ id, cat, nome, emoji, desc, prog }));
// um "craque" para cada um dos 30 jogos
_jogosLista.forEach(([j, em]) => CONQUISTAS.push({ id: 'craque_' + j.normalize('NFD').replace(/[^a-zA-Z0-9]/g, ''), cat: 'mestres', nome: 'Craque: ' + j, emoji: em, desc: `Terminou 3 rodadas de ${j}!`, prog: e => [_jogoRod(e, j), 3] }));
// coleção (conquistas que contam conquistas)
[[10, 'Colecionador Iniciante', '📦'], [25, 'Colecionador', '🗃️'], [50, 'Grande Colecionador', '🏛️'], [75, 'Caçador de Troféus', '🏆'], [100, 'Lenda das Conquistas', '👑']].forEach(([n, nome, em]) =>
    CONQUISTAS.push({ id: 'colecao_' + n, cat: 'colecao', nome, emoji: em, desc: `Desbloqueou ${n} conquistas!`, prog: e => [(e.conquistas || []).filter(i => !String(i).startsWith('colecao_')).length, n] }));
// nível do troféu (bronze, prata, ouro, diamante) conforme a posição na série
(function () {
    const series = {};
    CONQUISTAS.forEach(c => { const k = c.cat === 'mestres' ? 'mestres' : c.id.replace(/_[^_]*$/, ''); (series[k] = series[k] || []).push(c); });
    Object.values(series).forEach(l => {
        l.sort((a, b) => a.prog({})[1] - b.prog({})[1]);
        l.forEach((c, i) => { c.tier = l.length === 1 ? 2 : Math.min(4, 1 + Math.floor(i * 4 / l.length)); });
    });
})();
const TIERS = { 1: ['Bronze', '🥉'], 2: ['Prata', '🥈'], 3: ['Ouro', '🥇'], 4: ['Diamante', '💎'] };

CONQUISTAS.forEach(c => { c.condicao = e => { const p = c.prog(e); return p[0] >= p[1]; }; });

const _filaConq = [];
let _mostrandoConq = false;
function mostrarConquista(conquista) {
    _filaConq.push(conquista);
    if (!_mostrandoConq) _proximaConq();
}
function _proximaConq() {
    const conquista = _filaConq.shift();
    if (!conquista) { _mostrandoConq = false; return; }
    _mostrandoConq = true;
    const t = TIERS[conquista.tier || 1];
    const popup = document.createElement('div');
    popup.className = 'conquista-popup';
    popup.setAttribute('role', 'status');
    popup.innerHTML = `
        <span class="conquista-emoji-grande">${conquista.emoji}</span>
        <div>
            <strong>Conquista desbloqueada!</strong>
            <strong>${conquista.nome} ${t[1]}</strong>
            <p>${conquista.desc}</p>
        </div>`;
    document.body.appendChild(popup);
    requestAnimationFrame(() => popup.classList.add('visivel'));
    if (typeof confetti !== "undefined") {
        confetti({ particleCount: 140, spread: 100, origin: { y: 0.5 } });
    }
    tocarSom('acerto');
    setTimeout(() => tocarSom('acerto'), 250);
    setTimeout(() => {
        popup.classList.remove('visivel');
        setTimeout(() => { popup.remove(); _proximaConq(); }, 450);
    }, 3600);
}

function checarConquistas() {
    estadoAtual.conquistas = estadoAtual.conquistas || [];
    const ex = (estadoAtual.extras = estadoAtual.extras || {});
    ex.datasConquistas = ex.datasConquistas || {};
    let mudou = true, voltas = 0;
    while (mudou && voltas++ < 5) { // repete: conquistas da coleção dependem das outras
        mudou = false;
        CONQUISTAS.forEach(c => {
            if (!estadoAtual.conquistas.includes(c.id) && c.condicao(estadoAtual)) {
                estadoAtual.conquistas.push(c.id);
                ex.datasConquistas[c.id] = Date.now();
                mostrarConquista(c);
                mudou = true;
            }
        });
    }
    salvarProgresso();
}

let _filtroConq = 'todas';
function filtrarConquistas(f) { _filtroConq = f; renderConquistas(); }
function _dataBR(ms) { const d = new Date(ms); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0'); }

function renderConquistas() {
    const lista = document.getElementById('conquistas-lista');
    if (!lista) return;
    const desbloqueadas = estadoAtual.conquistas || [];
    const datas = ((estadoAtual.extras || {}).datasConquistas) || {};
    const total = CONQUISTAS.length, pctGeral = Math.round(desbloqueadas.length / total * 100);
    // próximas: as não conquistadas mais adiantadas
    const proximas = CONQUISTAS.filter(c => !desbloqueadas.includes(c.id)).map(c => { const p = c.prog(estadoAtual); return { c, p, pct: Math.min(p[0], p[1]) / p[1] }; })
        .filter(x => x.pct > 0).sort((a, b) => b.pct - a.pct).slice(0, 3);
    let html = `<div class="conq-resumo"><div class="conq-resumo-topo"><strong>${desbloqueadas.length} de ${total}</strong><span>${pctGeral}%</span></div>
        <div class="conquista-prog conq-geral"><i style="width:${pctGeral}%"></i></div></div>`;
    if (proximas.length && _filtroConq !== 'feitas') {
        html += `<h4 class="conquista-cat">🎯 Quase lá!</h4>` + proximas.map(x => `<div class="conquista-item bloqueada quase tier-${x.c.tier || 1}">
            <span class="conquista-emoji">${x.c.emoji}</span><div class="conquista-texto"><strong>${x.c.nome}</strong><p>${x.c.desc}</p>
            <div class="conquista-prog"><i style="width:${Math.round(x.pct * 100)}%"></i></div><small>${Math.min(x.p[0], x.p[1])}/${x.p[1]}</small></div></div>`).join('');
    }
    html += `<div class="conq-filtros" role="tablist">${[['todas', 'Todas'], ['faltam', 'Faltam'], ['feitas', 'Conquistadas']].map(([k, n]) =>
        `<button type="button" class="conq-filtro ${_filtroConq === k ? 'ativo' : ''}" onclick="filtrarConquistas('${k}')">${n}</button>`).join('')}</div>`;
    CONQUISTAS_CATEGORIAS.forEach(cat => {
        const todos = CONQUISTAS.filter(c => c.cat === cat.id);
        if (!todos.length) return;
        const feitas = todos.filter(c => desbloqueadas.includes(c.id)).length;
        let itens = todos.slice();
        if (_filtroConq === 'faltam') itens = itens.filter(c => !desbloqueadas.includes(c.id));
        if (_filtroConq === 'feitas') itens = itens.filter(c => desbloqueadas.includes(c.id));
        if (!itens.length) return;
        itens.sort((a, b) => a.prog({})[1] - b.prog({})[1]);
        html += `<h4 class="conquista-cat">${cat.nome} <span>${feitas}/${todos.length}</span></h4>`;
        html += itens.map(c => {
            const ok = desbloqueadas.includes(c.id);
            const p = c.prog(estadoAtual);
            const atual = Math.min(p[0], p[1]);
            const pct = Math.round((atual / p[1]) * 100);
            const t = TIERS[c.tier || 1];
            return `<div class="conquista-item ${ok ? 'desbloqueada' : 'bloqueada'} tier-${c.tier || 1}">
                <span class="conquista-emoji">${ok ? c.emoji : '🔒'}</span>
                <div class="conquista-texto"><strong>${c.nome}</strong> <span class="conq-tier" title="${t[0]}">${t[1]}</span><p>${c.desc}</p>
                ${ok ? (datas[c.id] ? `<small>✅ Conquistada em ${_dataBR(datas[c.id])}</small>` : '<small>✅ Conquistada</small>') : `<div class="conquista-prog" aria-label="${atual} de ${p[1]}"><i style="width:${pct}%"></i></div><small>${atual}/${p[1]}</small>`}
                </div>
            </div>`;
        }).join('');
    });
    lista.innerHTML = html;
    const contador = document.getElementById('conquistas-contador');
    if (contador) contador.innerText = `(${desbloqueadas.length}/${CONQUISTAS.length})`;
}

function toggleConquistasPanel(event) {
    if (event) event.stopPropagation();
    renderConquistas();
    const painel = document.getElementById('conquistas-player');
    if (painel) painel.classList.toggle('collapsed');
}

let somAtivo = true;
let audioContext = null;

function iniciarAudio() {
    if (audioContext) return;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        function criarSom(frequencia, duracao) {
            return function() {
                if (!somAtivo || !audioContext) return;
                const agora = audioContext.currentTime;
                const osc = audioContext.createOscillator();
                const gain = audioContext.createGain();
                osc.type = 'sine';
                osc.frequency.value = frequencia;
                gain.gain.setValueAtTime(0.2, agora);
                gain.gain.exponentialRampToValueAtTime(0.0001, agora + duracao);
                osc.connect(gain);
                gain.connect(audioContext.destination);
                osc.start();
                osc.stop(agora + duracao);
            };
        }
        window.somAcerto = function() { criarSom(523.25, 0.3)(); setTimeout(() => criarSom(659.25, 0.3)(), 150); };
        window.somErro = criarSom(220, 0.4);
    } catch(e) { console.log("Áudio não suportado"); }
}

function tocarSom(tipo) {
    if (!somAtivo) return;
    if (!audioContext) iniciarAudio();
    if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    if (tipo === 'acerto' && window.somAcerto) window.somAcerto();
    else if (tipo === 'erro' && window.somErro) window.somErro();
}

function toggleSom() {
    somAtivo = !somAtivo;
    const btn = document.getElementById('btn-silenciar');
    if (btn) {
        btn.innerHTML = somAtivo ? "🔊 Sons Ativados" : "🔇 Sons Desligados";
        btn.style.background = somAtivo ? "var(--bg-hover)" : "#ff6b6b";
    }
}

function toggleContraste() {
    document.body.classList.toggle('modo-conforto');
    const btn = document.getElementById('btn-contraste');
    if (btn) btn.innerHTML = document.body.classList.contains('modo-conforto') ? "☀️ Modo Normal" : "🌙 Modo Conforto";
    localStorage.setItem('modoConforto', document.body.classList.contains('modo-conforto'));
}

if (localStorage.getItem('modoConforto') === 'true') document.body.classList.add('modo-conforto');

function reiniciarJogoAtual() {
    const nomeJogo = document.getElementById('category-name')?.innerText.replace("Jogo: ", "");
    if (nomeJogo && nomeJogo !== "Jogo") { carregarJogo(nomeJogo); mostrarMensagem("🔄 Jogo reiniciado!", true); }
}

// (Os jogos de Palavras, Matemática e Ciências agora ficam em jogos-base.js, jogos-dados.js e jogos.js)

// ================= PERSONALIZAÇÃO =================
let userPreferences = { theme: 'light', fontSize: 'media', spacing: 'normal' };
function loadUserPreferences() {
    const saved = localStorage.getItem('educatea_preferences');
    if (saved) {
        userPreferences = JSON.parse(saved);
        applyTheme(userPreferences.theme);
        applyFontSize(userPreferences.fontSize);
        applySpacing(userPreferences.spacing);
    }
}
function saveUserPreferences() { localStorage.setItem('educatea_preferences', JSON.stringify(userPreferences)); }
// Temas para daltônicos: prot- (protanopia), deut- (deuteranopia), trit- (tritanopia)
const TEMAS_DALTONICOS_PREFIXOS = ['prot-', 'deut-', 'trit-'];
function ehTemaDaltonico(theme) {
    return TEMAS_DALTONICOS_PREFIXOS.some(p => String(theme).startsWith(p));
}
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    userPreferences.theme = theme;
    saveUserPreferences();
    document.querySelectorAll('.btn-tema[data-tema]').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tema') === theme);
    });
    const btnDalt = document.getElementById('btn-abrir-daltonismo');
    if (btnDalt) btnDalt.classList.toggle('active', ehTemaDaltonico(theme));
}
function applyFontSize(size) {
    document.body.classList.remove('fonte-pequena', 'fonte-media', 'fonte-grande');
    document.body.classList.add(`fonte-${size}`);
    userPreferences.fontSize = size;
    saveUserPreferences();
    document.querySelectorAll('.btn-fonte').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tamanho') === size);
    });
}
function applySpacing(spacing) {
    document.body.classList.remove('espacamento-confortavel');
    if (spacing === 'comfortable') document.body.classList.add('espacamento-confortavel');
    userPreferences.spacing = spacing;
    saveUserPreferences();
    document.querySelectorAll('.btn-espacamento').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-espacamento') === spacing);
    });
}
function togglePersonalizacao() {
    const menu = document.getElementById('personalizacao-menu');
    const dalt = document.getElementById('daltonismo-menu');
    const algumAberto = menu.classList.contains('active') || (dalt && dalt.classList.contains('active'));
    if (algumAberto) {
        menu.classList.remove('active');
        if (dalt) dalt.classList.remove('active');
    } else {
        menu.classList.add('active');
    }
}
// Abre o painel de temas para daltônicos no lugar do painel de temas (mesmo tamanho)
function abrirTemasDaltonismo() {
    const menu = document.getElementById('personalizacao-menu');
    const dalt = document.getElementById('daltonismo-menu');
    if (!menu || !dalt) return;
    const altura = menu.offsetHeight;
    if (altura > 0 && window.innerWidth > 768) {
        dalt.style.height = altura + 'px';
    } else {
        dalt.style.height = '';
    }
    menu.classList.remove('active');
    dalt.classList.add('active');
    dalt.scrollTop = 0;
}
function fecharTemasDaltonismo() {
    const menu = document.getElementById('personalizacao-menu');
    const dalt = document.getElementById('daltonismo-menu');
    if (dalt) dalt.classList.remove('active');
    if (menu) menu.classList.add('active');
}
function resetPreferences() {
    applyTheme('light');
    applyFontSize('media');
    applySpacing('normal');
    mostrarMensagem("✅ Configurações restauradas!", true);
}

// ================= MÚSICA =================
const playlistLocal = [
    { icon: "🎹", titulo: "Piano Waltz", subtitulo: "Suave", path: "musicas/musica1.mp3", tipo: "arquivo" },
    { icon: "🌾", titulo: "Country Craft", subtitulo: "Foco", path: "musicas/musica2.mp3", tipo: "arquivo" },
    { icon: "🍃", titulo: "Deep in the Dell", subtitulo: "Calmaria", path: "musicas/musica3.mp3", tipo: "arquivo" },
    { icon: "🌼", titulo: "Village in Spring", subtitulo: "Alegria", path: "musicas/musica4.mp3", tipo: "arquivo" },
    { icon: "🎼", titulo: "Piano Sereno", subtitulo: "Ambiente Gerado", tipo: "gerada", gerador: "piano" },
    { icon: "✨", titulo: "Espaço Calmo", subtitulo: "Ambiente Gerado", tipo: "gerada", gerador: "espaco" },
    { icon: "🌧️", titulo: "Chuva Suave", subtitulo: "Ambiente Gerado", tipo: "gerada", gerador: "chuva" },
    { icon: "🌊", titulo: "Ondas do Mar", subtitulo: "Ambiente Gerado", tipo: "gerada", gerador: "mar" }
];

// ---- Motor de música ambiente gerada (Web Audio API) ----
// Cria trilhas relaxantes sem precisar de arquivos externos, usando osciladores
// (acordes suaves) e ruído filtrado (chuva/ondas), pensadas para ambientes calmos.
let generatedNodes = [];
let generatedTimer = null;
let isGeneratedPlaying = false;
let localVolumeFactor = 0.5;

const PROGRESSOES_GERADAS = {
    piano: {
        acordes: [
            [261.63, 329.63, 392.00], [293.66, 349.23, 440.00],
            [220.00, 261.63, 329.63], [246.94, 293.66, 392.00]
        ],
        duracao: 4.5, onda: 'triangle', volumeBase: 0.09
    },
    espaco: {
        acordes: [
            [130.81, 196.00, 261.63], [146.83, 220.00, 293.66],
            [164.81, 246.94, 329.63], [130.81, 196.00, 246.94]
        ],
        duracao: 7, onda: 'sine', volumeBase: 0.07
    }
};

function pararGerador() {
    isGeneratedPlaying = false;
    if (generatedTimer) { clearTimeout(generatedTimer); generatedTimer = null; }
    generatedNodes.forEach(n => {
        try { n.stop && n.stop(); } catch(e) {}
        try { n.disconnect && n.disconnect(); } catch(e) {}
    });
    generatedNodes = [];
}

function tocarAcordeGerado(freqs, duracao, onda, volume) {
    if (!audioContext) return;
    const ctx = audioContext;
    freqs.forEach(freq => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = onda;
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + duracao * 0.3);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duracao);
        osc.connect(gain).connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + duracao + 0.1);
        generatedNodes.push(osc, gain);
    });
}

function iniciarProgressaoGerada(nomeConfig) {
    const cfg = PROGRESSOES_GERADAS[nomeConfig];
    if (!cfg || !audioContext) return;
    let indice = 0;
    function passo() {
        if (!isGeneratedPlaying) return;
        tocarAcordeGerado(cfg.acordes[indice % cfg.acordes.length], cfg.duracao, cfg.onda, cfg.volumeBase * (localVolumeFactor * 2));
        indice++;
        generatedTimer = setTimeout(passo, cfg.duracao * 1000 * 0.85);
    }
    passo();
}

function iniciarRuidoGerado(freqBase, modoOndas) {
    if (!audioContext) return;
    const ctx = audioContext;
    const bufferSize = 2 * ctx.sampleRate;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    noise.loop = true;
    const filtro = ctx.createBiquadFilter();
    filtro.type = 'lowpass';
    filtro.frequency.value = freqBase;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    noise.connect(filtro).connect(gain).connect(ctx.destination);
    noise.start();
    gain.gain.linearRampToValueAtTime(0.22 * (localVolumeFactor * 2), ctx.currentTime + 2);
    generatedNodes.push(noise, filtro, gain);

    if (modoOndas) {
        let subindo = true;
        function ondular() {
            if (!isGeneratedPlaying) return;
            const alvo = subindo ? freqBase * 1.7 : freqBase * 0.6;
            filtro.frequency.linearRampToValueAtTime(alvo, ctx.currentTime + 3.5);
            subindo = !subindo;
            generatedTimer = setTimeout(ondular, 3500);
        }
        ondular();
    }
}

function iniciarGerador(tipo) {
    pararGerador();
    if (!audioContext) iniciarAudio();
    if (audioContext && audioContext.state === 'suspended') audioContext.resume();
    isGeneratedPlaying = true;
    if (tipo === 'chuva') iniciarRuidoGerado(1100, false);
    else if (tipo === 'mar') iniciarRuidoGerado(500, true);
    else iniciarProgressaoGerada(tipo);
}

let localAudio = null;
let currentTrackIndexLocal = 0;
let isLocalPlaying = false;

function initLocalAudio() {
    if (!localAudio) {
        localAudio = new Audio();
        localAudio.volume = 0.5;
        localAudio.addEventListener('ended', nextLocalMusic);
        localAudio.addEventListener('error', (e) => {
            console.error("Erro ao carregar música:", e);
        });
    }
}

function popularSeletorPlaylist() {
    const lista = document.getElementById('playlist-lista');
    if (!lista) return;
    lista.innerHTML = playlistLocal.map((faixa, index) => `
        <button type="button" class="music-track-item" data-index="${index}" onclick="selecionarFaixa(${index}, true)">
            <span class="music-track-icone">${faixa.icon}</span>
            <span class="music-track-info">
                <span class="music-track-titulo">${faixa.titulo}</span>
                <span class="music-track-subtitulo">${faixa.subtitulo}</span>
            </span>
            <span class="music-track-play">▶</span>
        </button>
    `).join('');
}

function atualizarPlaylistVisual() {
    document.querySelectorAll('.music-track-item').forEach(item => {
        const idx = parseInt(item.getAttribute('data-index'), 10);
        item.classList.toggle('ativo', idx === currentTrackIndexLocal);
        const playIcon = item.querySelector('.music-track-play');
        if (playIcon) playIcon.innerText = (idx === currentTrackIndexLocal && isLocalPlaying) ? '⏸' : '▶';
    });
}

function selecionarFaixa(index, autoPlay = false) {
    currentTrackIndexLocal = parseInt(index, 10) || 0;
    loadLocalTrack(currentTrackIndexLocal);
    if (autoPlay || isLocalPlaying) playLocalMusic();
}

function loadLocalTrack(index) {
    if (!playlistLocal.length) return;
    pararGerador();
    if (!localAudio) initLocalAudio();
    localAudio.pause();
    const track = playlistLocal[index];
    if (!track) return;
    if (track.tipo === 'arquivo') {
        localAudio.src = track.path;
        localAudio.load();
    } else {
        localAudio.removeAttribute('src');
    }
    const musicNameElement = document.getElementById('current-music-name');
    if (musicNameElement) musicNameElement.innerText = `${track.icon} ${track.titulo} - ${track.subtitulo}`;
    atualizarPlaylistVisual();
}

function playLocalMusic() {
    if (!playlistLocal.length) return;
    initLocalAudio();
    const track = playlistLocal[currentTrackIndexLocal];
    if (!track) return;
    if (track.tipo === 'arquivo') {
        if (!localAudio.src) loadLocalTrack(currentTrackIndexLocal);
        localAudio.play().catch(e => console.log("Erro ao tocar:", e));
    } else {
        localAudio.pause();
        iniciarGerador(track.gerador);
    }
    isLocalPlaying = true;
    atualizarPlaylistVisual();
}

function pauseLocalMusic() {
    if (localAudio) localAudio.pause();
    pararGerador();
    isLocalPlaying = false;
    atualizarPlaylistVisual();
}

function stopLocalMusic() {
    if (localAudio) { localAudio.pause(); localAudio.currentTime = 0; }
    pararGerador();
    isLocalPlaying = false;
    atualizarPlaylistVisual();
}

function nextLocalMusic() {
    if (!playlistLocal.length) return;
    currentTrackIndexLocal = (currentTrackIndexLocal + 1) % playlistLocal.length;
    loadLocalTrack(currentTrackIndexLocal);
    if (isLocalPlaying) playLocalMusic();
}

function prevLocalMusic() {
    if (!playlistLocal.length) return;
    currentTrackIndexLocal = (currentTrackIndexLocal - 1 + playlistLocal.length) % playlistLocal.length;
    loadLocalTrack(currentTrackIndexLocal);
    if (isLocalPlaying) playLocalMusic();
}

function setLocalVolume(value) {
    localVolumeFactor = value / 100;
    if (localAudio) localAudio.volume = localVolumeFactor;
    generatedNodes.forEach(n => {
        if (n instanceof GainNode) {
            try { n.gain.linearRampToValueAtTime(n.gain.value > 0 ? localVolumeFactor * 0.4 : 0, audioContext.currentTime + 0.3); } catch(e) {}
        }
    });
}

function toggleMusicPlayer(event) {
    if (event) event.stopPropagation();
    const player = document.getElementById('music-player');
    if (player) player.classList.toggle('collapsed');
}

// ================= CARROSSEL =================
// Carrossel infinito: dois grupos idênticos lado a lado; a animação anda 50% (um grupo)
// e recomeça sem "pulo". Cada grupo repete as imagens até ser mais largo que a tela,
// então funciona com qualquer quantidade de apoiadores (mesmo só 1 ou 2).
const CARROSSEL_IMAGENS = [
    "imagens/logo_ifms-removebg-preview.png",
    "imagens/image-removebg-preview.png"
];
const CARROSSEL_ITEM_LARGURA = 180;   // igual a .carousel-img no CSS
const CARROSSEL_ESPACO = 40;          // igual ao gap de .carousel-group no CSS
const CARROSSEL_VELOCIDADE = 60;      // pixels por segundo

function initCarrossel() {
    const track = document.getElementById('carousel-track');
    const janela = track ? track.parentElement : null;
    if (!track || !janela) return;

    const larguraJanela = janela.clientWidth || window.innerWidth;
    const larguraItem = CARROSSEL_ITEM_LARGURA + CARROSSEL_ESPACO;
    // quantas imagens cabem para o grupo ser maior que a janela (e ter um múltiplo da lista)
    const minimo = Math.ceil(larguraJanela / larguraItem) + 1;
    const repeticoes = Math.max(1, Math.ceil(minimo / CARROSSEL_IMAGENS.length));

    let itens = '';
    for (let r = 0; r < repeticoes; r++) {
        CARROSSEL_IMAGENS.forEach(src => {
            itens += `<img src="${src}" alt="Apoiador" class="carousel-img" draggable="false"
                          onerror="this.style.display='none'; console.error('Imagem não encontrada:', this.src)">`;
        });
    }
    const grupo = `<div class="carousel-group">${itens}</div>`;
    track.innerHTML = grupo + grupo.replace('<div class="carousel-group">', '<div class="carousel-group" aria-hidden="true">');

    // velocidade constante, não importa quantas imagens tenha
    const larguraGrupo = repeticoes * CARROSSEL_IMAGENS.length * larguraItem;
    track.style.animationDuration = Math.max(10, larguraGrupo / CARROSSEL_VELOCIDADE) + 's';
}

let carrosselResizeTimer;
window.addEventListener('resize', () => {
    clearTimeout(carrosselResizeTimer);
    carrosselResizeTimer = setTimeout(initCarrossel, 250);
});

// ================= INICIALIZAÇÃO =================
document.addEventListener('DOMContentLoaded', () => {
    iniciarAudio();
    loadUserPreferences();
    initCarrossel();
    popularSeletorPlaylist();
    if (playlistLocal.length) loadLocalTrack(0);
    carregarProgresso();
    renderConquistas();
    if (!estadoAtual.pontuacaoTotal) estadoAtual.pontuacaoTotal = 0;
    if (!estadoAtual.nivelAtual) estadoAtual.nivelAtual = 1;
    
    const resetBtn = document.querySelector('.btn-reset-progresso');
    if (resetBtn) resetBtn.onclick = resetarProgresso;

    // Se a tela crescer para tamanho de desktop com o menu aberto, fecha a gaveta
    window.addEventListener('resize', () => {
        if (window.innerWidth > 900) closeSidebar();
    });

    // Em telas pequenas, o player de música começa recolhido para não ocupar espaço
    if (window.innerWidth <= 480) {
        const player = document.getElementById('music-player');
        if (player) player.classList.add('collapsed');
    }

    console.log("✅ Sistema carregado com sucesso!");
    console.log("📊 Sistema anti-repetição ativo para todos os jogos!");
});
