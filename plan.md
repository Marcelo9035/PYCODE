# Plano — PyCode Builder para Web e Windows

## Escopo e decisões

Entregar a interface interativa em português do PyCode Builder e empacotar essa mesma interface como aplicativo desktop instalável para Windows. A experiência oferece entrada por arquivo `.py` ou editor/colagem condicional, nome e pasta de saída, configurações do build, opções avançadas, barra de progresso e logs.

**Importante:** o instalador Windows executa a interface do PyCode Builder, mas não converte o botão existente de build em um compilador real. A compilação demonstrada dentro da aplicação permanece simulada: os arquivos `.py` nunca são executados e esta versão não chama PyInstaller. O build real de código Python de terceiros requer uma implementação adicional e uma política de segurança isolada.

A página será carregada localmente em um shell Electron seguro (sem acesso a Node no renderer). A configuração do Electron Builder gera um instalador `.exe` NSIS de 64 bits, assistido, de instalação por usuário, e permite escolher a pasta de instalação. A máquina de build é Linux; por isso, a criação do instalador Windows depende de Wine e da disponibilidade das dependências/artefatos Electron. Se esse requisito não puder ser satisfeito ou o artefato não puder ser validado, não rotular o pacote como concluído.

## Implementação e estrutura

- `index.html`: estrutura semântica e interface principal. CSS, JavaScript e favicon usam URLs relativas, compatíveis com o Preview web e com `file://` dentro do app desktop.
- `styles.css`: sistema visual, layout responsivo, estados e animações.
- `app.js`: estado da sessão, seleção/leitura de `.py`, editor condicional, configuração de build, validação, opções avançadas, log e simulação local segura.
- `electron/main.cjs`: inicialização do shell desktop, restrições do renderer e carregamento offline do arquivo local.
- `package.json` e `package-lock.json`: versões fixadas de Electron/Electron Builder, comando de build Windows x64 e configuração do instalador NSIS.
- `build/pycode.ico`: ícone de aplicativo/instalador Windows.
- `public/manus-routes.json` e `manus-routes.json`: manifesto da única página web (`/`).
- `app.config.ts`: URL literal HTTPS do logotipo para metadado do projeto Manus.
- `plan.md` e `TODO.md`: decisões de produto e critérios rastreáveis, incluindo o instalador executável.
- `dist/`: artefato de build (`PyCodeBuilder-Setup-1.0.0-x64.exe`); diretório gerado, não parte das fontes versionadas.

## Dependências, segurança e execução

A página mantém o runtime de pré-visualização em `0.0.0.0:3000`. O instalador contém a página estática e Chromium via Electron; não requer servidor, conta ou banco de dados para uso desktop. O gerenciador npm e versões de pacotes são fixados no projeto. Electron usa `contextIsolation`, `sandbox` e `nodeIntegration:false`, impede navegação arbitrária dentro do app e não executa os fontes Python carregados. O instalador é assinado apenas se houver certificado fornecido; sem certificado próprio, deve ser tratado como build não assinado e o Windows pode exibir aviso de editor desconhecido.

## Direção visual aprovada

- **Movimento de design:** estação de trabalho de engenharia de software contemporânea, com referências a consoles de desenvolvimento e utilitários desktop de precisão.
- **Princípios centrais:** hierarquia operacional clara; densidade informativa sem ruído; affordances explícitas; feedback verificável e seguro.
- **Filosofia de cor:** base de papel frio e superfícies em carvão para remeter a um workspace técnico; verde-jade como sinal autoral de código pronto, âmbar para ações de build e alertas, vermelho somente para falhas.
- **Paradigma de layout:** bancada assimétrica de três zonas: barra lateral de fluxo, área principal de projeto/código e painel lateral de configuração e atividade; reorganiza em coluna em telas estreitas.
- **Elementos distintivos:** marca geométrica com prompt/colchetes em jade; marcadores numerados de etapa; trilha de logs com status e timestamps simulados.
- **Filosofia de interação:** a ação principal acompanha o estado do projeto; o editor só aparece quando “Caixa de Texto” está ativada; feedback é imediato; os builds continuam identificados como simulação.
- **Animação:** transições curtas de 140–220 ms em menus, switches e mensagens; progresso fluido durante a simulação; respeitar `prefers-reduced-motion`; evitar movimento decorativo contínuo.
- **Tipografia:** Manrope ou sistema sans para interface, com JetBrains Mono ou pilha monospace para arquivo, editor e log; títulos 26–34 px, cabeçalhos 14–18 px, corpo 13–15 px.
- **Essência da marca:** “O fluxo de empacotamento Python, organizado numa bancada visual para quem publica apps Windows”; personalidade: metódica, acessível, técnica.
- **Voz:** headlines diretas; CTAs nomeiam a ação; microcopy explica limites sem alarmismo. Exemplos: “Seu próximo app começa por aqui.” / “Esta simulação não cria um .exe; use PyInstaller no Windows para compilar de verdade.”
- **Wordmark e logo:** símbolo com colchetes angulares e prompt em jade, seguido por wordmark “pycode / builder”.
- **Cor de marca:** jade elétrico `#13B981`, assinatura em seleções e estados prontos.

## Comportamento do produto

O seletor lê apenas arquivos `.py` localmente, sem execução ou upload. A caixa de texto começa oculta e só aparece quando a opção correspondente do menu/visualização é ativada; quando oculta, o código continua na prévia. O usuário pode definir nome e pasta de saída, escolher console/sem console e onefile/onedir; metadados, ícone `.ico`, assets e preparação de instalador ficam em opções avançadas. O build local de interface demonstra progresso/logs, valida entradas e conclui com aviso explícito de que nenhum executável Python do projeto do usuário foi gerado.
