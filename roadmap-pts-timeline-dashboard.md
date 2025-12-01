# Roadmap Prioritário: Planos Terapêuticos, Timeline e Dashboard Metabólico

Este documento organiza os próximos incrementos para três frentes prioritárias: Planos Terapêuticos (PTS), Timeline de Evolução (Módulo 19) e Dashboard Metabólico. Os itens estão descritos para facilitar estimativa, design de UI e instrumentação de backend/IA.

## 1) Planos Terapêuticos (PTS)
### Objetivos
- Entregar versões distintas para **médico** (raciocínio clínico e justificativas) e **paciente** (linguagem acessível, checklist de adesão e metas claras).
- Disponibilizar editor rico (HTML/Markdown) com blocos pré-formatados, histórico de versões (rascunho/final) e diff.
- Garantir catálogo de templates reutilizáveis por condição clínica, com placeholders dinâmicos (ex.: nome, metas, exames recentes).
- Permitir envio assinado (digital ou manual) por WhatsApp/Email com rastreio de abertura/leitura.
- Oferecer IA Mestra que recebe contexto completo da consulta e gera automaticamente as duas versões, sugerindo MEV e metas SMART.

### Backlog detalhado
1. **Editor e versões**
   - Blocos pré-formatados para diagnósticos, metas, conduta, MEV, checklist e seguimento.
   - Estados de rascunho/finalizado com histórico, diff e restauração.
   - Armazenar autoria e timestamps de cada revisão.
2. **Templates reutilizáveis**
   - Catálogo por condição (DM2, obesidade, SOP, hipotireoidismo, etc.).
   - Placeholders dinâmicos para dados do paciente/consulta (nome, metas, exames mais recentes, bioimpedância, BIA/IMC).
   - CRUD de templates e publicação para time clínico.
3. **Entrega e rastreio**
   - Envios por WhatsApp/Email com registro de leitura/abertura e log por paciente/consulta.
   - Fluxo de assinatura digital (ou indicação de assinatura manual) antes da emissão.
4. **IA Mestra**
   - Entrada: diagnósticos, exames, bioimpedâncias, MEV atuais, metas, histórico de condutas e notas SOAP.
   - Saídas: versão médico + versão paciente, ambas editáveis no editor.
   - Sugestões automáticas de MEV e metas SMART por condição clínica.

### Considerações de dados/arquitetura
- **Tabelas sugeridas**: `pts_planos` (metadata/estado), `pts_revisoes` (conteúdo rascunho/final + diff refs), `pts_templates`, `pts_envios` (canal, leitura, assinatura), `pts_assinaturas` (hash/documento), `pts_ai_runs` (prompt/contexto/saídas).
- **Eventos**: gerar evento de timeline quando um plano for emitido ou atualizado.
- **Permissões**: controle de acesso por papel (médico vs equipe). Auditoria por consulta/paciente.

### Entregáveis de UI/UX
- Editor com abas: "Médico", "Paciente", "Histórico/Diff", "Templates".
- Modal de seleção de template com filtros por condição clínica.
- Badge de status (Rascunho/Final) e alerta de assinatura pendente.
- Botão de envio (WhatsApp/Email) com confirmação de registro de leitura.

## 2) Timeline de Evolução (Módulo 19)
### Objetivos
- Consolidar eventos de consultas, exames, bioimpedâncias e marcos terapêuticos (início/ajuste de medicação, eventos adversos).
- Exibir notas SOAP estruturadas e gráficos críticos (peso, IMC, glicemia, HbA1c, PA, colesterol, TSH/T4L).
- Oferecer filtros por período (30/90/365 dias) e tipo de evento, além de comparação entre consultas (deltas e condutas).
- Implementar análise longitudinal com tendências e alertas de piora/melhoria.

### Backlog detalhado
1. **Eventos consolidados**
   - Normalização de tipos: consulta, exame, bioimpedância, medicação (início/ajuste), evento adverso.
   - Inclusão de notas SOAP por consulta (S/O/A/P).
2. **Visualizações e filtros**
   - Filtros por período (30/90/365 dias) e por tipo de evento.
   - Gráficos críticos com zoom e destaques de valores críticos.
   - Comparação entre consultas com deltas de parâmetros chave e mudanças de conduta.
3. **Análise longitudinal**
   - Tendências (melhora/piora) e alertas configuráveis.
   - Destaques automáticos de marcos relevantes (ex.: início de GLP-1 RA) na linha do tempo e nos gráficos.
4. **Integrações**
   - Consumo de dados de exames/bioimpedância já existentes.
   - Eventos de PTS emitidos passam a aparecer na timeline.

### Considerações de dados/arquitetura
- **Tabelas/eventos**: `timeline_eventos` (tipo, payload, referências), `timeline_alertas` (tendências, thresholds), `timeline_filters` (preferências por usuário), possível materialização de séries agregadas para desempenho.
- **Derivações**: calculo de deltas de parâmetros na ingestão e caching de séries críticas.

### Entregáveis de UI/UX
- Linha do tempo com agrupamento por período e chips de filtro.
- Cartões compactos por evento com ícones diferenciados (consulta, exame, BIA, medicação, alerta).
- Aba de comparação entre consultas com tabela de deltas e mudanças de conduta.
- Gráficos de séries críticas com marcadores de eventos e alerta visual.

## 3) Dashboard Metabólico Completo
### Objetivos
- Consolidar BIA + exames + escores em um painel único.
- Disponibilizar visualizações como velocímetros de risco, mini-infográficos, alertas de valores críticos, tendências e projeções.
- Oferecer comparativos de referência populacional e metas individualizadas.
- Sugerir ações rápidas (solicitar exames, calcular escores, gerar PTS atualizado).

### Backlog detalhado
1. **Consolidação de dados**
   - Unificar séries (peso, IMC, circunferência abdominal, glicemia, HbA1c, PA, lipídios, TSH/T4L, composição corporal).
   - Agregar escores clínicos (PREVENT, FRAX, etc.) quando disponíveis.
2. **Visualizações e alertas**
   - Velocímetros de risco por domínio (CV, metabólico, ósseo).
   - Mini-infográficos e badges de status (controlado/risco/alerta crítico).
   - Tendências e projeções simples (regressão linear móvel) com thresholds configuráveis.
3. **Comparativos e ações**
   - Referência populacional vs metas personalizadas por paciente.
   - Ações rápidas: solicitar exames pendentes, recalcular escores, gerar PTS atualizado.
4. **Integrações**
   - Conectar com timeline para exibir marcos nos gráficos.
   - Conectar com PTS para exibir status e metas atuais.

### Considerações de dados/arquitetura
- **Tabelas/séries**: materialização de séries críticas para carregamento rápido; `dashboard_alertas` para thresholds e histórico de alertas; reutilizar `timeline_eventos` como fonte de marcadores.
- **Cálculo**: serviços de consolidação rodando on-demand ou via jobs para pré-processar dados (IA opcional para projeções e recomendações).

### Entregáveis de UI/UX
- Painel principal com cards por domínio (CV, metabólico, tireoide, composição corporal).
- Velocímetros e mini-infográficos com legenda de risco e tooltips explicativos.
- Lista de alertas e ações rápidas contextualizadas por paciente.
- Seção de metas e adesão vinculada ao PTS vigente.

## 4) Sequenciamento sugerido
1. **Priorizar PTS**: editor rico, templates por condição e envio com registro de leitura.
2. **Expandir timeline**: filtros, marcos automáticos e gráficos resumidos por período.
3. **Evoluir dashboard metabólico**: consolidação de dados e alertas de risco com velocímetros.

## 5) Dependências e riscos
- Definição de modelo de dados para histórico de versões e diff (PTS) e para eventos normalizados (timeline/dashboard).
- Integração de canais de envio (WhatsApp/Email) e assinatura digital podem depender de provedores externos.
- Performance de gráficos longos: considerar cache/materialização e paginação por período.
- Privacidade/Auditoria: garantir logging e trilha de acesso aos documentos e envios.

# TODO - Prontuário Médico Inteligente - Endocrinologia

## Próximos passos imediatos (prioridade)
- [ ] Exercitar fluxo completo de exames laboratoriais com IA + upload S3, incluindo reprocessamento em caso de falha e normalização de parâmetros com IDs determinísticos.
- [ ] Permitir edição e exclusão de pacotes de exames diretamente na tabela evolutiva, atualizando gráficos e histórico após cada alteração.
- [ ] Adicionar teste ponta a ponta (tRPC + renderização) cobrindo criação, upload, edição e remoção de exames, incluindo parâmetros com acentuação para validar geração de IDs.
- [ ] Expandir gráficos evolutivos para aceitar séries multi-unidade (ex.: glicemia mg/dL vs mmol/L) com conversão e aviso de unidade mista.
- [ ] Revisar seção de áudios do paciente para listar duração e data/hora da gravação e permitir download por consulta.

## Pendências em foco (prioridade média)
- [ ] Planos terapêuticos: versões médico/paciente, editor HTML/Markdown, templates por condição, envio por WhatsApp/Email com registro de leitura, histórico de planos anteriores.
- [ ] Timeline de evolução (Módulo 19): consolidar consultas, exames e BIA; notas SOAP estruturadas; marcos automáticos (início/ajuste de medicação, eventos adversos); filtros por período e tipo; comparação entre consultas e análise longitudinal.
- [ ] Dashboard metabólico completo: consolidar BIA + exames + escores, velocímetros de risco, mini-infográficos, alertas automáticos de valores críticos, tendências e previsões, comparação com população de referência.
- [ ] Planos terapêuticos
  - [ ] Versão médico (detalhada com raciocínio clínico) e versão paciente (linguagem acessível)
  - [ ] Editor HTML/Markdown com blocos pré-formatados e histórico de versões
  - [ ] Templates reutilizáveis por condição clínica e placeholders dinâmicos
  - [ ] Envio automático por WhatsApp/Email com registro de leitura
  - [ ] Histórico de planos anteriores e auditoria de alterações
- [ ] Timeline de evolução (Módulo 19)
  - [ ] Linha do tempo consolidada (consultas + exames + BIA) com notas SOAP estruturadas
  - [ ] Marcos clínicos automáticos (início/ajuste de medicação, eventos adversos)
  - [ ] Gráficos resumidos de parâmetros críticos e filtros por período/tipo de evento
  - [ ] Comparação entre consultas e análise longitudinal com deltas de parâmetros
- [ ] Dashboard metabólico completo
  - [ ] Consolidação avançada (BIA + exames + escores) em painel único
  - [ ] Velocímetros de risco, mini-infográficos e alertas de valores críticos
  - [ ] Tendências, previsões e comparação com população de referência

## Fase 1: Arquitetura e Planejamento
- [x] Analisar requisitos completos do sistema
- [x] Definir arquitetura macro (Frontend/Backend/IA/Infra)
- [x] Propor stack tecnológico (Next.js/FastAPI/PostgreSQL)
- [x] Mapear módulos principais

## Fase 2: Inicialização do Projeto
- [x] Inicializar projeto web com webdev_init_project
- [x] Configurar estrutura base do projeto

## Fase 3: Schema de Banco de Dados e Estrutura Base
- [x] Criar schema completo do banco de dados (todas as entidades)
- [x] Executar migrations do banco de dados
- [x] Criar helpers de banco de dados básicos
- [x] Configurar estrutura de rotas e navegação
- [x] Implementar layout base do sistema

## Fase 4: Módulo de Pacientes e Consultas
- [x] Implementar CRUD completo de Pacientes
- [x] Criar interface de listagem de pacientes
- [x] Criar interface de cadastro/edição de pacientes
- [ ] Implementar módulo de Consultas
- [ ] Integrar captura de áudio no navegador
- [ ] Implementar processamento de áudio via IA (Gemini)

Após, já vamos iniciar a implementar cada uma das novas funcionalidades.
