/* =====================================================================
   EducaTEA – CONTEÚDO DOS JOGOS (jogos-dados.js)
   Aqui ficam os textos e perguntas. Para acrescentar conteúdo é só
   copiar uma linha e mudar. Tudo escrito com a grafia correta (acentos).
   ===================================================================== */
'use strict';

/* ---------- PALAVRAS (sílabas separadas por hífen + figura) ----------
   Usadas em: Monte a Palavra, Sílabas Mágicas, Ditado Visual,
   Qual é a Letra? e Memória de Palavras. */
const PALAVRAS_RAW = [
    ['ga-to', '🐱'], ['ca-chor-ro', '🐶'], ['pa-to', '🦆'], ['sa-po', '🐸'], ['lo-bo', '🐺'], ['le-ão', '🦁'],
    ['ma-ca-co', '🐒'], ['ca-va-lo', '🐴'], ['co-e-lho', '🐰'], ['va-ca', '🐮'], ['por-co', '🐷'], ['ga-li-nha', '🐔'],
    ['pei-xe', '🐟'], ['tar-ta-ru-ga', '🐢'], ['ba-lei-a', '🐳'], ['ur-so', '🐻'], ['ra-to', '🐭'], ['co-bra', '🐍'],
    ['a-be-lha', '🐝'], ['for-mi-ga', '🐜'], ['bor-bo-le-ta', '🦋'], ['e-le-fan-te', '🐘'], ['gi-ra-fa', '🦒'],
    ['pin-guim', '🐧'], ['ca-ran-gue-jo', '🦀'], ['co-ru-ja', '🦉'], ['pol-vo', '🐙'],
    ['ba-na-na', '🍌'], ['ma-çã', '🍎'], ['u-va', '🍇'], ['la-ran-ja', '🍊'], ['mo-ran-go', '🍓'], ['me-lan-ci-a', '🍉'],
    ['a-ba-ca-xi', '🍍'], ['li-mão', '🍋'], ['pê-ra', '🍐'], ['to-ma-te', '🍅'], ['ce-nou-ra', '🥕'], ['mi-lho', '🌽'],
    ['pi-po-ca', '🍿'], ['sor-ve-te', '🍦'], ['bo-lo', '🎂'], ['quei-jo', '🧀'], ['o-vo', '🥚'], ['cho-co-la-te', '🍫'],
    ['ca-sa', '🏠'], ['bo-la', '⚽'], ['li-vro', '📖'], ['re-ló-gio', '⏰'], ['te-le-fo-ne', '📞'], ['ca-mi-sa', '👕'],
    ['sa-pa-to', '👟'], ['cha-péu', '🎩'], ['ó-cu-los', '👓'], ['cha-ve', '🔑'], ['ba-lão', '🎈'],
    ['bi-ci-cle-ta', '🚲'], ['car-ro', '🚗'], ['a-vi-ão', '✈️'], ['fo-gue-te', '🚀'], ['ô-ni-bus', '🚌'], ['bar-co', '⛵'],
    ['es-co-la', '🏫'], ['es-tre-la', '⭐'], ['ár-vo-re', '🌳'], ['lu-a', '🌙'], ['nu-vem', '☁️'], ['chu-va', '🌧️'],
    ['co-ra-ção', '❤️'], ['pre-sen-te', '🎁'], ['ca-mi-nhão', '🚚'], ['tra-tor', '🚜'], ['pa-lha-ço', '🤡'],
    ['tam-bor', '🥁'], ['gui-tar-ra', '🎸'],
    // palavras curtas (de uma sílaba)
    ['sol', '☀️'], ['flor', '🌸'], ['pão', '🍞'], ['trem', '🚆'], ['mel', '🍯']
];
const PALAVRAS = PALAVRAS_RAW.map(([sil, emoji]) => {
    const silabas = sil.split('-').map(s => s.toUpperCase());
    return { palavra: silabas.join(''), silabas, emoji };
});

/* ---------- CIÊNCIAS: perguntas com explicação ----------
   [pergunta, emoji, resposta, [opções (inclui a resposta)], explicação] */
const CIENCIAS_RAW = {
    'Ciclo da Água': [
        ['O que acontece quando o Sol aquece a água dos rios e mares?', '☀️💧', 'evaporação', ['evaporação', 'condensação', 'precipitação', 'infiltração'], 'O calor do Sol transforma a água líquida em vapor, que sobe para o céu. Isso se chama evaporação.'],
        ['Lá no alto o vapor esfria e vira gotinhas que formam as nuvens. Como se chama isso?', '☁️', 'condensação', ['condensação', 'evaporação', 'fusão', 'erosão'], 'O vapor esfria e volta a ser gotinhas de água. Esse processo é a condensação.'],
        ['A água que cai das nuvens em forma de chuva se chama:', '🌧️', 'precipitação', ['precipitação', 'evaporação', 'condensação', 'nascente'], 'Quando as gotinhas ficam pesadas, elas caem. Essa queda de água se chama precipitação.'],
        ['Quando a água cai das nuvens congelada, ela pode ser:', '❄️', 'neve', ['neve', 'fumaça', 'areia', 'vento'], 'Em lugares muito frios a água cai congelada, como neve ou granizo.'],
        ['Depois da chuva, para onde a água corre?', '🏞️', 'rios e mares', ['rios e mares', 'para o espaço', 'para dentro do Sol', 'para a Lua'], 'Uma parte da água escorre para os rios e mares, e outra parte entra no solo.'],
        ['Qual é a fonte de calor que faz a água subir para o céu no ciclo da água?', '🌞', 'Sol', ['Sol', 'Lua', 'vento', 'estrelas'], 'É o calor do Sol que aquece a água e faz ela evaporar.'],
        ['O ciclo da água acontece:', '🔄', 'de novo e de novo', ['de novo e de novo', 'só uma vez', 'só no verão', 'só de noite'], 'A água faz esse caminho sem parar. Por isso se chama ciclo!'],
        ['As nuvens são feitas de:', '☁️', 'gotinhas de água', ['gotinhas de água', 'algodão', 'fumaça', 'poeira'], 'As nuvens são formadas por milhões de gotinhas minúsculas de água (ou de gelo).'],
        ['Uma roupa molhada seca no varal por causa da:', '👕☀️', 'evaporação', ['evaporação', 'condensação', 'precipitação', 'solidificação'], 'A água da roupa vira vapor e vai embora para o ar. É a evaporação.'],
        ['Num copo gelado aparecem gotinhas por fora. Isso acontece por causa da:', '🥤', 'condensação', ['condensação', 'evaporação', 'precipitação', 'erosão'], 'O vapor de água que está no ar esfria quando encosta no copo gelado e vira gotinhas.']
    ],
    'Animais e Habitats': [
        ['Onde vive o peixe?', '🐟', 'na água', ['na água', 'na terra', 'no ar', 'no fogo'], 'Os peixes vivem na água e respiram com as brânquias.'],
        ['Onde vive o camelo?', '🐪', 'no deserto', ['no deserto', 'no oceano', 'no polo norte', 'na floresta'], 'O camelo vive no deserto e consegue ficar muito tempo sem beber água.'],
        ['O urso-polar vive em lugares muito:', '❄️🐻', 'frios', ['frios', 'quentes', 'secos', 'barulhentos'], 'O urso-polar vive no gelo do Ártico e tem pelos grossos para se proteger do frio.'],
        ['O macaco vive principalmente:', '🐒', 'nas árvores da floresta', ['nas árvores da floresta', 'no fundo do mar', 'no deserto', 'em cavernas de gelo'], 'Macacos são ótimos para subir e pular de galho em galho.'],
        ['Qual destes animais voa?', '🦅', 'águia', ['águia', 'cachorro', 'peixe', 'vaca'], 'A águia é uma ave e tem asas para voar.'],
        ['A baleia vive no mar, mas ela é um:', '🐳', 'mamífero', ['mamífero', 'peixe', 'inseto', 'réptil'], 'A baleia respira ar pelos pulmões e amamenta o filhote. Por isso é um mamífero.'],
        ['Quem produz o mel?', '🍯', 'a abelha', ['a abelha', 'a formiga', 'a borboleta', 'a aranha'], 'As abelhas transformam o néctar das flores em mel.'],
        ['Qual destes animais é uma ave?', '🐧', 'pinguim', ['pinguim', 'golfinho', 'tubarão', 'sapo'], 'O pinguim tem penas e bota ovos: é uma ave que não voa, mas nada muito bem!'],
        ['O sapo começa a vida na água como:', '🐸', 'girino', ['girino', 'lagarta', 'casulo', 'filhote de cachorro'], 'O sapo nasce como girino, com rabinho, e depois se transforma.'],
        ['A lagarta, depois de crescer, vira:', '🐛', 'borboleta', ['borboleta', 'abelha', 'formiga', 'aranha'], 'A lagarta faz um casulo e sai de lá como borboleta. Essa mudança se chama metamorfose.']
    ],
    'Corpo Humano': [
        ['Qual órgão bombeia o sangue pelo corpo?', '❤️', 'coração', ['coração', 'pulmão', 'cérebro', 'estômago'], 'O coração funciona como uma bomba e faz o sangue circular.'],
        ['Com qual órgão a gente respira?', '🌬️', 'pulmões', ['pulmões', 'estômago', 'rins', 'coração'], 'O ar entra pelo nariz e vai até os pulmões.'],
        ['Qual órgão controla o corpo e nos ajuda a pensar?', '🧠', 'cérebro', ['cérebro', 'fígado', 'estômago', 'joelho'], 'O cérebro é o “chefe” do corpo: pensa, lembra e manda recados para todas as partes.'],
        ['Em qual órgão a comida é digerida?', '🍽️', 'estômago', ['estômago', 'pulmão', 'olho', 'orelha'], 'No estômago a comida é misturada e começa a virar energia para o corpo.'],
        ['Para que servem os ossos?', '🦴', 'sustentar o corpo', ['sustentar o corpo', 'digerir a comida', 'ouvir sons', 'sentir cheiros'], 'Os ossos formam o esqueleto, que dá forma e firmeza ao corpo.'],
        ['As costelas protegem principalmente:', '🫁', 'o coração e os pulmões', ['o coração e os pulmões', 'o cérebro', 'os dedos', 'os joelhos'], 'As costelas formam uma “gaiola” que protege órgãos importantes.'],
        ['Para que servem os dentes?', '🦷', 'mastigar os alimentos', ['mastigar os alimentos', 'ouvir sons', 'enxergar', 'respirar'], 'Os dentes cortam e trituram a comida, e isso ajuda a digestão.'],
        ['Para ter ossos e dentes fortes, devemos tomar:', '🥛', 'leite e comer queijo', ['leite e comer queijo', 'só refrigerante', 'só doces', 'nada'], 'O leite e seus derivados têm cálcio, que fortalece ossos e dentes.'],
        ['Antes de comer, devemos lavar as:', '🧼', 'mãos', ['mãos', 'orelhas', 'sobrancelhas', 'joelhos'], 'Lavar as mãos tira os germes e protege a gente de doenças.'],
        ['Qual parte do corpo usamos para enxergar?', '👀', 'olhos', ['olhos', 'orelhas', 'nariz', 'dedos'], 'Os olhos captam a luz e mandam as imagens para o cérebro.']
    ],
    'Reciclagem': [
        ['Qual é a cor da lixeira para PAPEL?', '📄', 'azul', ['azul', 'verde', 'amarelo', 'vermelho'], 'Na coleta seletiva: azul é papel.'],
        ['Qual é a cor da lixeira para PLÁSTICO?', '🥤', 'vermelha', ['vermelha', 'azul', 'verde', 'amarela'], 'Na coleta seletiva: vermelho é plástico.'],
        ['Qual é a cor da lixeira para VIDRO?', '🍾', 'verde', ['verde', 'vermelha', 'azul', 'amarela'], 'Na coleta seletiva: verde é vidro.'],
        ['Qual é a cor da lixeira para METAL (como latas)?', '🥫', 'amarela', ['amarela', 'verde', 'azul', 'marrom'], 'Na coleta seletiva: amarelo é metal.'],
        ['Qual é a cor da lixeira para restos de comida (orgânico)?', '🍌', 'marrom', ['marrom', 'azul', 'amarela', 'vermelha'], 'Na coleta seletiva: marrom é lixo orgânico, como cascas e restos de comida.'],
        ['Qual destes objetos pode ser reciclado?', '♻️', 'garrafa de plástico', ['garrafa de plástico', 'casca de banana', 'papel higiênico usado', 'fralda suja'], 'O plástico limpo vai para a reciclagem e vira outros objetos.'],
        ['Os 3 Rs são: Reduzir, Reutilizar e…', '3️⃣', 'Reciclar', ['Reciclar', 'Remendar', 'Rabiscar', 'Revelar'], 'Reduzir o consumo, reutilizar o que já temos e reciclar o que não dá mais para usar.'],
        ['Pilhas e baterias devem ser:', '🔋', 'levadas a pontos de coleta', ['levadas a pontos de coleta', 'jogadas no rio', 'queimadas', 'enterradas no quintal'], 'Pilhas têm substâncias que fazem mal à natureza. O certo é levar a locais de coleta.'],
        ['Reutilizar é:', '🔁', 'usar de novo em vez de jogar fora', ['usar de novo em vez de jogar fora', 'comprar mais coisas', 'queimar o lixo', 'jogar na rua'], 'Um pote de vidro pode virar porta-lápis. Isso é reutilizar!'],
        ['O que podemos fazer com cascas de frutas e verduras?', '🌱', 'transformar em adubo', ['transformar em adubo', 'jogar no rio', 'queimar', 'guardar para sempre'], 'Os restos orgânicos viram adubo (compostagem) e ajudam as plantas a crescer.']
    ],
    'Sistema Solar': [
        ['Qual é o planeta mais próximo do Sol?', '☀️', 'Mercúrio', ['Mercúrio', 'Vênus', 'Terra', 'Marte'], 'Mercúrio é o primeiro planeta a partir do Sol.'],
        ['Em qual planeta nós vivemos?', '🌍', 'Terra', ['Terra', 'Marte', 'Júpiter', 'Saturno'], 'Vivemos na Terra, o planeta com água e ar que permitem a vida.'],
        ['Qual planeta é conhecido como “planeta vermelho”?', '🔴', 'Marte', ['Marte', 'Vênus', 'Netuno', 'Terra'], 'Marte parece vermelho porque o solo tem muito óxido de ferro (ferrugem).'],
        ['Qual é o maior planeta do Sistema Solar?', '🪐', 'Júpiter', ['Júpiter', 'Terra', 'Mercúrio', 'Marte'], 'Júpiter é gigante: caberiam mais de mil Terras dentro dele!'],
        ['Qual planeta é famoso pelos seus anéis?', '🪐', 'Saturno', ['Saturno', 'Marte', 'Mercúrio', 'Terra'], 'Os anéis de Saturno são feitos de gelo e pedaços de rocha.'],
        ['O Sol é:', '🌞', 'uma estrela', ['uma estrela', 'um planeta', 'um satélite', 'um cometa'], 'O Sol é a estrela que dá luz e calor para os planetas.'],
        ['A Lua gira ao redor de qual planeta?', '🌙', 'Terra', ['Terra', 'Marte', 'Sol', 'Júpiter'], 'A Lua é o satélite natural da Terra.'],
        ['Quantos planetas tem o Sistema Solar?', '8️⃣', '8', ['6', '7', '8', '9'], 'São oito: Mercúrio, Vênus, Terra, Marte, Júpiter, Saturno, Urano e Netuno.'],
        ['Qual planeta vem logo depois da Terra, mais longe do Sol?', '🚀', 'Marte', ['Marte', 'Vênus', 'Mercúrio', 'Saturno'], 'A ordem é: Mercúrio, Vênus, Terra, Marte...'],
        ['O dia acontece porque a Terra:', '🌗', 'gira em torno de si mesma', ['gira em torno de si mesma', 'desliga o Sol', 'fica parada', 'fica maior'], 'A Terra gira como um pião. O lado virado para o Sol está de dia; o outro, de noite.']
    ],
    'Estados da Matéria': [
        ['A água no estado sólido é:', '❄️', 'gelo', ['gelo', 'vapor', 'suco', 'nuvem'], 'Quando a água esfria muito ela congela e vira gelo.'],
        ['A água no estado gasoso é:', '💨', 'vapor', ['vapor', 'gelo', 'lama', 'areia'], 'Quando a água ferve ela vira vapor.'],
        ['O gelo derretendo vira:', '🧊', 'água líquida', ['água líquida', 'vapor', 'fumaça', 'areia'], 'Com o calor o gelo derrete e volta a ser líquido. Isso se chama fusão.'],
        ['Qual destes é sólido?', '🪨', 'pedra', ['pedra', 'suco', 'ar', 'vapor'], 'Sólidos têm forma própria, como a pedra.'],
        ['Qual destes é líquido?', '🥛', 'leite', ['leite', 'madeira', 'ar', 'pedra'], 'Líquidos escorrem e tomam a forma do recipiente, como o leite.'],
        ['O ar que respiramos é:', '🌬️', 'gasoso', ['gasoso', 'sólido', 'líquido', 'de gelo'], 'O ar é uma mistura de gases. A gente não vê, mas ele está em todo lugar.'],
        ['Um líquido toma a forma:', '🥤', 'do recipiente onde está', ['do recipiente onde está', 'de bola, sempre', 'de cubo, sempre', 'de nenhuma'], 'A água num copo fica em forma de copo; numa garrafa, em forma de garrafa.'],
        ['Para a água virar gelo ela precisa:', '🥶', 'esfriar bastante', ['esfriar bastante', 'esquentar bastante', 'ficar ao sol', 'receber açúcar'], 'No congelador faz muito frio e a água vira gelo.'],
        ['Uma pedra de gelo esquecida no sol:', '☀️🧊', 'derrete', ['derrete', 'fica mais dura', 'vira pedra', 'não muda'], 'O calor do Sol faz o gelo derreter.'],
        ['Qual destes é um gás?', '🎈', 'o ar dentro do balão', ['o ar dentro do balão', 'um tijolo', 'um copo de suco', 'um pedaço de pau'], 'O balão está cheio de gás, que ocupa todo o espaço disponível.']
    ],
    'Plantas': [
        ['Qual parte da planta fica embaixo da terra?', '🌱', 'raiz', ['raiz', 'folha', 'flor', 'fruto'], 'A raiz prende a planta no chão e absorve água e sais minerais.'],
        ['Qual parte da planta usa a luz do Sol para fazer o seu alimento?', '🍃', 'folha', ['folha', 'raiz', 'semente', 'caule'], 'As folhas fazem a fotossíntese: usam luz, água e ar para fabricar alimento.'],
        ['Uma planta precisa de água, luz do Sol e:', '🌤️', 'ar', ['ar', 'açúcar', 'sal', 'plástico'], 'Plantas precisam de água, luz e ar para crescer saudáveis.'],
        ['Qual parte da planta sustenta e leva água para cima?', '🌿', 'caule', ['caule', 'flor', 'fruto', 'semente'], 'O caule sustenta a planta e leva a água das raízes para as folhas.'],
        ['De onde nascem os frutos?', '🌸', 'das flores', ['das flores', 'das raízes', 'das pedras', 'do vento'], 'A flor se transforma em fruto, e dentro dele ficam as sementes.'],
        ['Para que servem as sementes?', '🌰', 'para nascerem novas plantas', ['para nascerem novas plantas', 'para fazer barulho', 'para fazer sombra', 'para brilhar'], 'De cada sementinha pode nascer uma nova planta.'],
        ['As plantas liberam um gás que a gente respira. Qual é?', '🌳', 'oxigênio', ['oxigênio', 'fumaça', 'poeira', 'gelo'], 'As plantas liberam oxigênio. Por isso cuidar das árvores é cuidar do ar!'],
        ['A abelha visita as flores para:', '🐝', 'pegar néctar', ['pegar néctar', 'pegar pedras', 'tomar banho', 'dormir'], 'Ao pegar o néctar, a abelha leva o pólen de flor em flor e ajuda a planta a dar frutos.'],
        ['Uma planta que fica muito tempo sem água:', '🥀', 'murcha', ['murcha', 'cresce mais rápido', 'vira pedra', 'começa a falar'], 'Sem água a planta murcha. Ela precisa ser regada com carinho.'],
        ['Qual destes alimentos é uma raiz?', '🥕', 'cenoura', ['cenoura', 'alface', 'maçã', 'arroz'], 'A cenoura é raiz; a alface é folha e a maçã é fruto.']
    ],
    'Sentidos': [
        ['Qual sentido usamos para ver?', '👁️', 'visão', ['visão', 'audição', 'olfato', 'paladar'], 'Vemos com os olhos, e o sentido se chama visão.'],
        ['Qual sentido usamos para ouvir?', '👂', 'audição', ['audição', 'visão', 'tato', 'paladar'], 'Ouvimos com as orelhas, e o sentido se chama audição.'],
        ['Qual sentido usamos para sentir cheiros?', '👃', 'olfato', ['olfato', 'tato', 'audição', 'visão'], 'Sentimos cheiros com o nariz, e o sentido se chama olfato.'],
        ['Qual sentido usamos para sentir o gosto da comida?', '👅', 'paladar', ['paladar', 'olfato', 'audição', 'visão'], 'A língua sente o doce, o salgado, o azedo e o amargo. Isso é o paladar.'],
        ['Qual sentido usamos para saber se algo é macio, áspero, quente ou frio?', '✋', 'tato', ['tato', 'visão', 'audição', 'olfato'], 'Sentimos com a pele, principalmente com as mãos. É o tato.'],
        ['Com qual parte do corpo sentimos o gosto?', '🍰', 'língua', ['língua', 'nariz', 'orelha', 'cotovelo'], 'A língua tem pequenos pontinhos que percebem os sabores.'],
        ['Com qual parte do corpo sentimos cheiro?', '🌸', 'nariz', ['nariz', 'olho', 'joelho', 'língua'], 'O nariz capta os cheirinhos que estão no ar.'],
        ['O barulho do trovão a gente percebe com o sentido da:', '⛈️', 'audição', ['audição', 'visão', 'olfato', 'paladar'], 'Ouvimos o trovão com as orelhas. A audição também nos avisa de perigos!'],
        ['Você encosta numa panela quente e tira a mão rápido. Qual sentido avisou do perigo?', '♨️', 'tato', ['tato', 'olfato', 'paladar', 'audição'], 'A pele sente o calor e avisa o cérebro para a gente se proteger.'],
        ['Qual sentido nos avisa que o bolo está saindo do forno?', '🎂', 'olfato', ['olfato', 'tato', 'audição', 'visão'], 'O cheirinho do bolo chega ao nariz antes mesmo de vermos o bolo.']
    ]
};

/* ---------- EMOÇÕES ---------- */
const EMOCOES = [
    { id: 'feliz', nome: 'feliz', rosto: '😊', fazer: 'Posso sorrir, agradecer e dividir essa alegria com alguém.' },
    { id: 'triste', nome: 'triste', rosto: '😢', fazer: 'Posso pedir um abraço, chorar um pouquinho e contar para alguém de confiança.' },
    { id: 'raiva', nome: 'com raiva', rosto: '😠', fazer: 'Posso respirar fundo, contar até 10 e dizer com palavras o que me incomodou.' },
    { id: 'medo', nome: 'com medo', rosto: '😨', fazer: 'Posso respirar devagar e procurar um adulto de confiança.' },
    { id: 'surpreso', nome: 'surpreso', rosto: '😮', fazer: 'Posso parar um momento, respirar e olhar com calma o que aconteceu.' },
    { id: 'nojo', nome: 'com nojo', rosto: '🤢', fazer: 'Posso me afastar e avisar um adulto.' },
    { id: 'sono', nome: 'com sono', rosto: '😴', fazer: 'Posso descansar um pouco e beber água.' },
    { id: 'vergonha', nome: 'envergonhado', rosto: '😳', fazer: 'Todo mundo passa por isso. Posso respirar fundo e lembrar que está tudo bem.' },
    { id: 'calmo', nome: 'calmo', rosto: '😌', fazer: 'Que bom! Posso aproveitar para brincar ou descansar.' },
    { id: 'preocupado', nome: 'preocupado', rosto: '😟', fazer: 'Posso contar o que me preocupa para alguém e respirar bem devagar.' },
    { id: 'animado', nome: 'animado', rosto: '🤩', fazer: 'Posso usar essa energia para brincar e depois respirar para me acalmar.' }
];
const EMOCOES_SITUACOES = [
    ['Ganhei um presente de aniversário!', 'feliz'], ['Hoje vou brincar com meu melhor amigo.', 'feliz'], ['Tirei uma boa nota e minha mãe me abraçou.', 'feliz'],
    ['Meu sorvete caiu no chão.', 'triste'], ['Meu melhor amigo vai se mudar para outra cidade.', 'triste'], ['Meu bichinho de estimação ficou doente.', 'triste'],
    ['Alguém quebrou o meu brinquedo de propósito.', 'raiva'], ['Pegaram o meu lápis sem pedir.', 'raiva'], ['Disseram que eu não podia brincar e isso não foi justo.', 'raiva'],
    ['Apagou a luz e estou sozinho no escuro.', 'medo'], ['Ouvi um trovão muito forte.', 'medo'], ['Um cachorro grande veio correndo na minha direção.', 'medo'],
    ['Abri a porta e todos gritaram: “Surpresa!”', 'surpreso'], ['De repente apareceu um arco-íris enorme no céu.', 'surpreso'],
    ['Vi uma comida estragada com mau cheiro.', 'nojo'], ['Encontrei uma barata dentro da mochila.', 'nojo'],
    ['Brinquei o dia inteiro e meus olhos estão fechando.', 'sono'], ['Já é muito tarde da noite e eu bocejo.', 'sono'],
    ['Tropecei na frente de todo mundo.', 'vergonha'], ['Preciso falar na frente da turma e meu rosto ficou vermelho.', 'vergonha'],
    ['Estou deitado no sofá, ouvindo uma música suave.', 'calmo'], ['Respirei devagar e meu corpo relaxou.', 'calmo'],
    ['Amanhã tem prova e não consigo parar de pensar nisso.', 'preocupado'], ['Minha mãe está demorando para chegar.', 'preocupado'],
    ['Vamos viajar amanhã!', 'animado'], ['Hoje é dia de festa e eu mal posso esperar!', 'animado']
];

/* ---------- ROTINAS (passos na ordem correta) ---------- */
const ROTINAS = [
    { nome: 'Escovar os dentes', emoji: '🪥', passos: [['🪥', 'Pegar a escova'], ['🧴', 'Colocar a pasta'], ['😁', 'Escovar os dentes'], ['💦', 'Cuspir a espuma'], ['🚰', 'Enxaguar a boca']] },
    { nome: 'Lavar as mãos', emoji: '🧼', passos: [['🚰', 'Abrir a torneira'], ['💧', 'Molhar as mãos'], ['🧼', 'Passar o sabonete'], ['👏', 'Esfregar bem'], ['🚿', 'Enxaguar'], ['🧻', 'Secar com a toalha']] },
    { nome: 'De manhã', emoji: '🌅', passos: [['⏰', 'Acordar'], ['🪥', 'Escovar os dentes'], ['🥣', 'Tomar o café da manhã'], ['👕', 'Trocar de roupa'], ['🎒', 'Arrumar a mochila'], ['🚌', 'Ir para a escola']] },
    { nome: 'Na escola', emoji: '🏫', passos: [['🚪', 'Chegar à escola'], ['🎒', 'Guardar a mochila'], ['📚', 'Assistir à aula'], ['🥪', 'Lanchar no recreio'], ['⚽', 'Brincar no pátio'], ['🏠', 'Voltar para casa']] },
    { nome: 'Fazer um lanche', emoji: '🥪', passos: [['🧼', 'Lavar as mãos'], ['🍞', 'Pegar o pão'], ['🧀', 'Colocar o recheio'], ['😋', 'Comer devagar'], ['🗑️', 'Jogar o lixo na lixeira']] },
    { nome: 'Plantar uma sementinha', emoji: '🌱', passos: [['🪴', 'Pegar um vaso com terra'], ['🕳️', 'Fazer um buraquinho'], ['🌰', 'Colocar a semente'], ['🟤', 'Cobrir com terra'], ['💧', 'Regar com água']] },
    { nome: 'Antes de dormir', emoji: '🌙', passos: [['🍲', 'Jantar'], ['🛁', 'Tomar banho'], ['👚', 'Vestir o pijama'], ['🪥', 'Escovar os dentes'], ['📖', 'Ouvir uma história'], ['😴', 'Dormir']] }
];

/* ---------- CUIDADO COM O AMBIENTE ---------- */
const AMBIENTE = [
    ['🗑️', 'Jogar lixo no chão', false, 'O lixo deve ir para a lixeira. No chão ele suja a rua, entope bueiros e prejudica os animais.'],
    ['♻️', 'Separar o lixo para reciclar', true, 'Separar o lixo ajuda a reaproveitar materiais e diminui o lixo nos aterros.'],
    ['💡', 'Apagar a luz ao sair do quarto', true, 'Economizar energia ajuda o planeta e a conta de luz.'],
    ['🚰', 'Deixar a torneira aberta enquanto escova os dentes', false, 'A água é preciosa. Feche a torneira enquanto escova!'],
    ['🌳', 'Plantar uma árvore', true, 'As árvores limpam o ar, dão sombra e são casa de muitos animais.'],
    ['🛍️', 'Usar sacola reutilizável no mercado', true, 'Sacolas reutilizáveis diminuem o plástico que vai para a natureza.'],
    ['🚲', 'Ir à escola de bicicleta ou a pé quando dá', true, 'Bicicleta e caminhada não poluem o ar e fazem bem à saúde.'],
    ['🍽️', 'Jogar comida fora sem necessidade', false, 'Desperdiçar comida gasta água e energia que foram usadas para produzi-la.'],
    ['🏖️', 'Recolher o lixo na praia', true, 'Praia limpa protege os animais marinhos e as pessoas.'],
    ['🔥', 'Queimar lixo no quintal', false, 'A fumaça suja o ar e faz mal para a respiração.'],
    ['🔌', 'Deixar a TV ligada sem ninguém assistindo', false, 'Aparelhos ligados à toa gastam energia sem necessidade.'],
    ['🥤', 'Reutilizar potes e garrafas', true, 'Reutilizar evita lixo e economiza recursos da natureza.'],
    ['🚿', 'Tomar banhos mais curtos', true, 'Banhos curtos economizam água, que é um recurso precioso.'],
    ['🐟', 'Jogar lixo no rio ou no mar', false, 'O lixo na água machuca peixes, tartarugas e outros animais.'],
    ['🔋', 'Levar pilhas usadas a um ponto de coleta', true, 'As pilhas têm substâncias que prejudicam a natureza e precisam de descarte correto.'],
    ['🌞', 'Aproveitar a luz do sol de dia, em vez de acender a luz', true, 'A luz natural é de graça e economiza energia.'],
    ['🧃', 'Comprar muitas coisas com embalagens que só vão virar lixo', false, 'Quanto mais embalagem, mais lixo. É melhor escolher produtos com menos embalagem.'],
    ['🌱', 'Fazer adubo com cascas de frutas e verduras', true, 'A compostagem transforma restos de comida em adubo para as plantas.'],
    ['🚗', 'Usar o carro até para ir à padaria da esquina', false, 'Para distâncias curtas, caminhar é melhor: polui menos e faz bem à saúde.'],
    ['🌊', 'Fechar a torneira quando ela está pingando', true, 'Uma torneira pingando desperdiça muita água em um dia.'],
    ['🐦', 'Cuidar dos passarinhos sem prendê-los em gaiolas', true, 'Os animais silvestres devem viver livres na natureza.'],
    ['📄', 'Usar os dois lados da folha de papel', true, 'Usar os dois lados economiza papel e salva árvores.'],
    ['🌲', 'Arrancar plantas e flores do jardim por diversão', false, 'As plantas são seres vivos e ajudam o ambiente. Podemos admirá-las sem arrancar.'],
    ['🔊', 'Ouvir música baixinho para não incomodar os vizinhos', true, 'O barulho em excesso também é poluição. Respeitar o silêncio é cuidar do ambiente.']
];

/* ---------- CORES (itens por cor) ---------- */
const CORES = [
    { id: 'vermelho', nome: 'Vermelho', hex: '#d32f2f', emoji: '🔴', itens: ['🍎', '🍓', '🌹', '🍒', '🍅', '🚒'] },
    { id: 'amarelo', nome: 'Amarelo', hex: '#f9a825', emoji: '🟡', itens: ['🍌', '🌻', '🐤', '🍋', '🌽', '🧀'] },
    { id: 'verde', nome: 'Verde', hex: '#2e7d32', emoji: '🟢', itens: ['🍏', '🥑', '🐸', '🥦', '🐢', '🥒'] },
    { id: 'azul', nome: 'Azul', hex: '#1565c0', emoji: '🔵', itens: ['🫐', '🐋', '💧', '🌊'] },
    { id: 'roxo', nome: 'Roxo', hex: '#6a1b9a', emoji: '🟣', itens: ['🍇', '🍆', '🔮', '💜'] },
    { id: 'laranja', nome: 'Laranja', hex: '#ef6c00', emoji: '🟠', itens: ['🍊', '🥕', '🎃', '🦊'] }
];

/* ---------- SOMBRAS (figuras de silhueta bem diferente umas das outras) ---------- */
const SOMBRAS = [
    ['🐘', 'elefante'], ['🦒', 'girafa'], ['🐢', 'tartaruga'], ['🐧', 'pinguim'], ['🦆', 'pato'], ['🐸', 'sapo'],
    ['🐙', 'polvo'], ['🦋', 'borboleta'], ['🐝', 'abelha'], ['🐟', 'peixe'], ['🐳', 'baleia'], ['🦀', 'caranguejo'],
    ['🍎', 'maçã'], ['🚗', 'carro'], ['✈️', 'avião'], ['🌙', 'lua'], ['⭐', 'estrela'], ['🏠', 'casa'],
    ['🎈', 'balão'], ['🚲', 'bicicleta'], ['🍌', 'banana'], ['🍍', 'abacaxi'], ['🐓', 'galo'], ['🦉', 'coruja']
];
