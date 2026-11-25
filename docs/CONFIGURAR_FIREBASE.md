# Como ativar o login (Firebase) no EducaTEA

Enquanto isso não for feito, o site funciona normalmente, só que sem o botão "Entrar".
Tudo abaixo é gratuito (plano Spark) e leva uns 15 minutos.

## 1. Criar o projeto
1. Entre em https://console.firebase.google.com com uma conta Google.
2. **Adicionar projeto** → nome `EducaTEA` → pode desativar o Google Analytics → **Criar projeto**.

## 2. Ligar o login por e-mail e senha
1. Menu **Build → Authentication → Começar**.
2. Aba **Sign-in method** → **E-mail/senha** → ativar → **Salvar**.
3. Aba **Settings → Authorized domains → Adicionar domínio**: `over-player.github.io` (o endereço do seu site no GitHub Pages).

## 3. Criar o banco de dados
1. Menu **Build → Firestore Database → Criar banco de dados**.
2. Local: `southamerica-east1 (São Paulo)`. Modo: **produção**.
3. Aba **Regras**: apague tudo, cole o conteúdo do arquivo `docs/firestore.rules` e clique em **Publicar**.

## 4. Pegar a configuração do site
1. Engrenagem ⚙️ → **Configurações do projeto** → em **Seus apps** clique no ícone `</>` (Web).
2. Apelido `EducaTEA` → **Registrar app** (não precisa de Hosting).
3. Copie os valores de `firebaseConfig` para o arquivo `js/firebase-config.js`
   (apiKey, authDomain, projectId, storageBucket, messagingSenderId, appId) e envie ao GitHub.
   Esses valores podem ficar públicos: quem protege os dados são as regras do passo 3.

## 5. Criar a conta de administrador (a sua)
O administrador faz tudo o que o professor faz e ainda libera ou retira o acesso de professores, direto no site.
1. No site, clique em **Entrar → Criar conta** com o seu e-mail.
2. No Firebase: **Firestore Database → Iniciar coleção** → ID da coleção: `admins`.
3. **ID do documento: o seu e-mail, em minúsculas** (ex.: `voce@email.com`). Adicione um campo qualquer, como `nome` (string) → **Salvar**.
4. Saia e entre de novo no site: aparece **Administração** no menu.

Esse é o único passo feito no console. Daqui para frente, para liberar um professor:
1. O professor cria a conta no site (Entrar → Criar conta).
2. Você abre **Administração**, digita o e-mail dele em **Professores com acesso** e clica em **Liberar acesso**.
3. Para tirar o acesso, clique em **Retirar acesso** ao lado do e-mail.

## Como o professor e o administrador usam
- **Adicionar alunos à turma:** um por linha, `Nome, e-mail`. Quem ainda não criou conta aparece como "Não cadastrado".
- O aluno cria a conta com **o mesmo e-mail** e passa a aparecer como "Cadastrado", com pontos, conquistas e desempenho por jogo.
- Quem criar conta e não estiver na lista aparece como "Fora da lista", com um botão para adicionar à turma.
- **Baixar planilha (CSV)** abre direto no Excel.
- Só o administrador vê o bloco **Professores com acesso** e o botão **Apagar dados deste aluno** (apaga o progresso na nuvem, não a conta de login).

## Observações importantes
- O progresso é enviado quando o aluno joga (alguns segundos depois de cada resposta).
- Ao sair da conta, o progresso é apagado **deste computador** (continua salvo na nuvem), para o próximo aluno começar do zero.
- Os dados do progresso são enviados pelo navegador do aluno; um aluno muito técnico poderia alterar o próprio progresso. Para o uso escolar isso é aceitável, mas vale citar como limitação.
- Por lei (LGPD), alunos menores precisam de autorização dos responsáveis para terem nome e e-mail guardados. Combine isso com a escola.
- Se um aluno esquecer a senha, ele usa "Esqueci minha senha" na tela de entrada.
