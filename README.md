# Charqueons League — MVP

Primeira versão demonstrativa do bolão do Campeonato Paraense.

## Como abrir

### Opção simples

Abra o arquivo `index.html` no navegador.

### Opção recomendada no VS Code

1. Extraia o arquivo ZIP.
2. Abra a pasta `charqueons-league-code` no VS Code.
3. Instale a extensão **Live Server**.
4. Clique com o botão direito em `index.html`.
5. Selecione **Open with Live Server**.

Não é necessário instalar Node.js ou dependências nesta versão.

## Arquivos principais

- `index.html`: estrutura e conteúdo das telas.
- `styles.css`: identidade visual, responsividade e animações.
- `app.js`: navegação, dados mockados, palpites, ranking e simulação ao vivo.
- `favicon.svg`: ícone do site.

## Onde alterar os dados

No começo de `app.js` existem os arrays `matches` e `ranking`. Eles controlam as partidas e a classificação exibidas.

## Teste da demonstração

1. Abra o dashboard.
2. Altere o placar de uma próxima partida e salve o palpite.
3. Entre em **Ao vivo**.
4. Clique em **Simular próximo lance** três vezes.
5. Veja o placar, a timeline e a projeção de pontos mudarem.

## Limites desta versão

Os dados ainda são mockados e reiniciam quando a página é recarregada. Login, banco de dados e API de futebol serão adicionados nas próximas etapas.

