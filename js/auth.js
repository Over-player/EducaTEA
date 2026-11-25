/* =============================================================================
   LOGIN DE ALUNOS E PROFESSORES  +  PAINEL DO PROFESSOR   (Firebase)

   O QUE FAZ
   • Aluno: cria conta / entra; o progresso (pontos, conquistas, desempenho nos
     jogos) é salvo na nuvem e acompanha o aluno em qualquer computador.
     Entrar é opcional: sem conta o site funciona como sempre.
   • Professor: vê a turma, quem já se cadastrou e quem não, o progresso e o
     desempenho de cada aluno.
   • Administrador: faz tudo o que o professor faz e ainda libera/retira o
     acesso de professores e apaga dados de alunos. A conta de administrador é
     criada por você no console do Firebase (veja docs/CONFIGURAR_FIREBASE.md).

   ESTRUTURA DO ARQUIVO
   1. CONFIGURAÇÃO   – carrega o SDK do Firebase (só se firebase-config.js estiver preenchido)
   2. UTILITÁRIOS    – funções pequenas
   3. CONTA          – entrar, criar conta, sair, trocar de aluno
   4. NUVEM          – envia o progresso do aluno (aoSalvar)
   5. JANELA         – tela de login
   6. PAINEL         – painel do professor
   7. INICIAR
   ============================================================================= */
(function () {
    'use strict';

    const VERSAO_SDK = '10.12.2';
    const SDK = ['app', 'auth', 'firestore'].map(n =>
        `https://www.gstatic.com/firebasejs/${VERSAO_SDK}/firebase-${n}-compat.js`);

    const CHAVE_PROGRESSO = 'progresso_educa_tea';      // mesma chave usada por script.js
    const CHAVE_DONO      = 'educatea_dono_progresso';  // uid de quem é o progresso guardado neste computador

    let auth = null, db = null;
    let usuario = null;          // usuário do Firebase
    let papel = null;            // 'aluno' | 'professor' | 'admin' | null
    let nomeNovo = '';           // nome digitado no cadastro (usado até o perfil existir)
    let temporizador = null;     // espera antes de enviar o progresso
    let turma = [], contas = [], emailsProfessores = [], emailsAdmins = [];
    const ehEquipe = () => papel === 'professor' || papel === 'admin';   // quem pode abrir o painel

    /* ------------------------------------------------------------ 1. CONFIGURAÇÃO */
    function configuracaoPreenchida() {
        const c = window.FIREBASE_CONFIG || {};
        return !!(c.apiKey && c.projectId && c.appId);
    }

    function carregarScript(url) {
        return new Promise((ok, erro) => {
            const s = document.createElement('script');
            s.src = url; s.onload = ok; s.onerror = () => erro(new Error('Não carregou: ' + url));
            document.head.appendChild(s);
        });
    }

    async function carregarFirebase() {
        if (!window.firebase) for (const url of SDK) await carregarScript(url);   // em ordem
        if (!firebase.apps.length) firebase.initializeApp(window.FIREBASE_CONFIG);
        auth = firebase.auth();
        db = firebase.firestore();
    }

    /* -------------------------------------------------------------- 2. UTILITÁRIOS */
    const $ = id => document.getElementById(id);
    const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const emailLimpo = e => String(e || '').trim().toLowerCase();
    const primeiroNome = n => String(n || '').trim().split(/\s+/)[0] || 'Aluno';

    function aviso(texto, ok = true) {
        if (typeof mostrarMensagem === 'function') mostrarMensagem(texto, ok);
        else alert(texto);
    }

    function lerProgressoLocal() {
        try { return JSON.parse(localStorage.getItem(CHAVE_PROGRESSO)) || null; } catch (e) { return null; }
    }

    function traduzirErro(e) {
        const m = {
            'auth/email-already-in-use': 'Este e-mail já tem uma conta. Use "Entrar".',
            'auth/invalid-email': 'E-mail inválido.',
            'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
            'auth/user-not-found': 'E-mail ou senha incorretos.',
            'auth/wrong-password': 'E-mail ou senha incorretos.',
            'auth/invalid-credential': 'E-mail ou senha incorretos.',
            'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
            'auth/network-request-failed': 'Sem internet. Verifique a conexão.',
            'permission-denied': 'Sem permissão. Confira as regras do Firestore.'
        };
        return m[e && (e.code || '')] || 'Não deu certo. Tente de novo.';
    }

    /* ------------------------------------------------------------------- 3. CONTA */
    // coloca o progresso da nuvem na tela
    function aplicarProgresso(progresso) {
        if (progresso) localStorage.setItem(CHAVE_PROGRESSO, JSON.stringify(progresso));
        else localStorage.removeItem(CHAVE_PROGRESSO);
        carregarProgresso();
        renderConquistas();
    }

    async function entrouNaConta(user) {
        usuario = user;
        const email = emailLimpo(user.email);

        let ehAdmin = false, ehProfessor = false;
        try { ehAdmin = (await db.collection('admins').doc(email).get()).exists; } catch (e) { /* não é administrador */ }
        if (!ehAdmin) {
            try { ehProfessor = (await db.collection('professores').doc(email).get()).exists; } catch (e) { /* não é professor */ }
        }

        if (ehAdmin) {
            papel = 'admin';
        } else if (ehProfessor) {
            papel = 'professor';
        } else {
            papel = 'aluno';
            await sincronizarAoEntrar(user);
        }
        atualizarInterface();
    }

    // Aluno: traz o progresso da nuvem (ou envia o deste computador, se for a primeira vez)
    async function sincronizarAoEntrar(user) {
        const ref = db.collection('alunos').doc(user.uid);
        const doc = await ref.get();
        const local = lerProgressoLocal();
        const donoLocal = localStorage.getItem(CHAVE_DONO);

        if (doc.exists && doc.data().progresso) {
            const temPontosDeOutro = local && local.pontuacaoTotal > 0 && donoLocal !== user.uid;
            if (temPontosDeOutro &&
                !confirm('Este computador tem um progresso que não é desta conta.\nCarregar o progresso salvo na sua conta e substituir o deste computador?')) {
                return;   // mantém como está (não troca nada)
            }
            aplicarProgresso(doc.data().progresso);
        } else {
            // primeira vez: cria o perfil; o progresso deste computador vira o da conta
            await ref.set({
                nome: user.displayName || nomeNovo || 'Aluno',
                email: emailLimpo(user.email),
                criadoEm: new Date().toISOString(),
                atualizadoEm: new Date().toISOString(),
                progresso: local || null
            }, { merge: true });
        }
        localStorage.setItem(CHAVE_DONO, user.uid);
    }

    async function entrar(email, senha) {
        await auth.signInWithEmailAndPassword(emailLimpo(email), senha);
    }

    async function criarConta(nome, email, senha) {
        nomeNovo = nome.trim();
        const cred = await auth.createUserWithEmailAndPassword(emailLimpo(email), senha);
        try { await cred.user.updateProfile({ displayName: nomeNovo }); } catch (e) { /* o nome vai no perfil de qualquer jeito */ }
    }

    async function sair() {
        await enviarAgora();                           // não perde o que ainda não foi enviado
        const eraAluno = papel === 'aluno';
        await auth.signOut();
        usuario = null; papel = null;
        if (eraAluno) {                                // o próximo aluno do computador começa do zero
            zerarProgressoLocal();
            localStorage.removeItem(CHAVE_DONO);
        }
        atualizarInterface();
        navigateHome();
    }

    /* ------------------------------------------------------------------- 4. NUVEM */
    function dadosParaNuvem(progresso) {
        return {
            nome: usuario.displayName || nomeNovo || 'Aluno',
            email: emailLimpo(usuario.email),
            atualizadoEm: new Date().toISOString(),
            progresso: JSON.parse(JSON.stringify(progresso))   // tira valores undefined (o Firestore não aceita)
        };
    }

    let pendente = null;

    function aoSalvar(progresso) {
        if (papel !== 'aluno' || !usuario) return;
        localStorage.setItem(CHAVE_DONO, usuario.uid);
        pendente = progresso;
        clearTimeout(temporizador);
        temporizador = setTimeout(enviarAgora, 4000);     // junta várias respostas seguidas em um envio só
    }

    async function enviarAgora() {
        clearTimeout(temporizador);
        if (!pendente || papel !== 'aluno' || !usuario) return;
        const dados = dadosParaNuvem(pendente);
        pendente = null;
        try { await db.collection('alunos').doc(usuario.uid).set(dados, { merge: true }); }
        catch (e) { console.warn('Não foi possível salvar o progresso na nuvem:', e); }
    }

    /* ------------------------------------------------------------------ 5. JANELA */
    function htmlJanela() {
        return `
        <div class="auth-modal" id="auth-modal" hidden>
            <div class="auth-caixa" role="dialog" aria-modal="true" aria-labelledby="auth-titulo">
                <button type="button" class="auth-fechar" id="auth-fechar" aria-label="Fechar">✕</button>
                <h2 id="auth-titulo">👤 Minha conta</h2>
                <div id="auth-conteudo"></div>
            </div>
        </div>`;
    }

    function telaEntrada(aba) {
        const criar = aba === 'criar';
        return `
            <div class="auth-abas" role="tablist">
                <button type="button" role="tab" class="${criar ? '' : 'ativa'}" data-aba="entrar">Entrar</button>
                <button type="button" role="tab" class="${criar ? 'ativa' : ''}" data-aba="criar">Criar conta</button>
            </div>
            <form id="auth-form" novalidate>
                ${criar ? '<label>Seu nome<input id="auth-nome" type="text" autocomplete="name" maxlength="60" required></label>' : ''}
                <label>E-mail<input id="auth-email" type="email" autocomplete="email" required></label>
                <label>Senha<input id="auth-senha" type="password" autocomplete="${criar ? 'new-password' : 'current-password'}" minlength="6" required></label>
                <p class="auth-erro" id="auth-erro" role="alert" hidden></p>
                <button type="submit" class="auth-botao">${criar ? 'Criar minha conta' : 'Entrar'}</button>
                ${criar ? '' : '<button type="button" class="auth-link" id="auth-esqueci">Esqueci minha senha</button>'}
            </form>
            <p class="auth-dica">${criar
                ? 'Seu progresso e suas conquistas ficam salvos na conta e seu professor poderá acompanhá-los.'
                : 'Entrar é opcional. Sem conta, você joga normalmente, mas o progresso fica só neste computador.'}</p>`;
    }

    function telaConta() {
        const prof = ehEquipe();
        const rotulo = papel === 'admin' ? 'Administrador(a)' : prof ? 'Professor(a)' : 'Aluno(a)';
        return `
            <p class="auth-ola">Olá, <strong>${esc(usuario.displayName || primeiroNome(usuario.email))}</strong>!</p>
            <p class="auth-dica">${esc(usuario.email)} · ${rotulo}</p>
            ${prof ? `<button type="button" class="auth-botao" id="auth-painel">${papel === 'admin' ? '🛡️ Abrir painel de administração' : '👩‍🏫 Abrir painel do professor'}</button>`
                   : '<p class="auth-dica">✅ Seu progresso está sendo salvo na conta.</p>'}
            <button type="button" class="auth-botao auth-sair" id="auth-sair">Sair da conta</button>`;
    }

    function desenharJanela(aba) {
        $('auth-conteudo').innerHTML = usuario ? telaConta() : telaEntrada(aba);
        $('auth-titulo').textContent = usuario ? '👤 Minha conta' : '👤 Entrar no EducaTEA';
    }

    function abrirJanela(aba = 'entrar') {
        desenharJanela(aba);
        $('auth-modal').hidden = false;
        document.body.classList.add('tcc-lendo');
        const primeiro = $('auth-conteudo').querySelector('input, button');
        if (primeiro) primeiro.focus();
    }

    function fecharJanela() {
        $('auth-modal').hidden = true;
        document.body.classList.remove('tcc-lendo');
    }

    function mostrarErro(texto) {
        const p = $('auth-erro'); if (!p) return;
        p.textContent = texto; p.hidden = !texto;
    }

    async function enviarFormulario(e) {
        e.preventDefault();
        const criar = !!$('auth-nome');
        const nome = criar ? $('auth-nome').value : '';
        const email = $('auth-email').value, senha = $('auth-senha').value;
        if (criar && !nome.trim()) return mostrarErro('Digite o seu nome.');
        if (!email.trim() || !senha) return mostrarErro('Preencha o e-mail e a senha.');
        const botao = e.submitter || $('auth-form').querySelector('.auth-botao');
        botao.disabled = true; mostrarErro('');
        try {
            if (criar) await criarConta(nome, email, senha); else await entrar(email, senha);
            await esperarPapel();
            fecharJanela();
            aviso('✅ Tudo certo, ' + primeiroNome(usuario.displayName || nome) + '!', true);
        } catch (erro) {
            mostrarErro(traduzirErro(erro));
            botao.disabled = false;
        }
    }

    // o onAuthStateChanged termina de preparar a conta; esperamos ele acabar
    function esperarPapel() {
        return new Promise(ok => {
            const t0 = Date.now();
            (function ver() { if (papel || Date.now() - t0 > 8000) ok(); else setTimeout(ver, 50); })();
        });
    }

    async function esqueciSenha() {
        const email = $('auth-email').value.trim();
        if (!email) return mostrarErro('Digite o e-mail para receber o link.');
        try { await auth.sendPasswordResetEmail(emailLimpo(email)); mostrarErro(''); aviso('📧 Enviamos um link para criar uma nova senha.', true); }
        catch (e) { mostrarErro(traduzirErro(e)); }
    }

    function ligarJanela() {
        $('auth-fechar').addEventListener('click', fecharJanela);
        $('auth-modal').addEventListener('click', e => { if (e.target.id === 'auth-modal') fecharJanela(); });
        document.addEventListener('keydown', e => { if (e.key === 'Escape' && !$('auth-modal').hidden) fecharJanela(); });
        $('auth-conteudo').addEventListener('click', e => {
            const alvo = e.target.closest('button'); if (!alvo) return;
            if (alvo.dataset.aba) desenharJanela(alvo.dataset.aba);
            else if (alvo.id === 'auth-sair') { fecharJanela(); sair(); }
            else if (alvo.id === 'auth-painel') { fecharJanela(); abrirPainel(); }
            else if (alvo.id === 'auth-esqueci') esqueciSenha();
        });
        $('auth-conteudo').addEventListener('submit', e => { if (e.target.id === 'auth-form') enviarFormulario(e); });
        $('btn-conta').addEventListener('click', () => abrirJanela());
    }

    function atualizarInterface() {
        const botao = $('btn-conta');
        botao.hidden = false;
        botao.textContent = usuario ? '👤 ' + primeiroNome(usuario.displayName || usuario.email) : '👤 Entrar';
        const nav = $('nav-professor');
        if (nav) { nav.hidden = !ehEquipe(); nav.lastChild.textContent = papel === 'admin' ? ' Administração' : ' Painel do Professor'; }
        if (!ehEquipe() && $('professor-section')) $('professor-section').classList.remove('active');
    }

    /* ------------------------------------------------------------------ 6. PAINEL */
    function nomesDosJogos() {
        const nomes = [];
        document.querySelectorAll('.sub-item[onclick*="carregarJogo("]').forEach(li => {
            const m = li.getAttribute('onclick').match(/carregarJogo\('([^']+)'\)/);
            if (m && !nomes.includes(m[1])) nomes.push(m[1]);
        });
        return nomes;
    }

    function resumo(progresso) {
        const p = progresso || {};
        const stats = p.estatisticasJogos || {}, ex = p.extras || {};
        let acertos = 0, erros = 0;
        Object.values(stats).forEach(s => { acertos += s.acertos || 0; erros += s.erros || 0; });
        const total = acertos + erros;
        const dias = (ex.dias || []).slice().sort();
        return {
            nivel: p.nivel || 1,
            pontos: p.pontuacaoTotal || 0,
            acertos, erros,
            pct: total ? Math.round(acertos / total * 100) : null,
            melhorStreak: p.melhorStreak || 0,
            conquistas: (p.conquistas || []).length,
            rodadas: ex.rodadas || 0,
            dias: dias.length,
            ultimoDia: dias.length ? dias[dias.length - 1] : null,
            areas: ex.areas || {},
            stats, rodadasPorJogo: ex.rodadasPorJogo || {}
        };
    }

    function faixa(pct) {
        if (pct == null) return { txt: 'Sem dados', cls: 'sem' };
        if (pct >= 80) return { txt: 'Ótimo', cls: 'otimo' };
        if (pct >= 50) return { txt: 'Em desenvolvimento', cls: 'medio' };
        return { txt: 'Precisa de apoio', cls: 'baixo' };
    }

    function dataBR(iso) {
        if (!iso) return '—';
        const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
        return isNaN(d) ? '—' : d.toLocaleDateString('pt-BR');
    }

    function diasDesde(iso) {
        if (!iso) return null;
        const d = new Date(iso.length === 10 ? iso + 'T12:00:00' : iso);
        return isNaN(d) ? null : Math.floor((Date.now() - d.getTime()) / 86400000);
    }

    async function carregarDadosPainel() {
        const [t, a, p, ad] = await Promise.all([
            db.collection('turma').get(),
            db.collection('alunos').get(),
            db.collection('professores').get(),
            papel === 'admin' ? db.collection('admins').get() : Promise.resolve({ forEach() {} })
        ]);
        turma = []; t.forEach(d => turma.push({ email: d.id, ...d.data() }));
        contas = []; a.forEach(d => contas.push({ uid: d.id, ...d.data() }));
        emailsProfessores = []; p.forEach(d => emailsProfessores.push(d.id));
        emailsAdmins = []; ad.forEach(d => emailsAdmins.push(d.id));
        // professores e administradores não entram na lista de alunos
        contas = contas.filter(c => !emailsProfessores.includes(emailLimpo(c.email)) && !emailsAdmins.includes(emailLimpo(c.email)));
    }

    // junta a lista da turma com as contas criadas
    function linhasDaTurma() {
        const linhas = turma.map(t => {
            const conta = contas.find(c => emailLimpo(c.email) === t.email);
            return { nome: (conta && conta.nome) || t.nome || t.email, email: t.email, conta, naLista: true, resumo: conta ? resumo(conta.progresso) : null };
        });
        contas.forEach(c => {
            if (!turma.some(t => t.email === emailLimpo(c.email)))
                linhas.push({ nome: c.nome || c.email, email: emailLimpo(c.email), conta: c, naLista: false, resumo: resumo(c.progresso) });
        });
        return linhas.sort((x, y) => x.nome.localeCompare(y.nome, 'pt-BR'));
    }

    function htmlPainel() {
        const linhas = linhasDaTurma();
        const cadastrados = linhas.filter(l => l.conta);
        const naLista = linhas.filter(l => l.naLista);
        const faltam = naLista.filter(l => !l.conta).length;
        const comPct = cadastrados.filter(l => l.resumo && l.resumo.pct != null);
        const media = comPct.length ? Math.round(comPct.reduce((s, l) => s + l.resumo.pct, 0) / comPct.length) : null;
        const ativos = cadastrados.filter(l => { const d = diasDesde(l.resumo && l.resumo.ultimoDia); return d != null && d <= 7; }).length;

        const cartao = (n, t) => `<div class="prof-cartao"><strong>${n}</strong><span>${t}</span></div>`;
        const linhaHtml = l => {
            const r = l.resumo, f = faixa(r && r.pct);
            const situacao = l.conta ? '<span class="prof-tag ok">✅ Cadastrado</span>' : '<span class="prof-tag pend">⏳ Não cadastrado</span>';
            const fora = l.naLista ? '' : ' <span class="prof-tag fora">Fora da lista</span>';
            return `<tr>
                <td data-rotulo="Aluno"><strong>${esc(l.nome)}</strong>${fora}<br><small>${esc(l.email)}</small></td>
                <td data-rotulo="Situação">${situacao}</td>
                <td data-rotulo="Nível">${r ? r.nivel : '—'}</td>
                <td data-rotulo="Pontos">${r ? r.pontos : '—'}</td>
                <td data-rotulo="Acertos">${r && r.pct != null ? `<span class="prof-faixa ${f.cls}">${r.pct}% · ${f.txt}</span>` : '—'}</td>
                <td data-rotulo="Conquistas">${r ? r.conquistas : '—'}</td>
                <td data-rotulo="Última atividade">${r ? dataBR(r.ultimoDia) : '—'}</td>
                <td class="prof-acoes">
                    ${l.conta ? `<button type="button" data-ver="${esc(l.email)}">Ver detalhes</button>` : ''}
                    ${l.naLista ? `<button type="button" class="perigo" data-tirar="${esc(l.email)}" aria-label="Tirar ${esc(l.nome)} da turma">Tirar</button>`
                                : `<button type="button" data-por="${esc(l.email)}">Adicionar à turma</button>`}
                </td></tr>`;
        };

        return `
        <div class="prof-topo">
            <h2>${papel === 'admin' ? '🛡️ Administração' : '👩‍🏫 Painel do Professor'}</h2>
            <div class="prof-botoes">
                <button type="button" id="prof-atualizar">🔄 Atualizar</button>
                <button type="button" id="prof-csv">⬇️ Baixar planilha (CSV)</button>
            </div>
        </div>

        <div class="prof-cartoes">
            ${cartao(naLista.length, 'alunos na turma')}
            ${cartao(naLista.length - faltam, 'já cadastrados')}
            ${cartao(faltam, 'ainda não cadastrados')}
            ${cartao(media == null ? '—' : media + '%', 'média de acertos')}
            ${cartao(ativos, 'ativos nos últimos 7 dias')}
        </div>

        ${papel === 'admin' ? htmlAdmin() : ''}

        <div class="card-base prof-bloco">
            <h3>➕ Adicionar alunos à turma</h3>
            <p class="prof-ajuda">Escreva um aluno por linha: <code>Nome, e-mail</code>. O aluno aparece como "não cadastrado" até criar a conta com esse mesmo e-mail.</p>
            <textarea id="prof-novos" rows="3" placeholder="Ana Souza, ana@email.com&#10;João Lima, joao@email.com"></textarea>
            <button type="button" class="auth-botao" id="prof-adicionar">Adicionar à turma</button>
            <p class="auth-erro" id="prof-msg" role="status" hidden></p>
        </div>

        <div class="card-base prof-bloco">
            <h3>📋 Turma</h3>
            ${linhas.length ? `<div class="prof-tabela-box"><table class="prof-tabela">
                <thead><tr><th>Aluno</th><th>Situação</th><th>Nível</th><th>Pontos</th><th>Acertos</th><th>Conquistas</th><th>Última atividade</th><th></th></tr></thead>
                <tbody>${linhas.map(linhaHtml).join('')}</tbody></table></div>`
                : '<p class="prof-ajuda">Nenhum aluno ainda. Adicione alunos acima.</p>'}
        </div>`;
    }

    // só o administrador vê: libera ou retira o acesso de professores sem usar o console do Firebase
    function htmlAdmin() {
        const linhas = emailsProfessores.map(e => `<li><span>${esc(e)}</span>
            <button type="button" class="perigo" data-tirarprof="${esc(e)}">Retirar acesso</button></li>`).join('');
        return `
        <div class="card-base prof-bloco prof-admin">
            <h3>🛡️ Professores com acesso</h3>
            <p class="prof-ajuda">Quem estiver aqui vê o painel da turma. A pessoa precisa ter uma conta criada no site com o mesmo e-mail.</p>
            ${linhas ? `<ul class="prof-lista">${linhas}</ul>` : '<p class="prof-ajuda">Nenhum professor liberado ainda.</p>'}
            <div class="prof-linha">
                <input id="prof-novo-email" type="email" placeholder="e-mail do professor" aria-label="E-mail do professor">
                <button type="button" class="auth-botao" id="prof-liberar">Liberar acesso</button>
            </div>
            <p class="auth-erro" id="prof-msg-adm" role="status" hidden></p>
        </div>`;
    }

    async function liberarProfessor() {
        const email = emailLimpo($('prof-novo-email').value);
        const msg = $('prof-msg-adm');
        if (!/^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(email)) { msg.textContent = 'Digite um e-mail válido.'; msg.hidden = false; return; }
        try {
            await db.collection('professores').doc(email).set({ liberadoEm: new Date().toISOString(), liberadoPor: emailLimpo(usuario.email) });
            await carregarDadosPainel(); desenharPainel();
        } catch (e) { msg.textContent = traduzirErro(e); msg.hidden = false; }
    }

    async function retirarProfessor(email) {
        if (!confirm('Retirar o acesso de ' + email + '? Ele(a) vira aluno(a) comum.')) return;
        try { await db.collection('professores').doc(email).delete(); await carregarDadosPainel(); desenharPainel(); }
        catch (e) { aviso(traduzirErro(e), false); }
    }

    async function apagarDadosAluno(uid, nome) {
        if (!confirm('Apagar os dados e o progresso de ' + nome + ' da nuvem?\nA conta de login continua existindo, mas o progresso é perdido. Não dá para desfazer.')) return;
        try { await db.collection('alunos').doc(uid).delete(); await carregarDadosPainel(); desenharPainel(); }
        catch (e) { aviso(traduzirErro(e), false); }
    }

    function htmlDetalhe(l) {
        const r = l.resumo, f = faixa(r.pct);
        const todos = nomesDosJogos();
        const jogados = todos.filter(j => (r.stats[j] && (r.stats[j].acertos + r.stats[j].erros) > 0) || r.rodadasPorJogo[j]);
        const naoJogados = todos.filter(j => !jogados.includes(j));
        const linhasJogos = jogados.map(j => {
            const s = r.stats[j] || { acertos: 0, erros: 0 }, t = s.acertos + s.erros;
            const pct = t ? Math.round(s.acertos / t * 100) : null, fj = faixa(pct);
            return `<tr><td>${esc(j)}</td><td>${s.acertos}</td><td>${s.erros}</td><td>${r.rodadasPorJogo[j] || 0}</td>
                <td>${pct == null ? '—' : `<span class="prof-barra"><i class="${fj.cls}" style="width:${pct}%"></i></span> ${pct}%`}</td></tr>`;
        }).join('');
        const a = r.areas;
        return `
            <button type="button" class="prof-voltar" id="prof-voltar">← Voltar para a turma</button>
            ${papel === 'admin' ? `<button type="button" class="prof-voltar perigo" data-apagar="${esc(l.conta.uid)}" data-nome="${esc(l.nome)}">🗑️ Apagar dados deste aluno</button>` : ''}
            <h3>${esc(l.nome)}</h3>
            <p class="prof-ajuda">${esc(l.email)} · conta criada em ${dataBR(l.conta.criadoEm)}</p>
            <div class="prof-cartoes">
                <div class="prof-cartao"><strong>${r.nivel}</strong><span>nível</span></div>
                <div class="prof-cartao"><strong>${r.pontos}</strong><span>pontos</span></div>
                <div class="prof-cartao"><strong>${r.pct == null ? '—' : r.pct + '%'}</strong><span>acertos · ${f.txt}</span></div>
                <div class="prof-cartao"><strong>${r.conquistas}${typeof CONQUISTAS !== 'undefined' ? '/' + CONQUISTAS.length : ''}</strong><span>conquistas</span></div>
                <div class="prof-cartao"><strong>${r.melhorStreak}</strong><span>melhor sequência de acertos</span></div>
                <div class="prof-cartao"><strong>${r.dias}</strong><span>dias de uso</span></div>
                <div class="prof-cartao"><strong>${r.rodadas}</strong><span>rodadas jogadas</span></div>
                <div class="prof-cartao"><strong>${dataBR(r.ultimoDia)}</strong><span>última atividade</span></div>
            </div>
            <p class="prof-ajuda">Rodadas por área — Palavras: <b>${a.palavras || 0}</b> · Matemática: <b>${a.matematica || 0}</b> · Ciências: <b>${a.ciencias || 0}</b></p>
            <h4>Desempenho por jogo</h4>
            ${linhasJogos ? `<div class="prof-tabela-box"><table class="prof-tabela prof-simples">
                <thead><tr><th>Jogo</th><th>Acertos</th><th>Erros</th><th>Rodadas</th><th>Aproveitamento</th></tr></thead>
                <tbody>${linhasJogos}</tbody></table></div>` : '<p class="prof-ajuda">Este aluno ainda não jogou.</p>'}
            ${naoJogados.length && jogados.length ? `<h4>Ainda não jogou</h4><p class="prof-ajuda">${naoJogados.map(esc).join(' · ')}</p>` : ''}`;
    }

    async function abrirPainel() {
        if (!ehEquipe()) return;
        mostrarPagina('professor-section', 'nav-professor');
        const secao = $('professor-section');
        secao.innerHTML = '<p class="prof-ajuda">Carregando a turma…</p>';
        try { await carregarDadosPainel(); desenharPainel(); }
        catch (e) { secao.innerHTML = `<div class="card-base"><h3>Não foi possível carregar</h3><p>${esc(traduzirErro(e))}</p></div>`; }
    }

    function desenharPainel() { $('professor-section').innerHTML = htmlPainel(); }

    function mensagemPainel(texto, ok) {
        const p = $('prof-msg'); if (!p) return;
        p.textContent = texto; p.hidden = !texto; p.classList.toggle('ok', !!ok);
    }

    async function adicionarAlunos() {
        const linhas = $('prof-novos').value.split('\n').map(x => x.trim()).filter(Boolean);
        const validos = [], invalidos = [];
        linhas.forEach(l => {
            const partes = l.split(/[;,\t]/).map(x => x.trim());
            const email = emailLimpo(partes.length > 1 ? partes[partes.length - 1] : partes[0]);
            const nome = partes.length > 1 ? partes.slice(0, -1).join(', ') : '';
            if (/^[^\s@\/]+@[^\s@\/]+\.[^\s@\/]+$/.test(email)) validos.push({ nome, email }); else invalidos.push(l);
        });
        if (!validos.length) return mensagemPainel('Escreva ao menos um aluno no formato: Nome, e-mail', false);
        try {
            for (const v of validos) await db.collection('turma').doc(v.email).set({ nome: v.nome, adicionadoEm: new Date().toISOString() }, { merge: true });
            await carregarDadosPainel(); desenharPainel();
            mensagemPainel(`${validos.length} aluno(s) adicionado(s).` + (invalidos.length ? ` Não entenderam: ${invalidos.join(' | ')}` : ''), !invalidos.length);
        } catch (e) { mensagemPainel(traduzirErro(e), false); }
    }

    async function tirarDaTurma(email) {
        if (!confirm('Tirar ' + email + ' da turma?\n(A conta e o progresso do aluno não são apagados.)')) return;
        try { await db.collection('turma').doc(email).delete(); await carregarDadosPainel(); desenharPainel(); }
        catch (e) { aviso(traduzirErro(e), false); }
    }

    async function colocarNaTurma(email) {
        const conta = contas.find(c => emailLimpo(c.email) === email);
        try { await db.collection('turma').doc(email).set({ nome: (conta && conta.nome) || '', adicionadoEm: new Date().toISOString() }, { merge: true });
              await carregarDadosPainel(); desenharPainel(); }
        catch (e) { aviso(traduzirErro(e), false); }
    }

    function baixarCSV() {
        const aspas = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        const cab = ['Nome', 'E-mail', 'Situação', 'Nível', 'Pontos', 'Acertos (%)', 'Conquistas', 'Dias de uso', 'Rodadas', 'Última atividade'];
        const linhas = linhasDaTurma().map(l => {
            const r = l.resumo;
            return [l.nome, l.email, l.conta ? 'Cadastrado' : 'Não cadastrado', r ? r.nivel : '', r ? r.pontos : '',
                    r && r.pct != null ? r.pct : '', r ? r.conquistas : '', r ? r.dias : '', r ? r.rodadas : '', r ? dataBR(r.ultimoDia) : ''];
        });
        const texto = '﻿' + [cab, ...linhas].map(l => l.map(aspas).join(';')).join('\r\n');   // ; e BOM: o Excel em português abre certinho
        const link = document.createElement('a');
        link.href = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }));
        link.download = 'EducaTEA_turma.csv';
        document.body.appendChild(link); link.click(); link.remove();
    }

    function ligarPainel() {
        $('professor-section').addEventListener('click', e => {
            const b = e.target.closest('button'); if (!b) return;
            if (b.id === 'prof-atualizar') abrirPainel();
            else if (b.id === 'prof-csv') baixarCSV();
            else if (b.id === 'prof-adicionar') adicionarAlunos();
            else if (b.id === 'prof-voltar') desenharPainel();
            else if (b.dataset.ver) { const l = linhasDaTurma().find(x => x.email === b.dataset.ver); if (l && l.conta) $('professor-section').innerHTML = `<div class="card-base prof-bloco">${htmlDetalhe(l)}</div>`; }
            else if (b.dataset.tirar) tirarDaTurma(b.dataset.tirar);
            else if (b.dataset.por) colocarNaTurma(b.dataset.por);
            else if (b.id === 'prof-liberar') liberarProfessor();
            else if (b.dataset.tirarprof) retirarProfessor(b.dataset.tirarprof);
            else if (b.dataset.apagar) apagarDadosAluno(b.dataset.apagar, b.dataset.nome);
        });
    }

    /* ------------------------------------------------------------------ 7. INICIAR */
    async function iniciar() {
        window.EducaAuth = { aoSalvar };       // script.js chama isto a cada salvamento (não faz nada sem login)
        if (!configuracaoPreenchida()) return; // sem Firebase configurado: o site funciona sem conta

        try { await carregarFirebase(); }
        catch (e) { console.warn('Login indisponível (Firebase não carregou):', e); return; }

        const secao = $('professor-section');
        if (!secao || !$('btn-conta')) return;
        document.body.insertAdjacentHTML('beforeend', htmlJanela());
        ligarJanela(); ligarPainel();
        window.abrirPainelProfessor = abrirPainel;

        $('btn-conta').hidden = false;
        auth.onAuthStateChanged(user => {
            if (user) entrouNaConta(user).catch(e => { console.warn(e); papel = 'aluno'; atualizarInterface(); });
            else { usuario = null; papel = null; atualizarInterface(); }
        });

        document.addEventListener('visibilitychange', () => { if (document.hidden) enviarAgora(); });
        window.addEventListener('pagehide', enviarAgora);
    }

    iniciar();
})();
