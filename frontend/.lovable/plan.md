

## Plano: Corrigir traducoes e enriquecer o perfil do piloto

### Problema 1: Chaves de traducao ausentes
A pagina `PilotDetail.tsx` usa chaves de traducao que nao existem nos arquivos de idioma:
- `dashboard.statistics` (nao existe)
- `dashboard.totalRaces` (nao existe)
- `dashboard.victories` (nao existe)
- `dashboard.podiums` (nao existe)
- `dashboard.totalPoints` (nao existe)

Resultado: o texto bruto da chave aparece na tela em vez do texto traduzido.

**Correcao:** Substituir por chaves que ja existem:
- `dashboard.statistics` -> usar texto direto ou criar chave `pilots.statistics`
- `dashboard.totalRaces` -> `career.totalRaces` ("Total de Corridas")
- `dashboard.victories` -> `career.wins` ("Vitorias")
- `dashboard.podiums` -> `career.podiums` ("Podios")
- `dashboard.totalPoints` -> `career.totalPoints` ("Total de Pontos")

### Problema 2: Perfil do piloto incompleto
Atualmente o perfil mostra apenas:
- Header com avatar, nome, bio
- Redes sociais
- 4 estatisticas basicas
- Badges

**Melhorias planejadas:**
Adicionar secoes similares as da pagina "Minha Carreira", adaptadas para visualizacao publica:

1. **Mais estatisticas**: Adicionar posicao media e melhor posicao (como na pagina Career)
2. **Grafico de evolucao**: Reutilizar o componente `CareerChart` passando o `profileId` do piloto visualizado (requer pequena adaptacao no componente)
3. **Melhores resultados**: Card com melhor posicao, vitorias e podios (como na Career)
4. **Corridas recentes**: Lista das ultimas corridas do piloto (usando dados de `heat_results_public`)

### Alteracoes por arquivo

**`src/pages/PilotDetail.tsx`**
- Corrigir todas as chaves de traducao
- Expandir grid de estatisticas para 6 colunas (adicionar media de posicao e voltas rapidas)
- Adicionar secao "Melhores Resultados"
- Adicionar secao "Corridas Recentes" com dados de `heat_results_public`
- Adicionar grafico de evolucao reutilizando `CareerChart`

**`src/components/dashboard/CareerChart.tsx`**
- Aceitar prop opcional `profileId` para exibir evolucao de qualquer piloto (atualmente usa apenas o usuario logado)

**`src/i18n/locales/pt-BR.json`**
- Adicionar chaves na secao `pilots`: `statistics`, `bestResults`, `recentRaces`, `noRecentRaces`

**`src/i18n/locales/en.json`**
- Adicionar as mesmas chaves em ingles

**`src/i18n/locales/es.json`**
- Adicionar as mesmas chaves em espanhol

### Detalhes tecnicos

O componente `CareerChart` atualmente busca dados usando `user?.id` do contexto de autenticacao. A adaptacao consistira em:
- Adicionar prop `profileId?: string`
- Se `profileId` for fornecido, usar esse ID; caso contrario, manter comportamento atual com `user?.id`

A secao de corridas recentes usara uma query na view `heat_results_public` filtrada pelo `driver_id` do piloto, limitada a 5 resultados.

