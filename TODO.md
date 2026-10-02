# ToDo — PyCode Builder

## Entrada do projeto e editor condicional

- [x] **Arquivo Python e edição manual** — A interface oferece carregar arquivo `.py` ou colar código Python manualmente; mostra o código carregado/colado; permite limpar o conteúdo e carregar outro código. No menu/visualização, a opção “Caixa de Texto” controla dinamicamente a exibição: marcada, a caixa de texto aparece; desmarcada, a caixa de código fica oculta.

## Configuração do executável

- [x] **Nome, pasta e modalidade do build** — A interface oferece configuração do nome do programa e escolha da pasta de saída; representa geração de `.exe` com PyInstaller e permite selecionar aplicativo com console ou sem console, bem como modo onefile ou onedir.

## Opções avançadas

- [x] **Metadados, ícone, assets e instalador** — Estão disponíveis como opções avançadas ícone `.ico`, versão, descrição, autor, inclusão automática de arquivos/assets e preparação de geração de instalador, sem tornar essas opções uma barreira ao fluxo principal.

## Acompanhamento, erros e limites honestos

- [x] **Progresso, registro e tratamento de erros** — O protótipo apresenta acompanhamento do processo por barra de progresso e registro detalhado; trata entradas inválidas com mensagens claras que orientam correções; permite limpar e carregar outro código. Informa de forma visível que o build exibido é uma simulação local: o navegador/ambiente Linux não executa PyInstaller para gerar um executável Windows e o código carregado não será executado.

## Pacote desktop Windows

- [ ] **Instalador executável** — Empacotar a interface PyCode Builder como aplicativo desktop Windows e gerar um instalador `.exe` x64 que instale o aplicativo, com navegação local dos recursos, ícone e pasta de instalação selecionável; não declarar o recurso de build interno do código Python como real, pois ele continua demonstrativo.
