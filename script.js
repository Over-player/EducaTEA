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

function registrarAcerto(jogoNome, tipoAcerto = 'ACERTO_SIMPLES', bonusAdicional = 0) {
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

    let pontosGanhos = Math.floor((configJogo.base + pontosBase) * multiplicador) + bonusAdicional + bonusCombo;

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

function salvarProgresso() {
    const progresso = {
        nivel: estadoAtual.nivelAtual || 1,
        pontuacaoTotal: estadoAtual.pontuacaoTotal || 0,
        historicoPerguntas: estadoAtual.historicoPerguntas,
        melhorStreak: estadoAtual.melhorStreak || 0,
        totalAcertos: estadoAtual.totalAcertos || 0,
        conquistas: estadoAtual.conquistas || [],
        estatisticasJogos: estadoAtual.estatisticasJogos || {},
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
function navigateHome() {
    document.querySelectorAll('.sub-menu').forEach(sub => sub.classList.remove('open'));
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active', 'open'));
    const primeiroItem = document.querySelector('.nav-item');
    if (primeiroItem) primeiroItem.classList.add('active');
    document.getElementById('home-section').classList.add('active');
    document.getElementById('games-section').classList.remove('active');
    if (window.innerWidth <= 900) closeSidebar();
}

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

    document.getElementById('home-section').classList.remove('active');
    document.getElementById('games-section').classList.add('active');
    document.getElementById('category-name').innerText = "Jogo: " + nomeJogo;
    if (window.innerWidth <= 900) closeSidebar();

    if (bancoMatematica[nomeJogo]) { iniciarMatematica(nomeJogo); return; }
    if (bancoCiencias[nomeJogo]) { iniciarCiencias(nomeJogo); return; }

    if (nomeJogo === "Monte a Palavra") telaConfigMonte();
    else if (nomeJogo === "Caça-Palavras") telaCacaPalavras();
    else if (nomeJogo === "Sílabas Mágicas") telaSilabasMagicas();
    else if (nomeJogo === "Ditado Visual") telaDitadoVisual();
    else if (nomeJogo === "Rima Maluca") telaRimaMaluca();
    else if (nomeJogo === "Qual é a Letra?") telaQualLetra();
    else if (nomeJogo === "Memória de Palavras") telaMemoriaPalavras();
    else if (nomeJogo === "Palavra Oculta") telaPalavraOculta();
    else if (nomeJogo === "Sombras Mágicas") telaSombrasMagicas();
    else if (nomeJogo === "Classificação de Cores") telaClassificacaoCores();
    else if (nomeJogo === "Contagem de Objetos") telaContagemObjetos();
    else if (nomeJogo === "Emoções") telaEmocoes();
    else if (nomeJogo === "Minha Rotina") telaMinhaRotina();
    else if (nomeJogo === "Cuidado com o Ambiente") telaCuidadoAmbiente();
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
const CONQUISTAS = [
    { id: 'primeiro_acerto', nome: 'Primeiro Passo', emoji: '🥇', desc: 'Você acertou sua primeira pergunta!', condicao: e => (e.totalAcertos || 0) >= 1 },
    { id: 'streak_5', nome: 'Sequência de Ouro', emoji: '🔥', desc: '5 acertos seguidos em um jogo!', condicao: e => (e.melhorStreak || 0) >= 5 },
    { id: 'streak_10', nome: 'Imparável', emoji: '⚡', desc: '10 acertos seguidos em um jogo!', condicao: e => (e.melhorStreak || 0) >= 10 },
    { id: 'nivel_3', nome: 'Aprendiz Dedicado', emoji: '🌱', desc: 'Alcançou o Nível 3!', condicao: e => (e.nivelAtual || 1) >= 3 },
    { id: 'nivel_5', nome: 'Explorador', emoji: '🧭', desc: 'Alcançou o Nível 5!', condicao: e => (e.nivelAtual || 1) >= 5 },
    { id: 'nivel_10', nome: 'Mestre do Saber', emoji: '👑', desc: 'Alcançou o Nível 10!', condicao: e => (e.nivelAtual || 1) >= 10 },
    { id: 'pontos_250', nome: 'Juntando Estrelas', emoji: '⭐', desc: 'Acumulou 250 pontos!', condicao: e => (e.pontuacaoTotal || 0) >= 250 },
    { id: 'pontos_500', nome: 'Colecionador de Estrelas', emoji: '🌟', desc: 'Acumulou 500 pontos!', condicao: e => (e.pontuacaoTotal || 0) >= 500 },
    { id: 'pontos_1000', nome: 'Lenda do EducaTEA', emoji: '🏆', desc: 'Acumulou 1000 pontos!', condicao: e => (e.pontuacaoTotal || 0) >= 1000 },
    { id: 'jogos_variados', nome: 'Curioso', emoji: '🎲', desc: 'Jogou 5 jogos diferentes!', condicao: e => Object.keys(e.estatisticasJogos || {}).length >= 5 },
    { id: 'jogos_todos', nome: 'Explorador Completo', emoji: '🗺️', desc: 'Experimentou 10 jogos diferentes!', condicao: e => Object.keys(e.estatisticasJogos || {}).length >= 10 }
];

function mostrarConquista(conquista) {
    const popup = document.createElement('div');
    popup.className = 'conquista-popup';
    popup.innerHTML = `
        <span class="conquista-emoji-grande">${conquista.emoji}</span>
        <div>
            <strong>Conquista desbloqueada!</strong>
            <strong>${conquista.nome}</strong>
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
        setTimeout(() => popup.remove(), 500);
    }, 4200);
}

function checarConquistas() {
    estadoAtual.conquistas = estadoAtual.conquistas || [];
    CONQUISTAS.forEach(c => {
        if (!estadoAtual.conquistas.includes(c.id) && c.condicao(estadoAtual)) {
            estadoAtual.conquistas.push(c.id);
            mostrarConquista(c);
        }
    });
    salvarProgresso();
}

function renderConquistas() {
    const lista = document.getElementById('conquistas-lista');
    if (!lista) return;
    const desbloqueadas = estadoAtual.conquistas || [];
    lista.innerHTML = CONQUISTAS.map(c => {
        const ok = desbloqueadas.includes(c.id);
        return `<div class="conquista-item ${ok ? 'desbloqueada' : 'bloqueada'}">
            <span class="conquista-emoji">${ok ? c.emoji : '🔒'}</span>
            <div><strong>${c.nome}</strong><p>${c.desc}</p></div>
        </div>`;
    }).join('');
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

// ================= JOGOS DE MATEMÁTICA (COM SISTEMA ANTI-REPETIÇÃO) =================
function iniciarMatematica(tipo) {
    mathOpcaoSelecionada = null;
    const lista = bancoMatematica[tipo];
    if (!lista || lista.length === 0) { mostrarMensagem(`Nenhum dado disponível para "${tipo}".`, false); return; }
    
    // Usa o sistema anti-repetição
    const item = getProximaPergunta(tipo, lista);
    mathRespostaCorreta = item.resposta;

    let areaInteracao = "";
    if (item.opcoes && item.opcoes.length > 0) {
        areaInteracao = `<div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
            ${item.opcoes.map((opt, idx) => `<button class="btn-opcao-math" data-valor="${opt}" style="padding: 15px 25px; font-size: 1.5rem; cursor: pointer; background: var(--bg-hover); color: var(--accent-color); border: 2px solid var(--accent-color); border-radius: 10px; font-weight: bold;">${opt}</button>`).join('')}
        </div><input type="hidden" id="input-math">`;
    } else {
        areaInteracao = `<div style="margin-top: 20px;"><input type="number" id="input-math" placeholder="?" style="width: 120px; font-size: 2.5rem; text-align: center; border-radius: 10px; border: 3px solid var(--accent-color); background: var(--bg-card); color: var(--text-primary); padding: 10px;"></div>`;
    }

    // Mostra quantas perguntas faltam
    const historico = estadoAtual.historicoPerguntas[tipo] || [];
    const restantes = lista.length - historico.length;
    const progressoTexto = restantes > 0 ? `📊 Faltam ${restantes} perguntas para completar o ciclo!` : `🎉 Você já respondeu todas! Recomeçando!`;

    document.getElementById('games-container').innerHTML = `
        <div class="jogo-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-color); margin-bottom: 0;">${tipo}</h2>
                <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                    ${progressoTexto}
                </div>
            </div>
            <div style="background: var(--bg-hover); padding: 30px; border-radius: 20px; margin-bottom: 25px;">
                <p style="font-size: 1.4rem; margin-bottom: 15px;">${item.pergunta}</p>
                <div style="font-size: 3.5rem; line-height: 1.2; color: var(--accent-color);">${item.visual || ''}</div>
            </div>
            ${areaInteracao}
            <div style="margin-top: 40px;">
                <button class="btn-verificar" onclick="verificarRespostaMatematica('${tipo}')">✅ VERIFICAR RESPOSTA</button>
                <br><button class="btn-voltar" onclick="iniciarMatematica('${tipo}')" style="margin-top: 15px;">🔄 Próximo desafio</button>
            </div>
        </div>`;

    if (item.opcoes && item.opcoes.length > 0) {
        setTimeout(() => {
            document.querySelectorAll('.btn-opcao-math').forEach(btn => {
                btn.onclick = function () {
                    document.querySelectorAll('.btn-opcao-math').forEach(b => { b.style.background = "var(--bg-hover)"; b.style.color = "var(--accent-color)"; });
                    this.style.background = "var(--accent-color)"; this.style.color = "white";
                    const inputMath = document.getElementById('input-math');
                    if (inputMath) inputMath.value = this.getAttribute('data-valor');
                    mathOpcaoSelecionada = this.getAttribute('data-valor');
                };
            });
        }, 100);
    }
}

function verificarRespostaMatematica(tipo) {
    const input = document.getElementById('input-math');
    let respostaDada = input ? input.value : mathOpcaoSelecionada;
    if (!respostaDada && respostaDada !== 0) { mostrarMensagem("Escolha ou digite uma resposta primeiro!", false); return; }
    if (!isNaN(respostaDada) && respostaDada !== "") respostaDada = parseFloat(respostaDada);
    if (respostaDada == mathRespostaCorreta) {
        registrarAcerto(tipo, "ACERTO_DIFICIL", 0);
        salvarProgresso(); // Salva o histórico atualizado
        setTimeout(() => { iniciarMatematica(tipo); }, 1500);
    } else { mostrarMensagem(`💡 A resposta correta é ${mathRespostaCorreta}.`, false); }
}

// ================= JOGOS DE CIÊNCIAS (COM SISTEMA ANTI-REPETIÇÃO) =================
function iniciarCiencias(tipo) {
    cienciaOpcaoSelecionada = null;
    const lista = bancoCiencias[tipo];
    if (!lista || lista.length === 0) { mostrarMensagem(`Nenhum dado disponível para "${tipo}".`, false); return; }
    
    // Usa o sistema anti-repetição
    const item = getProximaPergunta(tipo, lista);
    cienciaRespostaCorreta = item.resposta;

    let areaInteracao = "";
    if (item.opcoes && item.opcoes.length > 0) {
        areaInteracao = `<div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-top: 20px;">
            ${item.opcoes.map((opt, idx) => `<button class="btn-opcao-ciencia" data-valor="${opt}" style="padding: 15px 25px; font-size: 1.3rem; cursor: pointer; background: var(--bg-hover); color: var(--accent-color); border: 2px solid var(--accent-color); border-radius: 10px; font-weight: bold;">${opt}</button>`).join('')}
        </div><input type="hidden" id="input-ciencia">`;
    } else {
        areaInteracao = `<div style="margin-top: 20px;"><input type="text" id="input-ciencia" placeholder="?" style="width: 200px; font-size: 1.5rem; text-align: center; border-radius: 10px; border: 3px solid var(--accent-color); background: var(--bg-card); color: var(--text-primary); padding: 10px;"></div>`;
    }

    const historico = estadoAtual.historicoPerguntas[tipo] || [];
    const restantes = lista.length - historico.length;
    const progressoTexto = restantes > 0 ? `📊 Faltam ${restantes} perguntas para completar o ciclo!` : `🎉 Você já respondeu todas! Recomeçando!`;

    document.getElementById('games-container').innerHTML = `
        <div class="jogo-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-color); margin-bottom: 0;">${tipo}</h2>
                <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                    ${progressoTexto}
                </div>
            </div>
            <div style="background: var(--bg-hover); padding: 30px; border-radius: 20px; margin-bottom: 25px;">
                <div style="font-size: 4rem; margin-bottom: 15px;">${item.visual || '🔬'}</div>
                <p style="font-size: 1.4rem;">${item.pergunta}</p>
            </div>
            ${areaInteracao}
            <div style="margin-top: 40px;">
                <button class="btn-verificar" onclick="verificarRespostaCiencia('${tipo}')">✅ VERIFICAR RESPOSTA</button>
                <br><button class="btn-voltar" onclick="iniciarCiencias('${tipo}')" style="margin-top: 15px;">🔄 Próximo desafio</button>
            </div>
        </div>`;

    if (item.opcoes && item.opcoes.length > 0) {
        setTimeout(() => {
            document.querySelectorAll('.btn-opcao-ciencia').forEach(btn => {
                btn.onclick = function () {
                    document.querySelectorAll('.btn-opcao-ciencia').forEach(b => { b.style.background = "var(--bg-hover)"; b.style.color = "var(--accent-color)"; });
                    this.style.background = "var(--accent-color)"; this.style.color = "white";
                    const inputCiencia = document.getElementById('input-ciencia');
                    if (inputCiencia) inputCiencia.value = this.getAttribute('data-valor');
                    cienciaOpcaoSelecionada = this.getAttribute('data-valor');
                };
            });
        }, 100);
    }
}

function verificarRespostaCiencia(tipo) {
    const input = document.getElementById('input-ciencia');
    let respostaDada = input ? input.value : cienciaOpcaoSelecionada;
    if (!respostaDada && respostaDada !== 0 && respostaDada !== "") { mostrarMensagem("Escolha ou digite uma resposta primeiro!", false); return; }
    const respostaNormalizada = String(respostaDada).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const respostaCorretaNormalizada = String(cienciaRespostaCorreta).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    if (respostaNormalizada === respostaCorretaNormalizada) {
        registrarAcerto(tipo, "ACERTO_DIFICIL", 0);
        salvarProgresso();
        setTimeout(() => { iniciarCiencias(tipo); }, 1500);
    } else { mostrarMensagem(`💡 A resposta correta é ${cienciaRespostaCorreta}.`, false); }
}

// ================= CAÇA-PALAVRAS =================
const DIREÇÕES = [
    { dr: 0, dc: 1, nome: "horizontal→" },
    { dr: 0, dc: -1, nome: "horizontal←" },
    { dr: 1, dc: 0, nome: "vertical↓" },
    { dr: -1, dc: 0, nome: "vertical↑" },
    { dr: 1, dc: 1, nome: "diagonal ↘" },
    { dr: -1, dc: -1, nome: "diagonal ↖" },
    { dr: 1, dc: -1, nome: "diagonal ↙" },
    { dr: -1, dc: 1, nome: "diagonal ↗" }
];

function posicionarPalavraNoGrid(grid, palavra, tamanho) {
    for (let tentativa = 0; tentativa < 200; tentativa++) {
        const dir = DIREÇÕES[Math.floor(Math.random() * DIREÇÕES.length)];
        const maxRow = (dir.dr === 1) ? tamanho - palavra.length : (dir.dr === -1) ? palavra.length - 1 : tamanho - 1;
        const maxCol = (dir.dc === 1) ? tamanho - palavra.length : (dir.dc === -1) ? palavra.length - 1 : tamanho - 1;
        if (maxRow < 0 || maxCol < 0) continue;

        const row = Math.floor(Math.random() * (maxRow + 1));
        const col = Math.floor(Math.random() * (maxCol + 1));
        
        let valido = true;
        for (let i = 0; i < palavra.length; i++) {
            const r = row + i * dir.dr;
            const c = col + i * dir.dc;
            if (grid[r][c] !== '' && grid[r][c] !== palavra[i]) {
                valido = false;
                break;
            }
        }
        if (valido) {
            for (let i = 0; i < palavra.length; i++) {
                const r = row + i * dir.dr;
                const c = col + i * dir.dc;
                grid[r][c] = palavra[i];
            }
            return true;
        }
    }
    return false;
}

function telaCacaPalavras() {
    const palavrasTema = {
        1: { tema: "🐾 Animais", palavras: ["CACHORRO", "GATO", "PEIXE", "PASSARO", "VACA", "CAVALO", "COELHO", "MACACO", "ELEFANTE", "GIRAFA", "LEAO", "TIGRE", "ZEBRA", "RINOCERONTE", "HIPOPOTAMO"] },
        2: { tema: "🍎 Frutas", palavras: ["BANANA", "MACA", "LARANJA", "UVA", "MAMAO", "ABACAXI", "MORANGO", "PERA", "MELANCIA", "LIMÃO", "GOIABA", "CAJU", "JACA", "CARAMBOLA", "PITANGA"] },
        3: { tema: "📚 Escola", palavras: ["LIVRO", "CADERNO", "LAPIS", "BORRACHA", "MOCHILA", "PROFESSOR", "ALUNO", "QUADRO", "GIZ", "TESOURA", "REGUA", "COMPASSO", "TRANSFERIDOR", "APONTADOR", "COLAGEM"] }
    };
    
    const nivel = Math.min(estadoAtual.nivelAtual, 3);
    const temaAtual = palavrasTema[nivel];
    const palavraBuscar = temaAtual.palavras[Math.floor(Math.random() * temaAtual.palavras.length)];
    
    let gridSize = 10;
    if (nivel === 2) gridSize = 12;
    if (nivel === 3) gridSize = 14;
    
    let grid = Array(gridSize).fill().map(() => Array(gridSize).fill(''));
    posicionarPalavraNoGrid(grid, palavraBuscar, gridSize);
    
    const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (grid[i][j] === '') grid[i][j] = letras[Math.floor(Math.random() * letras.length)];
        }
    }
    
    estadoAtual.jogoCacaAtual = { grid, palavraBuscar, selecionadas: [] };
    
    // 🔧 Cálculo dinâmico do tamanho da célula para caber na tela
    const larguraDisponivel = Math.min(window.innerWidth - 40, 720);
    const espacamento = 4;
    const tamanhoCelula = Math.max(22, Math.floor((larguraDisponivel - (gridSize - 1) * espacamento) / gridSize));
    const tamanhoFonte = Math.max(0.65, Math.min(1.1, tamanhoCelula / 38));
    
    let html = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px;">
            <h2 style="color: var(--accent-color); margin: 0;">🔍 Caça-Palavras</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                <span>⭐ Nível ${nivel}/3</span>
            </div>
        </div>
        <p>Tema: <strong>${temaAtual.tema}</strong></p>
        <p>Encontre a palavra: <strong style="color: var(--accent-color); font-size: 1.3rem; word-break: break-word;">${palavraBuscar}</strong></p>
        <div id="grid-caca" style="
            display: grid;
            grid-template-columns: repeat(${gridSize}, ${tamanhoCelula}px);
            gap: ${espacamento}px;
            justify-content: center;
            margin: 20px auto;
            user-select: none;
            max-width: 100%;
            overflow-x: auto;
            padding: 4px;
        ">`;
    
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            html += `<div class="letra-caca" data-row="${i}" data-col="${j}" style="
                width: ${tamanhoCelula}px;
                height: ${tamanhoCelula}px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: var(--bg-hover);
                border-radius: 6px;
                cursor: pointer;
                font-weight: bold;
                font-size: ${tamanhoFonte}rem;
                flex-shrink: 0;
            ">${grid[i][j]}</div>`;
        }
    }
    html += `</div>
        <div style="margin-top: 20px; text-align: center;">
            <span id="palavra-formando" style="color: var(--accent-color); font-weight: bold; letter-spacing: 2px; word-break: break-all;"></span>
        </div>
        <div style="display: flex; gap: 10px; justify-content: center; margin-top: 20px; flex-wrap: wrap;">
            <button class="btn-verificar" onclick="verificarCacaPalavras()">✅ Verificar</button>
            <button class="btn-voltar" onclick="telaCacaPalavras()">🔄 Nova Palavra</button>
            <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
            <button class="btn-voltar" onclick="limparSelecaoCaca()">🧹 Limpar</button>
        </div>
    </div>`;
    document.getElementById('games-container').innerHTML = html;
    
    let isDragging = false;
    const cells = document.querySelectorAll('.letra-caca');
    
    function atualizarPreview() {
        let palavra = "";
        for (let cell of estadoAtual.jogoCacaAtual.selecionadas) {
            palavra += estadoAtual.jogoCacaAtual.grid[cell.row][cell.col];
        }
        const preview = document.getElementById('palavra-formando');
        if (preview) preview.innerText = palavra || "---";
    }
    
    function limparSelecao() {
        estadoAtual.jogoCacaAtual.selecionadas = [];
        cells.forEach(cell => cell.style.background = "var(--bg-hover)");
        atualizarPreview();
    }
    
    function toggleCelula(cell, isDrag = false) {
        const row = parseInt(cell.dataset.row), col = parseInt(cell.dataset.col);
        const selecionadas = estadoAtual.jogoCacaAtual.selecionadas;
        const index = selecionadas.findIndex(s => s.row === row && s.col === col);
        
        if (index === -1) {
            if (isDrag && selecionadas.length > 0) {
                const ultima = selecionadas[selecionadas.length - 1];
                const diffRow = Math.abs(ultima.row - row);
                const diffCol = Math.abs(ultima.col - col);
                if (diffRow <= 1 && diffCol <= 1 && !(diffRow === 0 && diffCol === 0)) {
                    selecionadas.push({ row, col });
                    cell.style.background = "#2ecc71";
                }
            } else if (!isDrag || selecionadas.length === 0) {
                if (!isDrag) limparSelecao();
                selecionadas.push({ row, col });
                cell.style.background = "#2ecc71";
            }
        }
        atualizarPreview();
    }
    
    cells.forEach(cell => {
        cell.addEventListener('click', () => toggleCelula(cell, false));
        cell.addEventListener('mousedown', (e) => {
            isDragging = true;
            limparSelecao();
            toggleCelula(cell, true);
            e.preventDefault();
        });
        cell.addEventListener('mouseenter', () => {
            if (isDragging) toggleCelula(cell, true);
        });
        
        // 🔧 Suporte a toque no celular/tablet
        cell.addEventListener('touchstart', (e) => {
            isDragging = true;
            limparSelecao();
            toggleCelula(cell, true);
            e.preventDefault();
        }, { passive: false });
        
        cell.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            e.preventDefault();
            const touch = e.touches[0];
            const el = document.elementFromPoint(touch.clientX, touch.clientY);
            if (el && el.classList.contains('letra-caca')) {
                toggleCelula(el, true);
            }
        }, { passive: false });
        
        cell.addEventListener('touchend', () => {
            isDragging = false;
        });
    });
    
    document.addEventListener('mouseup', () => { isDragging = false; });
    window.limparSelecaoCaca = limparSelecao;
}

function verificarCacaPalavras() {
    const selecionadas = estadoAtual.jogoCacaAtual.selecionadas;
    if (selecionadas.length === 0) {
        mostrarMensagem("Selecione as letras arrastando ou clicando nelas.", false);
        return;
    }
    
    let palavraFormada = "";
    for (let cell of selecionadas) palavraFormada += estadoAtual.jogoCacaAtual.grid[cell.row][cell.col];
    const palavraReversa = palavraFormada.split('').reverse().join('');
    const alvo = estadoAtual.jogoCacaAtual.palavraBuscar;
    
    if (palavraFormada === alvo || palavraReversa === alvo) {
        registrarAcerto("Caça-Palavras", "ACERTO_MEDIO", 0);
        setTimeout(() => telaCacaPalavras(), 2000);
    } else {
        mostrarMensagem(`❌ "${palavraFormada}" não é a palavra correta.`, false);
        estadoAtual.jogoCacaAtual.selecionadas = [];
        document.querySelectorAll('.letra-caca').forEach(cell => cell.style.background = "var(--bg-hover)");
        document.getElementById('palavra-formando').innerText = "---";
    }
}

// ================= MONTE A PALAVRA (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaConfigMonte() {
    const palavrasDisponiveis = ["CASA", "BOLA", "GATO", "SOL", "LUA", "FLOR", "CARRO", "AVIÃO", "ESCOLA", "PROFESSOR", "LIVRO", "CADERNO", "BICICLETA", "COMPUTADOR", "CHOCOLATE", "ELEFANTE", "GIRAFA", "MACACO", "BORBOLETA", "TELEVISÃO", "MICROONDAS", "HELICOPTERO", "MELANCIA", "ARQUITETO", "DENTISTA", "VETERINARIO", "BOMBEIRO", "ASTRONAUTA", "PIRATA", "PRINCESA"];
    
    // Usa sistema anti-repetição para palavras
    const jogoNome = "Monte a Palavra";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let palavraEscolhida;
    
    if (historico.length >= palavrasDisponiveis.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        palavraEscolhida = palavrasDisponiveis[Math.floor(Math.random() * palavrasDisponiveis.length)];
        mostrarMensagem("🎉 Parabéns! Você montou todas as palavras! Recomeçando!", true);
    } else {
        const palavrasNaoUsadas = palavrasDisponiveis.filter((_, index) => !historico.includes(index));
        const randomIndex = Math.floor(Math.random() * palavrasNaoUsadas.length);
        palavraEscolhida = palavrasNaoUsadas[randomIndex];
        const indexOriginal = palavrasDisponiveis.findIndex(p => p === palavraEscolhida);
        historico.push(indexOriginal);
    }
    
    document.getElementById('games-container').innerHTML = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-color);">📝 Monte a Palavra</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                📊 ${historico.length}/${palavrasDisponiveis.length} palavras completadas
            </div>
        </div>
        <p>Forme a palavra: <strong style="color: var(--accent-color); font-size: 1.5rem;">${palavraEscolhida}</strong></p>
        <div class="slots-container" id="slots-monte" style="display: flex; gap: 10px; justify-content: center; min-height: 80px; margin: 20px; flex-wrap: wrap;"></div>
        <div class="letras-disponiveis" id="letras-monte" style="display: flex; gap: 10px; justify-content: center; margin: 20px; flex-wrap: wrap;"></div>
        <button id="btn-monte" class="btn-verificar" disabled onclick="validarMonte('${palavraEscolhida}')">✅ Verificar</button>
        <button class="btn-voltar" onclick="telaConfigMonte()">🔄 Nova Palavra</button>
        <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
    </div>`;
    
    const slots = document.getElementById('slots-monte');
    for (let i = 0; i < palavraEscolhida.length; i++) {
        const s = document.createElement('div');
        s.className = 'slot-vazio';
        s.style.width = '60px';
        s.style.height = '60px';
        s.style.display = 'flex';
        s.style.alignItems = 'center';
        s.style.justifyContent = 'center';
        s.style.background = 'var(--bg-hover)';
        s.style.borderRadius = '10px';
        s.style.border = '2px dashed var(--border-color)';
        s.ondragover = e => e.preventDefault();
        s.ondrop = e => dropMonte(e, checarPreenchimentoMonte);
        slots.appendChild(s);
    }
    
    const letrasEmbaralhadas = palavraEscolhida.split('').sort(() => Math.random() - 0.5);
    letrasEmbaralhadas.forEach((l, i) => {
        const d = document.createElement('div');
        d.className = 'letra-item';
        d.innerText = l;
        d.draggable = true;
        d.id = "L"+i;
        d.style.width = '60px';
        d.style.height = '60px';
        d.style.display = 'flex';
        d.style.alignItems = 'center';
        d.style.justifyContent = 'center';
        d.style.background = 'var(--accent-color)';
        d.style.color = 'white';
        d.style.borderRadius = '10px';
        d.style.cursor = 'grab';
        d.style.fontSize = '1.5rem';
        d.ondragstart = e => e.dataTransfer.setData("text", e.target.id);
        document.getElementById('letras-monte').appendChild(d);
    });
}

function dropMonte(e, callback) {
    e.preventDefault();
    const data = e.dataTransfer.getData("text");
    const el = document.getElementById(data);
    if (e.target.classList.contains('slot-vazio') && e.target.childNodes.length === 0) {
        const clone = el.cloneNode(true);
        clone.draggable = false;
        clone.style.cursor = 'default';
        clone.style.opacity = '0.7';
        e.target.appendChild(clone);
        el.style.display = 'none';
        if (callback) callback();
    }
}

function checarPreenchimentoMonte() {
    const slots = document.querySelectorAll('#slots-monte .slot-vazio');
    const btn = document.getElementById('btn-monte');
    if (btn) btn.disabled = !Array.from(slots).every(s => s.hasChildNodes());
}

function validarMonte(palavraCorreta) {
    let res = "";
    document.querySelectorAll('#slots-monte .slot-vazio').forEach(s => res += s.innerText);
    if (res === palavraCorreta) {
        registrarAcerto("Monte a Palavra", "ACERTO_MEDIO", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Parabéns! Você formou a palavra ${palavraCorreta}!`, true);
        setTimeout(telaConfigMonte, 2000);
    } else {
        mostrarMensagem(`❌ A palavra correta é ${palavraCorreta}. Tente novamente!`, false);
    }
}

// ================= SÍLABAS MÁGICAS (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaSilabasMagicas() {
    const palavras = ["CASA", "BOLA", "GATO", "SOL", "LUA", "FLOR", "CARRO", "AVIÃO", "ESCOLA", "PROFESSOR", "CADERNO", "LAPIS", "BORRACHA", "MOCHILA", "COMPUTADOR", "BICICLETA", "CHOCOLATE", "TELEVISÃO", "MELANCIA", "ELEFANTE", "GIRAFA", "MACACO", "BORBOLETA", "HELICOPTERO", "MICROONDAS"];
    
    const jogoNome = "Sílabas Mágicas";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let palavraSecreta;
    
    if (historico.length >= palavras.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        palavraSecreta = palavras[Math.floor(Math.random() * palavras.length)];
        mostrarMensagem("🎉 Parabéns! Você montou todas as palavras! Recomeçando!", true);
    } else {
        const palavrasNaoUsadas = palavras.filter((_, index) => !historico.includes(index));
        palavraSecreta = palavrasNaoUsadas[Math.floor(Math.random() * palavrasNaoUsadas.length)];
        const indexOriginal = palavras.findIndex(p => p === palavraSecreta);
        historico.push(indexOriginal);
    }
    
    const silabas = [];
    for (let i = 0; i < palavraSecreta.length; i += 2) silabas.push(palavraSecreta.substring(i, i + 2));
    const silabasEmbaralhadas = [...silabas].sort(() => Math.random() - 0.5);
    
    let html = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-color);">🔤 Sílabas Mágicas</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                📊 ${historico.length}/${palavras.length} palavras completadas
            </div>
        </div>
        <p>Monte a palavra juntando as sílabas na ordem correta!</p>
        <p><strong>Palavra: ${'_'.repeat(palavraSecreta.length)} (${palavraSecreta.length} letras)</strong></p>
        <div style="display: flex; gap: 15px; justify-content: center; margin: 30px 0; flex-wrap: wrap;">`;
    silabasEmbaralhadas.forEach((silaba, idx) => {
        html += `<div class="letra-item" draggable="true" id="silaba-${idx}" ondragstart="dragSilaba(event)" data-silaba="${silaba}" style="cursor: grab; padding: 15px; background: var(--accent-color); color: white; border-radius: 10px; font-size: 1.2rem;">${silaba}</div>`;
    });
    html += `</div><div class="slots-container" id="slots-silabas" style="display: flex; gap: 15px; justify-content: center; min-height: 80px; flex-wrap: wrap;"></div>
        <button class="btn-verificar" onclick="verificarSilabas('${palavraSecreta}')">✅ Verificar</button>
        <button class="btn-voltar" onclick="telaSilabasMagicas()">🔄 Nova Palavra</button>
        <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
    </div>`;
    document.getElementById('games-container').innerHTML = html;
    
    for (let i = 0; i < silabas.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot-vazio';
        slot.style.minWidth = '80px';
        slot.style.height = '65px';
        slot.style.background = 'var(--bg-hover)';
        slot.style.borderRadius = '10px';
        slot.style.border = '2px dashed var(--border-color)';
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.ondragover = e => e.preventDefault();
        slot.ondrop = e => dropSilaba(e);
        document.getElementById('slots-silabas').appendChild(slot);
    }
}

function dragSilaba(e) {
    e.dataTransfer.setData("text/plain", e.target.id);
    e.dataTransfer.setData("silaba", e.target.getAttribute('data-silaba'));
}

function dropSilaba(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const elemento = document.getElementById(id);
    if (e.target.classList.contains('slot-vazio') && e.target.children.length === 0) {
        const clone = elemento.cloneNode(true);
        clone.draggable = false;
        clone.style.cursor = "default";
        clone.style.background = "#2ecc71";
        e.target.appendChild(clone);
        elemento.style.opacity = "0.3";
        elemento.draggable = false;
    }
}

function verificarSilabas(palavraCorreta) {
    let palavraFormada = "";
    document.querySelectorAll('#slots-silabas .letra-item').forEach(slot => palavraFormada += slot.innerText);
    if (palavraFormada === palavraCorreta) {
        registrarAcerto("Sílabas Mágicas", "ACERTO_MEDIO", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Parabéns! Você formou a palavra ${palavraCorreta}!`, true);
        setTimeout(telaSilabasMagicas, 2000);
    } else {
        mostrarMensagem(`💡 A palavra correta é ${palavraCorreta}. Tente novamente!`, false);
    }
}

// ================= DITADO VISUAL (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaDitadoVisual() {
    const jogoNome = "Ditado Visual";
    const lista = bancoDitadoVisual;
    
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let item;
    
    if (historico.length >= lista.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        item = lista[Math.floor(Math.random() * lista.length)];
        mostrarMensagem("🎉 Parabéns! Você completou todas as imagens! Recomeçando!", true);
    } else {
        const itensNaoUsados = lista.filter((_, index) => !historico.includes(index));
        item = itensNaoUsados[Math.floor(Math.random() * itensNaoUsados.length)];
        const indexOriginal = lista.findIndex(i => i === item);
        historico.push(indexOriginal);
    }
    
    const restantes = lista.length - historico.length;
    
    document.getElementById('games-container').innerHTML = `
        <div class="jogo-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-color);">🖼️ Ditado Visual</h2>
                <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                    📊 ${historico.length}/${lista.length} imagens | Faltam ${restantes}
                </div>
            </div>
            <div style="font-size: 5rem; margin: 30px;">${item.imagem}</div>
            <p style="font-size: 1.3rem;">O que é esta imagem?</p>
            <input type="text" id="resposta-ditado" placeholder="Digite sua resposta..." style="padding: 12px; font-size: 1.2rem; border-radius: 10px; border: 2px solid var(--accent-color); background: var(--bg-card); color: var(--text-primary); margin: 20px; width: 250px; text-align: center;">
            <div><button class="btn-verificar" onclick="verificarDitado('${item.palavra}')">✅ Verificar</button>
            <button class="btn-voltar" onclick="telaDitadoVisual()">🔄 Próxima</button>
            <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button></div>
        </div>`;
}

function verificarDitado(palavraCorreta) {
    const resposta = document.getElementById('resposta-ditado').value.toUpperCase().trim();
    if (resposta === palavraCorreta) {
        registrarAcerto("Ditado Visual", "ACERTO_SIMPLES", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Parabéns! A imagem é ${palavraCorreta}!`, true);
        setTimeout(telaDitadoVisual, 2000);
    } else {
        mostrarMensagem(`💡 A resposta correta é ${palavraCorreta}. Tente novamente!`, false);
    }
}

// ================= RIMA MALUCA (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaRimaMaluca() {
    const jogoNome = "Rima Maluca";
    const lista = bancoRimas;
    
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let item;
    
    if (historico.length >= lista.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        item = lista[Math.floor(Math.random() * lista.length)];
        mostrarMensagem("🎉 Parabéns! Você completou todas as rimas! Recomeçando!", true);
    } else {
        const itensNaoUsados = lista.filter((_, index) => !historico.includes(index));
        item = itensNaoUsados[Math.floor(Math.random() * itensNaoUsados.length)];
        const indexOriginal = lista.findIndex(i => i === item);
        historico.push(indexOriginal);
    }
    
    const opcoes = [item.certa, ...item.erradas].sort(() => Math.random() - 0.5);
    const restantes = lista.length - historico.length;
    
    document.getElementById('games-container').innerHTML = `
        <div class="jogo-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-color);">🎵 Rima Maluca</h2>
                <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                    📊 ${historico.length}/${lista.length} rimas | Faltam ${restantes}
                </div>
            </div>
            <p style="font-size: 1.5rem;">Que palavra rima com <strong>${item.alvo}</strong>?</p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin: 30px 0;">
                ${opcoes.map(opt => `<button class="btn-opcao" onclick="verificarRima('${opt}', '${item.certa}')" style="padding: 15px 25px; font-size: 1.2rem; cursor: pointer; background: var(--bg-hover); color: var(--accent-color); border: 2px solid var(--accent-color); border-radius: 10px;">${opt}</button>`).join('')}
            </div>
            <button class="btn-voltar" onclick="telaRimaMaluca()">🔄 Próxima</button>
            <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
        </div>`;
}

function verificarRima(escolha, certa) {
    if (escolha === certa) {
        registrarAcerto("Rima Maluca", "ACERTO_SIMPLES", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Perfeito! ${escolha} rima com a palavra!`, true);
        setTimeout(telaRimaMaluca, 2000);
    } else {
        mostrarMensagem(`💡 Tente novamente! A palavra que rima é ${certa}.`, false);
    }
}

// ================= QUAL É A LETRA? (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaQualLetra() {
    const letras = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"];
    
    const jogoNome = "Qual é a Letra?";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let letraAtual;
    
    if (historico.length >= letras.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        letraAtual = letras[Math.floor(Math.random() * letras.length)];
        mostrarMensagem("🎉 Parabéns! Você praticou todas as letras! Recomeçando!", true);
    } else {
        const letrasNaoUsadas = letras.filter((_, index) => !historico.includes(index));
        letraAtual = letrasNaoUsadas[Math.floor(Math.random() * letrasNaoUsadas.length)];
        const indexOriginal = letras.findIndex(l => l === letraAtual);
        historico.push(indexOriginal);
    }
    
    const opcoes = [letraAtual, letras[Math.floor(Math.random() * letras.length)], letras[Math.floor(Math.random() * letras.length)], letras[Math.floor(Math.random() * letras.length)]].sort(() => Math.random() - 0.5);
    const restantes = letras.length - historico.length;
    
    document.getElementById('games-container').innerHTML = `
        <div class="jogo-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-color);">❓ Qual é a Letra?</h2>
                <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                    📊 ${historico.length}/${letras.length} letras | Faltam ${restantes}
                </div>
            </div>
            <div style="background: var(--bg-hover); padding: 40px; border-radius: 20px; margin: 20px;">
                <span style="font-size: 6rem; font-weight: bold;">${letraAtual}</span>
            </div>
            <div style="display: flex; gap: 20px; justify-content: center; flex-wrap: wrap;">
                ${opcoes.map(opt => `<button class="btn-opcao" onclick="verificarLetra('${opt}', '${letraAtual}')" style="padding: 20px 30px; font-size: 1.5rem; cursor: pointer; background: var(--bg-hover); color: var(--accent-color); border: 2px solid var(--accent-color); border-radius: 10px;">${opt}</button>`).join('')}
            </div>
            <button class="btn-voltar" onclick="telaQualLetra()" style="margin-top: 20px;">🔄 Próxima</button>
            <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
        </div>`;
}

function verificarLetra(escolha, certa) {
    if (escolha === certa) {
        registrarAcerto("Qual é a Letra?", "ACERTO_SIMPLES", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Muito bem! A letra é ${certa}!`, true);
        setTimeout(telaQualLetra, 2000);
    } else {
        mostrarMensagem(`💡 Tente novamente! A letra correta é ${certa}.`, false);
    }
}

// ================= MEMÓRIA DE PALAVRAS (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaMemoriaPalavras() {
    const palavras = ["CASA", "BOLA", "GATO", "SOL", "LUA", "FLOR", "CARRO", "AVIÃO", "ESCOLA", "PROFESSOR", "LIVRO", "CADERNO", "BICICLETA", "COMPUTADOR", "CHOCOLATE", "ELEFANTE", "GIRAFA", "MACACO", "BORBOLETA", "TELEVISÃO"];
    
    const jogoNome = "Memória de Palavras";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let palavraSecreta;
    
    if (historico.length >= palavras.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        palavraSecreta = palavras[Math.floor(Math.random() * palavras.length)];
        mostrarMensagem("🎉 Parabéns! Você completou todas as palavras! Recomeçando!", true);
    } else {
        const palavrasNaoUsadas = palavras.filter((_, index) => !historico.includes(index));
        palavraSecreta = palavrasNaoUsadas[Math.floor(Math.random() * palavrasNaoUsadas.length)];
        const indexOriginal = palavras.findIndex(p => p === palavraSecreta);
        historico.push(indexOriginal);
    }
    
    const letrasEmbaralhadas = palavraSecreta.split('').sort(() => Math.random() - 0.5);
    const restantes = palavras.length - historico.length;
    
    document.getElementById('games-container').innerHTML = `
        <div class="jogo-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-color);">🧠 Memória de Palavras</h2>
                <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                    📊 ${historico.length}/${palavras.length} palavras | Faltam ${restantes}
                </div>
            </div>
            <p>Organize as letras para formar a palavra:</p>
            <p><strong>Dica: A palavra tem ${palavraSecreta.length} letras</strong></p>
            <div style="display: flex; gap: 15px; justify-content: center; margin: 20px; flex-wrap: wrap;">
                ${letrasEmbaralhadas.map((l, i) => `<div class="letra-item" draggable="true" ondragstart="dragLetraMemoria(event)" id="letra-mem-${i}" style="width: 60px; height: 60px; cursor: grab; display: flex; align-items: center; justify-content: center; background: var(--accent-color); color: white; border-radius: 10px; font-size: 1.5rem;">${l}</div>`).join('')}
            </div>
            <div class="slots-container" id="slots-memoria" style="display: flex; gap: 15px; justify-content: center; min-height: 80px; flex-wrap: wrap;"></div>
            <button class="btn-verificar" onclick="verificarMemoriaPalavras('${palavraSecreta}')">✅ Verificar</button>
            <button class="btn-voltar" onclick="telaMemoriaPalavras()">🔄 Nova Palavra</button>
            <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
        </div>`;
    
    for (let i = 0; i < palavraSecreta.length; i++) {
        const slot = document.createElement('div');
        slot.className = 'slot-vazio';
        slot.style.width = '60px';
        slot.style.height = '60px';
        slot.style.background = 'var(--bg-hover)';
        slot.style.borderRadius = '10px';
        slot.style.border = '2px dashed var(--border-color)';
        slot.style.display = 'flex';
        slot.style.alignItems = 'center';
        slot.style.justifyContent = 'center';
        slot.ondragover = e => e.preventDefault();
        slot.ondrop = e => dropLetraMemoria(e);
        document.getElementById('slots-memoria').appendChild(slot);
    }
}

function dragLetraMemoria(e) { e.dataTransfer.setData("text/plain", e.target.id); }
function dropLetraMemoria(e) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const elemento = document.getElementById(id);
    if (e.target.classList.contains('slot-vazio') && e.target.children.length === 0) {
        const clone = elemento.cloneNode(true);
        clone.draggable = false;
        clone.style.cursor = "default";
        clone.style.background = "#2ecc71";
        e.target.appendChild(clone);
        elemento.style.opacity = "0.3";
        elemento.draggable = false;
    }
}
function verificarMemoriaPalavras(palavraCorreta) {
    let palavraFormada = "";
    document.querySelectorAll('#slots-memoria .letra-item').forEach(slot => palavraFormada += slot.innerText);
    if (palavraFormada === palavraCorreta) {
        registrarAcerto("Memória de Palavras", "ACERTO_MEDIO", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Parabéns! Você formou a palavra ${palavraCorreta}!`, true);
        setTimeout(telaMemoriaPalavras, 2000);
    } else {
        mostrarMensagem(`💡 A palavra correta é ${palavraCorreta}. Tente novamente!`, false);
    }
}

// ================= PALAVRA OCULTA (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaPalavraOculta() {
    const jogoNome = "Palavra Oculta";
    const lista = bancoPalavraOculta;
    
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let item;
    
    if (historico.length >= lista.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        item = lista[Math.floor(Math.random() * lista.length)];
        mostrarMensagem("🎉 Parabéns! Você descobriu todas as palavras ocultas! Recomeçando!", true);
    } else {
        const itensNaoUsados = lista.filter((_, index) => !historico.includes(index));
        item = itensNaoUsados[Math.floor(Math.random() * itensNaoUsados.length)];
        const indexOriginal = lista.findIndex(i => i === item);
        historico.push(indexOriginal);
    }
    
    const restantes = lista.length - historico.length;
    
    document.getElementById('games-container').innerHTML = `
        <div class="jogo-wrapper">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                <h2 style="color: var(--accent-color);">🔎 Palavra Oculta</h2>
                <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                    📊 ${historico.length}/${lista.length} palavras | Faltam ${restantes}
                </div>
            </div>
            <div style="background: var(--bg-hover); padding: 30px; border-radius: 20px; margin: 20px;">
                <p style="font-size: 1.3rem;">💡 Dica: ${item.dica}</p>
            </div>
            <p>A palavra tem ${item.palavra.length} letras</p>
            <div style="display: flex; gap: 10px; justify-content: center; margin: 20px; flex-wrap: wrap;">
                ${'_'.repeat(item.palavra.length).split('').map(() => `<input type="text" class="letra-oculta" maxlength="1" style="width: 50px; height: 50px; text-align: center; font-size: 1.5rem; border-radius: 10px; border: 2px solid var(--accent-color); background: var(--bg-card); color: var(--text-primary);">`).join('')}
            </div>
            <button class="btn-verificar" onclick="verificarPalavraOculta('${item.palavra}')">✅ Verificar</button>
            <button class="btn-voltar" onclick="telaPalavraOculta()">🔄 Próxima</button>
            <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
        </div>`;
}

function verificarPalavraOculta(palavraCorreta) {
    let resposta = "";
    document.querySelectorAll('.letra-oculta').forEach(input => resposta += input.value.toUpperCase());
    if (resposta === palavraCorreta) {
        registrarAcerto("Palavra Oculta", "ACERTO_DIFICIL", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Excelente! A palavra é ${palavraCorreta}!`, true);
        setTimeout(telaPalavraOculta, 2000);
    } else {
        mostrarMensagem(`💡 A palavra correta é ${palavraCorreta}. Tente novamente!`, false);
    }
}

// ================= SOMBRAS MÁGICAS (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaSombrasMagicas() {
    const itens = [
        { imagem: "🐶", sombra: "🐕", nome: "cachorro" }, { imagem: "🐱", sombra: "🐈", nome: "gato" },
        { imagem: "🐭", sombra: "🐀", nome: "rato" }, { imagem: "🐮", sombra: "🐄", nome: "vaca" },
        { imagem: "🐷", sombra: "🐖", nome: "porco" }, { imagem: "🦆", sombra: "🐤", nome: "pato" },
        { imagem: "🍎", sombra: "🍎", nome: "maçã" }, { imagem: "🚗", sombra: "🚗", nome: "carro" },
        { imagem: "⭐", sombra: "⭐", nome: "estrela" }, { imagem: "🌙", sombra: "🌙", nome: "lua" },
        { imagem: "🐘", sombra: "🐘", nome: "elefante" }, { imagem: "🦒", sombra: "🦒", nome: "girafa" },
        { imagem: "🐒", sombra: "🐒", nome: "macaco" }, { imagem: "🦁", sombra: "🦁", nome: "leão" },
        { imagem: "🐧", sombra: "🐧", nome: "pinguim" }, { imagem: "🐬", sombra: "🐬", nome: "golfinho" },
        { imagem: "🦋", sombra: "🦋", nome: "borboleta" }, { imagem: "🐝", sombra: "🐝", nome: "abelha" },
        { imagem: "🐙", sombra: "🐙", nome: "polvo" }, { imagem: "🐟", sombra: "🐟", nome: "peixe" }
    ];
    
    const jogoNome = "Sombras Mágicas";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let selecionados;
    
    if (historico.length >= Math.floor(itens.length / 4)) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        const shuffleArray = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
        selecionados = shuffleArray([...itens]).slice(0, 6);
    } else {
        const indicesNaoUsados = [];
        for (let i = 0; i < itens.length; i++) {
            if (!historico.includes(i)) indicesNaoUsados.push(i);
        }
        const indicesEscolhidos = indicesNaoUsados.sort(() => 0.5 - Math.random()).slice(0, 6);
        selecionados = indicesEscolhidos.map(i => itens[i]);
        indicesEscolhidos.forEach(i => historico.push(i));
    }
    
    const shuffleArray = (arr) => { for (let i = arr.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [arr[i], arr[j]] = [arr[j], arr[i]]; } return arr; };
    const imagensEmbaralhadas = shuffleArray([...selecionados]);
    const sombrasEmbaralhadas = shuffleArray([...selecionados]);
    const restantes = Math.floor(itens.length / 4) - historico.length;
    
    let html = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-color);">🌑 Sombras Mágicas</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                📊 ${historico.length}/${Math.floor(itens.length / 4)} conjuntos | ${restantes > 0 ? `Faltam ${restantes}` : "Recomeçando!"}
            </div>
        </div>
        <p>Arraste cada imagem para a sombra correta!</p>
        <div style="display: flex; flex-wrap: wrap; gap: 30px; justify-content: center;">
            <div><h3>🖼️ IMAGENS</h3><div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">`;
    imagensEmbaralhadas.forEach((item, idx) => {
        html += `<div class="letra-item" draggable="true" id="img-${idx}" ondragstart="dragStartHandlerSombras(event)" style="font-size: 3rem; width: 80px; height: 80px; cursor: grab; display: flex; align-items: center; justify-content: center; background: var(--bg-card); border-radius: 15px;">${item.imagem}</div>`;
    });
    html += `</div></div><div><h3>🌑 SOMBRAS</h3><div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center;">`;
    sombrasEmbaralhadas.forEach((item, idx) => {
        html += `<div class="slot-sombra" data-resposta="${item.imagem}" ondragover="allowDropSombras(event)" ondrop="dropSombraHandler(event, this)" style="width: 80px; height: 80px; font-size: 2.5rem; display: flex; align-items: center; justify-content: center; background: var(--bg-hover); border: 2px dashed var(--border-color); border-radius: 15px;">${item.sombra}</div>`;
    });
    html += `</div></div></div>
        <div style="margin-top: 20px; text-align: center;">
            <p>Acertos: <span id="acertos-sombras">0</span> / <span id="total-sombras">${selecionados.length}</span></p>
        </div>
        <button class="btn-verificar" onclick="verificarSombras()">✅ Verificar</button>
        <button class="btn-voltar" onclick="telaSombrasMagicas()">🔄 Novo Jogo</button>
        <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
    </div>`;
    document.getElementById('games-container').innerHTML = html;
    window.acertosSombras = 0;
    window.totalSombras = selecionados.length;
    document.getElementById('total-sombras').innerText = selecionados.length;
}

function dragStartHandlerSombras(e) { e.dataTransfer.setData("text/plain", e.target.id); }
function allowDropSombras(e) { e.preventDefault(); }
function dropSombraHandler(e, target) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const elemento = document.getElementById(id);
    if (!elemento) return;
    if (target.children.length > 0) { mostrarMensagem("⚠️ Este espaço já está preenchido!", false); return; }
    const respostaCorreta = target.getAttribute('data-resposta');
    const imagemArrastada = elemento.innerText;
    if (imagemArrastada !== respostaCorreta) { mostrarMensagem(`❌ Esta não é a sombra correta!`, false); return; }
    const clone = elemento.cloneNode(true);
    clone.draggable = false;
    clone.style.cursor = "default";
    clone.style.background = "#2ecc71";
    target.innerHTML = "";
    target.appendChild(clone);
    elemento.style.opacity = "0.3";
    elemento.draggable = false;
    window.acertosSombras++;
    document.getElementById('acertos-sombras').innerText = window.acertosSombras;
    mostrarMensagem(`✅ Correto!`, true);
}
function verificarSombras() {
    if (window.acertosSombras === window.totalSombras) {
        registrarAcerto("Sombras Mágicas", "ACERTO_MEDIO", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Perfeito! Você encontrou todas as ${window.totalSombras} sombras!`, true);
        setTimeout(telaSombrasMagicas, 2500);
    } else {
        mostrarMensagem(`💡 Você acertou ${window.acertosSombras} de ${window.totalSombras}. Continue!`, false);
    }
}

// ================= CLASSIFICAÇÃO DE CORES (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaClassificacaoCores() {
    const cores = [
        { nome: "vermelho", cor: "#ff6b6b", emoji: "🔴", itens: ["🍎", "🍓", "🌹", "❤️"] },
        { nome: "amarelo", cor: "#ffd93d", emoji: "🟡", itens: ["🍌", "🌻", "⭐", "🐤"] },
        { nome: "verde", cor: "#6bff6b", emoji: "🟢", itens: ["🍏", "🥑", "🌿", "🐸"] },
        { nome: "azul", cor: "#6b9fff", emoji: "🔵", itens: ["🫐", "🐟", "💧", "🌊"] },
        { nome: "roxo", cor: "#9b6bff", emoji: "🟣", itens: ["🍇", "🦄", "🔮", "💜"] },
        { nome: "laranja", cor: "#ff9b6b", emoji: "🟠", itens: ["🍊", "🥕", "🎃", "🐅"] }
    ];
    
    let todosItens = [];
    cores.forEach(cor => {
        cor.itens.forEach(item => {
            todosItens.push({ item: item, cor: cor.nome });
        });
    });
    
    const jogoNome = "Classificação de Cores";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let itensSelecionados;
    
    if (historico.length >= Math.floor(todosItens.length / 8)) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        itensSelecionados = todosItens.sort(() => 0.5 - Math.random()).slice(0, 8);
    } else {
        const indicesNaoUsados = [];
        for (let i = 0; i < todosItens.length; i++) {
            if (!historico.includes(i)) indicesNaoUsados.push(i);
        }
        const indicesEscolhidos = indicesNaoUsados.sort(() => 0.5 - Math.random()).slice(0, 8);
        itensSelecionados = indicesEscolhidos.map(i => todosItens[i]);
        indicesEscolhidos.forEach(i => historico.push(i));
    }
    
    const restantes = Math.floor(todosItens.length / 8) - historico.length;
    
    let html = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-color);">🎨 Classificação de Cores</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                📊 ${historico.length}/${Math.floor(todosItens.length / 8)} rodadas | ${restantes > 0 ? `Faltam ${restantes}` : "Recomeçando!"}
            </div>
        </div>
        <p>Arraste cada item para o balde da cor certa!</p>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-bottom: 30px;">`;
    cores.slice(0, 4).forEach(cor => {
        html += `<div style="text-align: center;">
            <div class="slot-cor" data-cor="${cor.nome}" ondragover="allowDropSombras(event)" ondrop="dropCorHandler(event, this)" style="width: 100px; min-height: 140px; background: ${cor.cor}20; border: 2px solid ${cor.cor}; border-radius: 15px; padding: 10px;">
                <div style="font-size: 2rem;">${cor.emoji}</div>
                <div>${cor.nome}</div>
                <div class="itens-no-balde" style="margin-top: 10px; min-height: 50px;"></div>
            </div>
        </div>`;
    });
    html += `</div><div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin-bottom: 20px;">`;
    itensSelecionados.forEach((item, idx) => {
        html += `<div class="letra-item" draggable="true" id="item-cor-${idx}" ondragstart="dragStartHandlerSombras(event)" data-cor="${item.cor}" style="font-size: 2rem; cursor: grab; padding: 12px; background: var(--bg-card); border-radius: 10px;">${item.item}</div>`;
    });
    html += `</div>
        <div style="margin-top: 20px; text-align: center;">
            <p>Classificados: <span id="itens-classificados">0</span> / <span id="total-itens">${itensSelecionados.length}</span></p>
        </div>
        <button class="btn-verificar" onclick="verificarCoresClassificacao()">✅ Verificar</button>
        <button class="btn-voltar" onclick="telaClassificacaoCores()">🔄 Novo Jogo</button>
        <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
    </div>`;
    document.getElementById('games-container').innerHTML = html;
    window.itensClassificados = 0;
    window.totalItensClassificar = itensSelecionados.length;
    document.getElementById('total-itens').innerText = itensSelecionados.length;
}

function dropCorHandler(e, target) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const elemento = document.getElementById(id);
    if (!elemento) return;
    if (elemento.getAttribute('data-usado') === 'true') { mostrarMensagem("⚠️ Este item já foi classificado!", false); return; }
    const corEsperada = target.getAttribute('data-cor');
    const corItem = elemento.getAttribute('data-cor');
    if (corItem !== corEsperada) { mostrarMensagem(`⚠️ Este item é da cor ${corItem}, não ${corEsperada}!`, false); return; }
    const containerItens = target.querySelector('.itens-no-balde');
    const clone = elemento.cloneNode(true);
    clone.id = "clone-cor-" + Date.now();
    clone.draggable = false;
    clone.style.cursor = "default";
    clone.style.background = "#2ecc71";
    clone.setAttribute('data-usado', 'true');
    containerItens.appendChild(clone);
    elemento.style.display = "none";
    elemento.setAttribute('data-usado', 'true');
    window.itensClassificados++;
    document.getElementById('itens-classificados').innerText = window.itensClassificados;
    mostrarMensagem(`✅ Correto! Item foi para o balde ${corEsperada}!`, true);
}

function verificarCoresClassificacao() {
    if (window.itensClassificados === window.totalItensClassificar) {
        registrarAcerto("Classificação de Cores", "ACERTO_MEDIO", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Excelente! Você classificou todas as cores!`, true);
        setTimeout(telaClassificacaoCores, 2500);
    } else {
        mostrarMensagem(`💡 Você classificou ${window.itensClassificados} de ${window.totalItensClassificar}. Continue!`, false);
    }
}

// ================= CONTAGEM DE OBJETOS (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaContagemObjetos() {
    const perguntas = [
        { imagens: ["🐶", "🐶", "🐶"], pergunta: "Quantos cachorros?", resposta: 3 },
        { imagens: ["🍎", "🍎"], pergunta: "Quantas maçãs?", resposta: 2 },
        { imagens: ["⭐", "⭐", "⭐", "⭐"], pergunta: "Quantas estrelas?", resposta: 4 },
        { imagens: ["🌸", "🌸", "🌸", "🌸", "🌸"], pergunta: "Quantas flores?", resposta: 5 },
        { imagens: ["🐱", "🐱", "🐱", "🐱"], pergunta: "Quantos gatos?", resposta: 4 },
        { imagens: ["🍕", "🍕", "🍕"], pergunta: "Quantas pizzas?", resposta: 3 },
        { imagens: ["🚗", "🚗", "🚗", "🚗", "🚗"], pergunta: "Quantos carros?", resposta: 5 },
        { imagens: ["🎈", "🎈"], pergunta: "Quantos balões?", resposta: 2 },
        { imagens: ["📚", "📚", "📚", "📚", "📚", "📚"], pergunta: "Quantos livros?", resposta: 6 },
        { imagens: ["🐟", "🐟", "🐟", "🐟"], pergunta: "Quantos peixes?", resposta: 4 },
        { imagens: ["🍦", "🍦", "🍦"], pergunta: "Quantos sorvetes?", resposta: 3 },
        { imagens: ["🐘", "🐘"], pergunta: "Quantos elefantes?", resposta: 2 },
        { imagens: ["🐧", "🐧", "🐧", "🐧", "🐧"], pergunta: "Quantos pinguins?", resposta: 5 },
        { imagens: ["🦋", "🦋", "🦋"], pergunta: "Quantas borboletas?", resposta: 3 },
        { imagens: ["🐝", "🐝", "🐝", "🐝"], pergunta: "Quantas abelhas?", resposta: 4 }
    ];
    
    const jogoNome = "Contagem de Objetos";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let atual;
    
    if (historico.length >= perguntas.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        atual = perguntas[Math.floor(Math.random() * perguntas.length)];
        mostrarMensagem("🎉 Parabéns! Você completou todas as contagens! Recomeçando!", true);
    } else {
        const perguntasNaoUsadas = perguntas.filter((_, index) => !historico.includes(index));
        atual = perguntasNaoUsadas[Math.floor(Math.random() * perguntasNaoUsadas.length)];
        const indexOriginal = perguntas.findIndex(p => p === atual);
        historico.push(indexOriginal);
    }
    
    let imagensHTML = atual.imagens.map(img => `<span style="font-size: 3rem; margin: 0 5px;">${img}</span>`).join('');
    let opcoesHTML = '';
    for (let i = 1; i <= atual.resposta + 3; i++) { 
        if (i <= 10) opcoesHTML += `<button class="btn-opcao" onclick="verificarContagem(${i}, ${atual.resposta})" style="padding: 15px 25px; font-size: 1.2rem; cursor: pointer; background: var(--bg-hover); color: var(--accent-color); border: 2px solid var(--accent-color); border-radius: 10px; margin: 5px;">${i}</button>`; 
    }
    const restantes = perguntas.length - historico.length;
    
    document.getElementById('games-container').innerHTML = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-color);">🔟 Contagem de Objetos</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                📊 ${historico.length}/${perguntas.length} contagens | Faltam ${restantes}
            </div>
        </div>
        <div style="font-size: 3rem; margin: 20px;">${imagensHTML}</div>
        <p style="font-size: 1.3rem;">${atual.pergunta}</p>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin: 20px;">${opcoesHTML}</div>
        <button class="btn-voltar" onclick="telaContagemObjetos()">🔄 Próximo</button>
        <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
    </div>`;
}

function verificarContagem(escolha, certa) {
    if (escolha === certa) { 
        registrarAcerto("Contagem de Objetos", "ACERTO_SIMPLES", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Correto! ${certa} é a resposta certa!`, true);
        setTimeout(telaContagemObjetos, 2000); 
    } else { 
        mostrarMensagem(`💡 Tente novamente! A resposta era ${certa}.`, false); 
    }
}

// ================= EMOÇÕES (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaEmocoes() {
    const emocoes = [
        { imagem: "😊", nome: "feliz", situacao: "Ganhei um presente!" },
        { imagem: "😢", nome: "triste", situacao: "Meu sorvete caiu no chão" },
        { imagem: "😡", nome: "nervoso", situacao: "Alguém quebrou meu brinquedo" },
        { imagem: "😴", nome: "cansado", situacao: "Brincamos o dia inteiro" },
        { imagem: "😨", nome: "medo", situacao: "Escureceu e estou sozinho" },
        { imagem: "🥰", nome: "apaixonado", situacao: "Ganhei um abraço especial" },
        { imagem: "🤔", nome: "confuso", situacao: "Não entendi a pergunta" },
        { imagem: "🥳", nome: "animado", situacao: "Vamos viajar amanhã!" },
        { imagem: "😎", nome: "descolado", situacao: "Ganhei óculos novos" },
        { imagem: "🤢", nome: "enjoado", situacao: "Comi comida estragada" }
    ];
    
    const jogoNome = "Emoções";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let atual;
    
    if (historico.length >= emocoes.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        atual = emocoes[Math.floor(Math.random() * emocoes.length)];
        mostrarMensagem("🎉 Parabéns! Você reconheceu todas as emoções! Recomeçando!", true);
    } else {
        const emocoesNaoUsadas = emocoes.filter((_, index) => !historico.includes(index));
        atual = emocoesNaoUsadas[Math.floor(Math.random() * emocoesNaoUsadas.length)];
        const indexOriginal = emocoes.findIndex(e => e === atual);
        historico.push(indexOriginal);
    }
    
    const opcoes = [...emocoes].sort(() => 0.5 - Math.random());
    let opcoesHTML = '';
    opcoes.slice(0, 4).forEach(emo => opcoesHTML += `<button class="btn-opcao" onclick="verificarEmocao('${emo.nome}', '${atual.nome}')" style="padding: 15px 25px; font-size: 1.2rem; cursor: pointer; background: var(--bg-hover); color: var(--accent-color); border: 2px solid var(--accent-color); border-radius: 10px; margin: 5px;">${emo.imagem} ${emo.nome}</button>`);
    const restantes = emocoes.length - historico.length;
    
    document.getElementById('games-container').innerHTML = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-color);">😊 Emoções</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                📊 ${historico.length}/${emocoes.length} emoções | Faltam ${restantes}
            </div>
        </div>
        <div style="font-size: 5rem; margin: 20px;">${atual.imagem}</div>
        <p style="font-size: 1.3rem;">"${atual.situacao}"</p>
        <p style="margin-top: 20px;">Como essa pessoa está se sentindo?</p>
        <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap; margin: 20px;">${opcoesHTML}</div>
        <button class="btn-voltar" onclick="telaEmocoes()">🔄 Próxima</button>
        <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
    </div>`;
}

function verificarEmocao(escolha, certa) {
    if (escolha === certa) { 
        registrarAcerto("Emoções", "ACERTO_SIMPLES", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Muito bem! A pessoa está ${certa}!`, true);
        setTimeout(telaEmocoes, 2000); 
    } else { 
        mostrarMensagem(`💡 A pessoa está ${certa}. Tente novamente!`, false); 
    }
}

// ================= MINHA ROTINA (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaMinhaRotina() {
    const rotinas = [
        { passo: "🌅 Acordar", ordem: 1 }, { passo: "🪥 Escovar os dentes", ordem: 2 },
        { passo: "🍞 Tomar café", ordem: 3 }, { passo: "👕 Trocar de roupa", ordem: 4 }, 
        { passo: "🏫 Ir para escola", ordem: 5 }, { passo: "📚 Estudar", ordem: 6 },
        { passo: "🍽️ Almoçar", ordem: 7 }, { passo: "😴 Cochilar", ordem: 8 },
        { passo: "🎮 Brincar", ordem: 9 }, { passo: "🛁 Tomar banho", ordem: 10 },
        { passo: "🍜 Jantar", ordem: 11 }, { passo: "📖 Ler um livro", ordem: 12 }, { passo: "😴 Dormir", ordem: 13 }
    ];
    
    const jogoNome = "Minha Rotina";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let rotinasSelecionadas;
    
    if (historico.length >= 5) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        rotinasSelecionadas = rotinas.slice(0, 6);
    } else {
        const startIndex = historico.length * 6;
        rotinasSelecionadas = rotinas.slice(startIndex, startIndex + 6);
    }
    
    const embaralhadas = [...rotinasSelecionadas].sort(() => 0.5 - Math.random());
    const restantes = Math.floor(rotinas.length / 6) - historico.length;
    
    let html = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-color);">⏰ Minha Rotina</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                📊 ${historico.length}/${Math.floor(rotinas.length / 6)} partes | ${restantes > 0 ? `Faltam ${restantes}` : "Recomeçando!"}
            </div>
        </div>
        <p>Organize as atividades na ordem correta (1º ao ${rotinasSelecionadas.length}º)</p>
        <div style="display: flex; gap: 30px; flex-wrap: wrap; justify-content: center;">
            <div><h3>📋 ORDEM CORRETA</h3><div id="rotina-slots">`;
    for (let i = 0; i < rotinasSelecionadas.length; i++) {
        html += `<div class="slot-rotina" data-ordem="${i+1}" ondragover="allowDropSombras(event)" ondrop="dropRotinaHandler(event, this)" style="width: 220px; padding: 10px; margin: 5px; background: var(--bg-hover); border-radius: 10px; border: 2px dashed var(--border-color);">
            <span style="background: var(--accent-color); padding: 5px 12px; border-radius: 20px; color: white;">${i+1}º</span>
            <span class="slot-texto" style="margin-left: 10px;">⬅️ Arraste aqui</span>
        </div>`;
    }
    html += `</div></div><div><h3>🎯 ATIVIDADES</h3><div>`;
    embaralhadas.forEach((item, idx) => {
        html += `<div class="letra-item" draggable="true" id="rotina-${idx}" ondragstart="dragStartHandlerSombras(event)" data-passo="${item.passo}" data-ordem="${item.ordem}" style="margin-bottom: 8px; padding: 10px; width: 200px; background: var(--accent-color); color: white; border-radius: 10px; cursor: grab; text-align: center;">${item.passo}</div>`;
    });
    html += `</div></div></div>
        <div style="margin-top: 20px; text-align: center;">
            <p>Acertos: <span id="acertos-rotina">0</span> / <span id="total-rotina">${rotinasSelecionadas.length}</span></p>
        </div>
        <button class="btn-verificar" onclick="verificarRotina(${rotinasSelecionadas.length})">✅ Verificar</button>
        <button class="btn-voltar" onclick="telaMinhaRotina()">🔄 Nova Rotina</button>
        <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
    </div>`;
    document.getElementById('games-container').innerHTML = html;
    window.acertosRotina = 0;
    window.totalRotina = rotinasSelecionadas.length;
    document.getElementById('total-rotina').innerText = rotinasSelecionadas.length;
}

function dropRotinaHandler(e, target) {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const elemento = document.getElementById(id);
    if (!elemento) return;
    const slotTexto = target.querySelector('.slot-texto');
    if (slotTexto.innerText !== "⬅️ Arraste aqui") { mostrarMensagem("⚠️ Este espaço já está preenchido!", false); return; }
    const ordemEsperada = parseInt(target.getAttribute('data-ordem'));
    const ordemItem = parseInt(elemento.getAttribute('data-ordem'));
    if (ordemItem !== ordemEsperada) {
        mostrarMensagem(`⚠️ Esta atividade é a ${ordemItem}ª, mas você está colocando na ${ordemEsperada}ª posição!`, false);
        return;
    }
    const clone = elemento.cloneNode(true);
    clone.draggable = false;
    clone.style.cursor = "default";
    clone.style.background = "#2ecc71";
    slotTexto.innerHTML = "";
    slotTexto.appendChild(clone);
    elemento.style.opacity = "0.3";
    elemento.draggable = false;
    target.setAttribute('data-completado', 'true');
    window.acertosRotina++;
    document.getElementById('acertos-rotina').innerText = window.acertosRotina;
    mostrarMensagem(`✅ "${elemento.getAttribute('data-passo')}" na posição correta!`, true);
}

function verificarRotina(total) {
    if (window.acertosRotina === total) {
        registrarAcerto("Minha Rotina", "ACERTO_MEDIO", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Excelente! Rotina organizada corretamente!`, true);
        setTimeout(telaMinhaRotina, 2500);
    } else {
        mostrarMensagem(`💡 Você acertou ${window.acertosRotina} de ${total}. Continue organizando!`, false);
    }
}

// ================= CUIDADO COM O AMBIENTE (COM SISTEMA ANTI-REPETIÇÃO) =================
function telaCuidadoAmbiente() {
    const acoes = [
        { acao: "Jogar lixo no chão", correta: false, explicacao: "Devemos jogar o lixo na lixeira!" },
        { acao: "Separar o lixo para reciclar", correta: true, explicacao: "Reciclar ajuda o planeta!" },
        { acao: "Apagar a luz ao sair", correta: true, explicacao: "Economizar energia é importante!" },
        { acao: "Deixar a torneira aberta", correta: false, explicacao: "Feche a torneira para economizar água!" },
        { acao: "Plantar árvores", correta: true, explicacao: "Árvores produzem oxigênio!" },
        { acao: "Usar sacolas plásticas", correta: false, explicacao: "Prefira sacolas reutilizáveis!" },
        { acao: "Andar de bicicleta", correta: true, explicacao: "Não polui e faz bem!" },
        { acao: "Desperdiçar comida", correta: false, explicacao: "Aproveite os alimentos!" },
        { acao: "Recolher lixo da praia", correta: true, explicacao: "Mantenha a natureza limpa!" },
        { acao: "Usar carro para tudo", correta: false, explicacao: "Use transporte público!" },
        { acao: "Desligar aparelhos da tomada", correta: true, explicacao: "Economiza energia!" },
        { acao: "Queimar lixo", correta: false, explicacao: "Polui o ar!" },
        { acao: "Reutilizar garrafas", correta: true, explicacao: "Reduz o lixo!" },
        { acao: "Comprar produtos com muita embalagem", correta: false, explicacao: "Gera mais lixo!" },
        { acao: "Usar energia solar", correta: true, explicacao: "Energia limpa e renovável!" }
    ];
    
    const jogoNome = "Cuidado com o Ambiente";
    if (!estadoAtual.historicoPerguntas[jogoNome]) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
    }
    
    const historico = estadoAtual.historicoPerguntas[jogoNome];
    let atual;
    
    if (historico.length >= acoes.length) {
        estadoAtual.historicoPerguntas[jogoNome] = [];
        atual = acoes[Math.floor(Math.random() * acoes.length)];
        mostrarMensagem("🎉 Parabéns! Você aprendeu todas as ações! Recomeçando!", true);
    } else {
        const acoesNaoUsadas = acoes.filter((_, index) => !historico.includes(index));
        atual = acoesNaoUsadas[Math.floor(Math.random() * acoesNaoUsadas.length)];
        const indexOriginal = acoes.findIndex(a => a === atual);
        historico.push(indexOriginal);
    }
    
    const restantes = acoes.length - historico.length;
    
    document.getElementById('games-container').innerHTML = `<div class="jogo-wrapper">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
            <h2 style="color: var(--accent-color);">🌍 Cuidado com o Ambiente</h2>
            <div style="background: var(--bg-hover); padding: 8px 16px; border-radius: 15px; font-size: 0.9rem;">
                📊 ${historico.length}/${acoes.length} ações | Faltam ${restantes}
            </div>
        </div>
        <div style="background: var(--bg-hover); padding: 30px; border-radius: 20px; margin: 20px;">
            <p style="font-size: 1.5rem;">${atual.acao}</p>
        </div>
        <p style="font-size: 1.2rem;">Essa atitude é boa para o planeta?</p>
        <div style="display: flex; gap: 20px; justify-content: center; margin: 20px;">
            <button class="btn-opcao" onclick="verificarAmbiente(true, ${atual.correta}, '${atual.explicacao}')" style="background: #2ecc71; padding: 15px 30px; font-size: 1.2rem; cursor: pointer; border: none; border-radius: 10px; color: white;">👍 SIM</button>
            <button class="btn-opcao" onclick="verificarAmbiente(false, ${atual.correta}, '${atual.explicacao}')" style="background: #ff6b6b; padding: 15px 30px; font-size: 1.2rem; cursor: pointer; border: none; border-radius: 10px; color: white;">👎 NÃO</button>
        </div>
        <button class="btn-voltar" onclick="telaCuidadoAmbiente()">🔄 Próxima</button>
        <button class="btn-voltar" onclick="navigateHome()">🏠 Voltar</button>
    </div>`;
}

function verificarAmbiente(resposta, correta, explicacao) {
    if (resposta === correta) { 
        registrarAcerto("Cuidado com o Ambiente", "ACERTO_SIMPLES", 0);
        salvarProgresso();
        mostrarMensagem(`🎉 Correto! ${explicacao}`, true);
        setTimeout(telaCuidadoAmbiente, 2000); 
    } else { 
        mostrarMensagem(`💡 ${explicacao}`, false); 
    }
}

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
function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    userPreferences.theme = theme;
    saveUserPreferences();
    document.querySelectorAll('.btn-tema').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tema') === theme);
    });
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
function togglePersonalizacao() { document.getElementById('personalizacao-menu').classList.toggle('active'); }
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
function initCarrossel() {
    const track = document.getElementById('carousel-track');
    if (!track) return;
    
    // 🔧 Nomes exatos conforme devem estar na pasta
    const imagens = [
        "imagens/logo_ifms-removebg-preview.png",
        "imagens/image-removebg-preview.png",
        "imagens/APAE.png"
    ];
    
    let slidesHTML = '';
    
    // Vou repetir as imagens 4 vezes para dar o efeito de rolagem infinita
    for (let i = 0; i < 4; i++) {
        imagens.forEach(src => { 
            // Adicionado um fundo vermelho e borda para você ver onde a imagem deveria estar
            slidesHTML += `
                <div style="background: red; border: 2px solid yellow; width: 180px; height: 100px; display: flex; align-items: center; justify-content: center; margin: 0 10px; flex-shrink: 0;">
                    <img src="${src}" alt="Apoiador" class="carousel-img" style="width: 100%; height: 100%; object-fit: contain;">
                </div>
            `; 
        });
    }
    track.innerHTML = slidesHTML;
}
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
