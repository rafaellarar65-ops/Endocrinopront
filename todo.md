# TODO - Prontuário Médico Inteligente - Endocrinologia

## Próximos passos imediatos (prioridade)
- [ ] Exercitar fluxo completo de exames laboratoriais com IA + upload S3, incluindo reprocessamento em caso de falha e normalização de parâmetros com IDs determinísticos.
- [ ] Permitir edição e exclusão de pacotes de exames diretamente na tabela evolutiva, atualizando gráficos e histórico após cada alteração.
- [ ] Adicionar teste ponta a ponta (tRPC + renderização) cobrindo criação, upload, edição e remoção de exames, incluindo parâmetros com acentuação para validar geração de IDs.
- [ ] Expandir gráficos evolutivos para aceitar séries multi-unidade (ex.: glicemia mg/dL vs mmol/L) com conversão e aviso de unidade mista.
- [ ] Revisar seção de áudios do paciente para listar duração e data/hora da gravação e permitir download por consulta.

## Pendências em foco (prioridade média)
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
- [ ] Criar interface para exibir anamnese estruturada
- [ ] Permitir edição de campos da anamnese

## Fase 5: Exame Físico e Bioimpedância
- [ ] Implementar Exame Físico Dinâmico
- [ ] Criar templates de exame físico por patologia
- [ ] Implementar lógica de campos condicionais
- [ ] Implementar upload de arquivo XLS da bioimpedância
- [ ] Criar parser para arquivo XPRO 850
- [ ] Integrar IA para análise interpretativa
- [ ] Implementar geração de PDF visual
- [ ] Criar editor HTML para ajustes antes do PDF
- [ ] Implementar gráficos de evolução da bioimpedância
- [ ] Criar tabela longitudinal de bioimpedância

## Fase 6: Escores Clínicos e Planos Terapêuticos
- [ ] Implementar cálculo de PREVENT (risco cardiovascular)
- [ ] Implementar cálculo de FRAX (risco de fratura)
- [ ] Criar sistema de pull automático de dados
- [ ] Implementar armazenamento de escores
- [ ] Criar gráficos e indicadores de escores
- [ ] Implementar Plano Terapêutico - Versão Médico
- [ ] Implementar Plano Terapêutico - Versão Paciente
- [ ] Criar editor HTML/Markdown para planos
- [ ] Integrar envio automático via WhatsApp

## Fase 7: Digitalização de Exames e Templates
- [ ] Implementar upload de PDF/Imagens de exames
- [ ] Integrar OCR para digitalização
- [ ] Criar normalização automática de nomes de exames
- [ ] Implementar criação automática de tabela de resultados
- [ ] Criar gráficos de evolução de exames
- [ ] Implementar comparação com exames anteriores
- [ ] Integrar sugestão automática de condutas por IA
- [ ] Implementar CRUD de Templates Personalizados
- [ ] Permitir anexar documentos de referência
- [ ] Configurar fluxos por doença
- [ ] Definir perguntas-chave de anamnese personalizadas
- [ ] Definir campos adicionais de exame físico personalizados

## Fase 8: Documentos Automáticos e Indicadores
- [ ] Implementar geração de Atestados
- [ ] Implementar geração de Declarações
- [ ] Implementar geração de Relatórios clínicos
- [ ] Implementar geração de Encaminhamentos
- [ ] Implementar geração de Laudos
- [ ] Criar editor HTML/Markdown para todos os documentos
- [ ] Implementar armazenamento de documentos no paciente
- [ ] Criar Dashboard de Indicadores Metabólicos
- [ ] Implementar consolidação de dados (Bioimpedância, Exames, Escores)
- [ ] Criar gráficos de composição corporal
- [ ] Criar velocímetros de risco
- [ ] Criar mini-infográficos
- [ ] Integrar indicadores com prontuário e planos terapêuticos

## Fase 9: Testes e Validação
- [ ] Criar testes unitários para procedures críticas
- [ ] Testar fluxo completo de consulta
- [ ] Testar integrações de IA
- [ ] Validar geração de documentos
- [ ] Testar responsividade do sistema
- [ ] Validar segurança e autenticação

## Fase 10: Entrega
- [ ] Criar checkpoint final
- [ ] Documentar sistema completo
- [ ] Preparar guia de uso
- [ ] Entregar ao usuário

## Correções de Bugs
- [x] Corrigir erro de setState durante render na página Home (useEffect para redirecionamento)

## Página de Detalhes do Paciente
- [x] Criar estrutura da página com sistema de abas
- [x] Implementar aba de Informações Gerais (edição de dados)
- [x] Implementar aba de Consultas (listagem e nova consulta)
- [x] Implementar aba de Exames Laboratoriais (upload e visualização)
- [x] Implementar aba de Bioimpedância (upload e gráficos)
- [x] Implementar aba de Documentos (geração e listagem)
- [x] Implementar aba de Indicadores Metabólicos (dashboard com gráficos)
- [x] Adicionar navegação entre abas
- [x] Testar todas as funcionalidades

## Página de Detalhes da Consulta
- [x] Criar estrutura da página com informações da consulta
- [x] Implementar seção de anamnese estruturada
- [x] Adicionar captura de áudio no navegador
- [x] Implementar estrutura básica de transcrição (simulação)
- [ ] Integrar transcrição real via Whisper API
- [ ] Integrar estruturação de anamnese via Gemini
- [x] Implementar exame físico com dados vitais e exame geral
- [x] Adicionar cálculo automático de IMC
- [ ] Criar templates de exame físico dinâmico por patologia
- [ ] Adicionar seção de hipóteses diagnósticas
- [ ] Implementar geração de plano terapêutico
- [x] Criar sistema de abas para organização

## Arquitetura de IA
- [x] Criar documento de arquitetura de IA detalhada
- [x] Implementar AI Orchestrator / AI Gateway
- [x] Criar interface comum para serviços de IA
- [x] Implementar sistema de configuração de prompts
- [x] Implementar sistema de logs e auditoria de IA
- [x] Criar serviço de IA de Anamnese (transcrição + estruturação)
- [ ] Criar serviço de IA de Análise de Bioimpedância
- [ ] Criar serviço de IA de Plano Terapêutico (versão médico)
- [ ] Criar serviço de IA de Plano Terapêutico (versão paciente)
- [ ] Criar serviço de IA de Documentos Automáticos
- [ ] Criar serviço de IA de Digitalização de Exames
- [ ] Criar serviço de IA de Indicadores Metabólicos
- [ ] Preparar infraestrutura para RAG (futuro)
- [x] Implementar integração real com Whisper API
- [x] Implementar integração real com Gemini
- [x] Criar endpoint tRPC para processar anamnese
- [x] Criar testes unitários para serviço de IA
- [x] Testar fluxos completos de IA

## Melhorias na Funcionalidade de Consulta
- [x] Preencher automaticamente data/hora com horário de Brasília ao criar nova consulta
- [x] Adicionar botão de "Nova Consulta" na tela inicial (Dashboard)
- [x] Criar modal de seleção de paciente para nova consulta
- [x] Testar funcionalidades

## Edição de Dados do Paciente
- [x] Adicionar modo de edição na aba de Informações da página de detalhes
- [x] Implementar formulário de edição com todos os campos
- [x] Adicionar botões Editar/Salvar/Cancelar
- [x] Implementar salvamento com feedback visual (toast)
- [x] Testar funcionalidade

## Integração de Áudio com IA
- [x] Implementar endpoint para upload de áudio para S3
- [x] Conectar botão de gravação ao processamento de IA
- [x] Implementar loading durante processamento
- [x] Preencher automaticamente campos da anamnese com dados retornados
- [x] Adicionar feedback visual de sucesso/erro
- [x] Testar fluxo completo de gravação → processamento → preenchimento

## Salvamento Automático da Anamnese
- [x] Verificar funcionalidade atual de salvamento
- [x] Adicionar indicador visual de alterações não salvas
- [x] Marcar como não salvo após processamento de IA
- [x] Adicionar confirmação visual de salvamento bem-sucedido
- [x] Permitir edição dos campos antes de salvar
- [x] Rastrear mudanças manuais nos campos
- [x] Testar fluxo completo

## Listagem de Consultas e Busca Global
- [x] Adicionar endpoint para listar consultas recentes
- [x] Criar card de "Consultas Recentes" no Dashboard (5 últimas)
- [x] Implementar busca global no cabeçalho (pacientes, consultas)
- [x] Criar seção de "Consultas em Aberto" no Dashboard
- [x] Adicionar botão "Finalizar Consulta" na página de detalhes
- [x] Adicionar botão "Cancelar Consulta" na página de detalhes
- [x] Implementar mudança de status da consulta (em_andamento → finalizada/cancelada)
- [x] Testar todas as funcionalidades

## Correção de Bugs
- [x] Corrigir sistema de busca de pacientes (não está encontrando)

## Módulo de Exames Laboratoriais
- [x] Criar serviço de IA para parsing de exames
- [x] Adicionar endpoint de processamento de exames
- [ ] Adicionar botão de upload de exames na página de consulta
- [ ] Implementar upload de PDFs/imagens de exames
- [ ] Implementar interface de revisão/edição de valores extraídos
- [ ] Criar gráficos de evolução temporal de exames
- [ ] Implementar comparação de valores (subindo/descendo)

## Módulo de Glicemia Capilar
- [ ] Criar sistema de upload de fotos de aferições
- [ ] Integrar IA para extrair valores de glicemia das fotos
- [ ] Criar gráficos diários de glicemia
- [ ] Implementar gráfico de tendências com Time in Range
- [ ] Calcular e exibir glicemias <70 e >200
- [ ] Criar interface de visualização de dados de glicemia

## Tela de Indicadores Metabólicos
- [ ] Criar aba de "Indicadores" na página do paciente
- [ ] Desenvolver indicadores baseados em condições clínicas
- [ ] Desenvolver indicadores baseados em exames
- [ ] Criar visualizações gráficas dos indicadores
- [ ] Implementar sistema de alertas para valores fora do normal

## Redesign de Layout
- [x] Criar sidebar azul com logo "Rafael Lara - CRM-BA 12345"
- [x] Adicionar itens de navegação na sidebar (Página inicial, Agenda, Pacientes, Bioimpedâncias, Protocolos salvos, Prescrições salvas, Configurações, Layouts, Sair)
- [x] Redesenhar Dashboard com cards grandes de ações principais
- [x] Criar cards: Nova Consulta, Acessar Prontuários, Agenda, Relatórios de Saúde, Templates de documentos, Escores Cadastrados
- [x] Mover busca de paciente para o topo (abaixo do header)
- [x] Adicionar widget "Últimas Consultas"
- [x] Aplicar esquema de cores azul (#2C5AA0 para sidebar, #6B8DBF para cards secundários)
- [x] Testar responsividade do novo layout

## Correções e Melhorias do Layout
- [x] Corrigir botão "Nova Consulta" no Dashboard
- [x] Corrigir outros botões que não funcionam
- [x] Aplicar layout com sidebar azul em todas as páginas do sistema
- [x] Criar componente de layout reutilizável (AppLayout)
- [x] Criar páginas faltantes (Agenda, Relatórios, Escores, etc.)

## Busca Melhorada
- [x] Implementar menu suspenso de resultados na busca
- [x] Exibir resultados em tempo real conforme digita
- [x] Permitir selecionar paciente da lista de resultados
- [x] Adicionar navegação direta ao clicar no resultado

## Extração de Exames Laboratoriais
- [ ] Criar interface de upload de exames na página de consulta
- [ ] Implementar upload de PDF/imagem para S3
- [ ] Processar exame com IA para extrair dados
- [ ] Exibir tabela editável com valores extraídos
- [ ] Salvar exames no banco de dados
- [ ] Criar gráficos de evolução temporal

## Página de Agenda Funcional
- [ ] Criar página de agenda com calendário interativo
- [ ] Implementar visualização mensal
- [ ] Adicionar funcionalidade de agendar consulta
- [ ] Exibir compromissos do dia
- [ ] Permitir editar/cancelar agendamentos
- [ ] Integrar com módulo de consultas

## Módulo de Bioimpedância
- [ ] Analisar PDF e Excel de bioimpedância para entender estrutura
- [ ] Criar schema de banco de dados para bioimpedância
- [ ] Implementar parser para arquivos Excel (.xls)
- [ ] Criar interface de upload de arquivos Excel
- [ ] Desenvolver visualização padronizada dos dados
- [ ] Criar cards de resumo (peso, IMC, gordura corporal, massa magra)
- [ ] Implementar gráficos de evolução temporal
- [ ] Adicionar análise interpretativa por IA
- [ ] Testar upload e visualização

## Módulo de Bioimpedância - COMPLETO
- [x] Analisar arquivo Excel de bioimpedância (59 campos identificados)
- [x] Criar parser BioimpedanciaParser.ts para ler arquivos .xls/.xlsx
- [x] Adicionar endpoint uploadExcel no router de bioimpedâncias
- [x] Implementar upload de arquivo com validação (tipo e tamanho)
- [x] Processar dados do Excel e salvar no banco de dados
- [x] Criar página BioimpedanciaDetalhes.tsx com visualização completa
- [x] Implementar cards de resumo (Peso, Gordura, Massa Muscular, Água)
- [x] Criar gráficos de composição corporal
- [x] Implementar análise musculoesquelética com barras de progresso
- [x] Adicionar análise de gordura (subcutânea, visceral)
- [x] Criar seção de controle de peso com metas
- [x] Implementar histórico de avaliações com seleção
- [x] Adicionar rota /bioimpedancia/:id no App.tsx
- [x] Corrigir parse de datas do Excel (formato serial)
- [x] Testar upload completo com arquivo real

## Listagem e Relatório de Bioimpedâncias
- [x] Criar endpoint list no router de bioimpedâncias com paginação
- [x] Implementar ordenação por data (mais recente primeiro)
- [x] Criar página BioimpedanciasPage com listagem
- [x] Adicionar paginação (10 itens por página)
- [x] Criar gerador de PDF para relatório de bioimpedância
- [x] Adicionar botão de impressão/download PDF
- [x] Testar listagem e geração de PDF

## Gráficos de Evolução Temporal
- [x] Instalar Chart.js e react-chartjs-2
- [x] Criar componente EvolutionChart
- [x] Adicionar gráfico de evolução de peso
- [x] Adicionar gráfico de evolução de IMC
- [x] Adicionar gráfico de evolução de gordura corporal
- [x] Adicionar gráfico de evolução de massa muscular
- [x] Integrar gráficos na página BioimpedanciaDetalhes
- [x] Testar visualização com dados reais

## PDF Personalizado de Bioimpedância (Layout InBody)
- [x] Analisar layout do modelo fornecido
- [x] Criar barra lateral azul com logo e dados do paciente
- [x] Adicionar tabelas de composição corporal com barras coloridas
- [x] Criar gráficos de análise músculo-gordura
- [x] Converter BodyAvatar para SVG
- [x] Integrar SVG do avatar no PDF
- [x] Testar PDF com avatar colorido
- [x] Adicionar tabelas detalhadas de análise segmentar
- [x] Testar geração e impressão do PDF

## Documentação para GPT
- [x] Criar guia completo da estrutura do projeto
- [x] Documentar convenções de código
- [x] Listar bibliotecas instaladas e componentes disponíveis
- [x] Preparar exemplos de código correto

## Finalização do PDF de Bioimpedância
- [x] Adicionar tabela de evolução temporal no PDF
- [x] Melhorar layout e tipografia para impressão
- [x] Adicionar legenda de cores do avatar segmentar
- [x] Adicionar placeholder para logo
- [x] Testar PDF finalizado

## Autopreencher Data/Hora em Nova Consulta
- [x] Modificar modal de nova consulta para autopreencher data/hora atual
- [x] Ajustar formato datetime-local do input
- [x] Testar criação de consulta com data preenchida

## Reestruturação da Área de Consulta
- [ ] Criar barra lateral azul com indicadores relevantes
- [ ] Adicionar seção de diagnósticos
- [ ] Adicionar seção de pontos de atenção
- [ ] Criar abas: HMA, EXAMES, RESUMO, PERFIL MET, DOCS, BIA, BOTÃO EXTRA
- [ ] Implementar seção de últimas consultas
- [ ] Adicionar botões CADASTRO e FINALIZAR
- [ ] Definir funcionalidade do "BOTÃO EXTRA"
- [ ] Testar novo layout de consulta

## Melhorias Prioritárias no PDF (Modelo InBody Completo)
- [x] Implementar Análise Músculo-Gordura com escalas horizontais completas
  - [x] Escala de Peso (kg) com faixas Abaixo/Normal/Acima
  - [x] Escala de Massa Muscular Esquelética (kg) com faixas
  - [x] Escala de Massa de Gordura (kg) com faixas
  - [x] Marcadores de posição atual em cada escala
- [x] Criar Análise de gordura de segmento com avatar colorido
  - [x] Avatar mostrando distribuição de gordura por segmento
  - [x] Cores baseadas em percentuais de gordura
  - [x] Legenda de interpretação das cores
- [x] Ajustar layout para caber todas as seções em A4
- [x] Testar PDF com dados reais

## Completar PDF InBody Profissional
- [x] Adicionar Análise Músculo-Gordura com escalas horizontais
- [x] Adicionar Análise de Gordura Segmentar com avatar colorido
- [x] Adicionar Análise Muscular Segmentar com avatar colorido
- [x] Adicionar tabela de evolução temporal
- [ ] Adicionar Curvas de Evolução de Segmento com histórico detalhado
- [ ] Processar e adicionar logo no topo da barra lateral (pendente)
- [ ] Ajustar fontes e espaçamento para layout profissional final
- [ ] Testar PDF completo

## Gráficos de Evolução no PDF
- [x] Criar função para gerar gráficos de linha no PDF
- [x] Adicionar seção "Evolução de Peso" com gráfico de linha
- [x] Adicionar seção "Evolução de Gordura" com gráfico de linha
- [x] Testar PDF com gráficos de evolução


## Próximas Implementações Prioritárias

### Módulo de Exames Laboratoriais (PROMPT_EXAMES_LABORATORIAIS_GPT.md)
- [ ] Adicionar helpers de banco de dados em server/db.ts
- [ ] Completar endpoints tRPC em server/routers.ts
- [ ] Criar página de upload ExameUpload.tsx
- [ ] Criar página de edição ExameEdit.tsx
- [ ] Criar listagem ExamesList.tsx
- [ ] Criar componente de gráficos ExameEvolutionChart.tsx
- [ ] Integrar na aba de Exames do PacienteDetalhes.tsx
- [ ] Adicionar rotas no App.tsx
- [ ] Testar upload e processamento com IA
- [ ] Testar edição de valores
- [ ] Testar cálculo de índices metabólicos (HOMA-IR, TyG, QUICKI)
- [ ] Testar gráficos de evolução

### Layout de Consulta 3 Colunas (PROMPT_LAYOUT_CONSULTA_3_COLUNAS.md)
- [ ] Criar layout de 3 colunas com grid/flexbox
- [ ] Implementar barra lateral azul com logo e navegação
- [ ] Implementar coluna de últimas consultas (lado direito)
- [ ] Criar header com cronômetro de consulta em tempo real
- [ ] Refatorar aba HMA (reorganizar código existente - 1ª aba)
- [ ] Refatorar aba Exame Físico (reorganizar código existente - 2ª aba, anteriormente "EXTRA")
- [ ] Criar aba Resumo com geração de IA (3ª aba)
- [ ] Criar aba Perfil Metabólico - integrar com exames (4ª aba)
- [ ] Criar aba Documentos - templates + geração de PDF (5ª aba)
- [ ] Integrar aba Bioimpedância - usar módulo existente (6ª aba)
- [ ] Melhorar aba Hipóteses e Conduta (7ª aba)
- [ ] Implementar cronômetro em tempo real com cores (verde < 30min, laranja 30-60min, vermelho > 60min)
- [ ] Implementar navegação entre abas na barra lateral
- [ ] Implementar salvamento automático de tempo decorrido
- [ ] Implementar carregamento de consultas anteriores do paciente
- [ ] Implementar navegação entre consultas na coluna direita
- [ ] Testar responsividade em mobile (colunas laterais em drawers)
- [ ] Testar navegação por teclado (Tab, Setas)


## Resumo de Consulta com IA (Implementação Atual)
- [x] Criar serviço de IA para geração de resumo (consultaSummaryService.ts)
- [x] Adicionar campo 'resumo' no schema de consultas
- [x] Implementar endpoint tRPC para gerar resumo
- [x] Criar interface de usuário para exibir e editar resumo
- [x] Adicionar botão "Gerar Resumo com IA"
- [x] Implementar loading durante geração
- [x] Permitir edição do resumo gerado
- [x] Salvar resumo no banco de dados
- [x] Criar testes unitários para o serviço
- [x] Testar funcionalidade completa


## Prompts para Implementação Futura (Gemini/GPT)

### PROMPT 1: Sincronização HMA + Feedback IA
- [x] Criar serviço `exameFisicoSuggestionService.ts`
- [x] Adicionar endpoint `syncHmaWithAI`
- [x] Renomear aba "Anamnese" para "HMA"
- [x] Adicionar botão "Sincronizar com IA" na aba HMA
- [x] Criar cards de sugestões na aba Exame Físico
- [ ] Implementar remoção individual de sugestões
- [x] Testar geração de sugestões direcionadas

### PROMPT 2: Sistema de Atualização com IA
- [x] Criar serviço `abaUpdateSuggestionService.ts`
- [x] Adicionar endpoint `getAbaSuggestions`
- [x] Criar componente `SugestoesModal.tsx`
- [ ] Adicionar botão "Atualizar com IA" em todas as 5 abas
- [ ] Implementar lógica de aplicação de sugestões
- [ ] Testar sugestões específicas para cada aba

### PROMPT 3: Layout 3 Colunas + 7 Abas
- [ ] Criar barra lateral azul fixa (20%)
- [ ] Adicionar logo e navegação vertical de 7 abas
- [ ] Criar coluna de últimas consultas (20%)
- [ ] Implementar cronômetro em tempo real
- [ ] Ajustar área principal (60%)
- [ ] Implementar responsividade com drawers
- [ ] Testar navegação entre abas e consultas

### PROMPT 4: Módulo Exames Laboratoriais
- [ ] Adicionar helpers de banco em `server/db.ts`
- [ ] Criar endpoints: uploadAndParse, update, delete, calcularIndices
- [ ] Criar página `ExamesPaciente.tsx`
- [ ] Implementar upload de PDF/imagem
- [ ] Criar componente `ExameEditableTable.tsx`
- [ ] Implementar cálculo de HOMA-IR, TyG, QUICKI
- [ ] Instalar Chart.js e criar gráficos de evolução
- [ ] Testar extração automática de dados


## PROMPT MEGA: 5 Módulos Completos

### Módulo 1: Modal de Sugestões Interativo
- [ ] Criar componente `SugestoesModal.tsx`
- [ ] Adicionar estado para controlar modal (modalSugestoesOpen, abaAtualSugestoes)
- [ ] Adicionar botão "Atualizar com IA" em cada aba (HMA, Exame Físico, Resumo, Hipóteses, Plano)
- [ ] Implementar lógica de aplicação de sugestões aceitas
- [ ] Testar modal com diferentes abas

### Módulo 2: Botão Aplicar Sugestões no Exame Físico
- [ ] Adicionar função `buildExameTextFromSuggestion`
- [ ] Adicionar função `handleAplicarSugestao`
- [ ] Adicionar função `handleRemoverSugestao`
- [ ] Adicionar botões "Aplicar" e "Remover" nos cards de sugestão
- [ ] Testar aplicação automática de texto no exame físico

### Módulo 3: Sistema de Documentos (Templates + PDFs)
- [ ] Adicionar schema `documentos` no banco de dados
- [ ] Criar helpers de banco (getDocumentosByPaciente, createDocumento, deleteDocumento)
- [ ] Criar endpoints tRPC (getByPaciente, create, generatePDF, delete)
- [ ] Criar página `DocumentosPaciente.tsx`
- [ ] Implementar 4 templates (atestado, receita, relatório, solicitação de exames)
- [ ] Integrar geração de PDF com manus-md-to-pdf
- [ ] Testar criação e download de PDFs

### Módulo 4: Aba de Perfil Metabólico
- [ ] Adicionar aba "Perfil Metabólico" na página de consulta
- [ ] Exibir últimos exames laboratoriais do paciente
- [ ] Exibir índices metabólicos calculados (HOMA-IR, TyG Index, QUICKI)
- [ ] Adicionar botão para navegar para página completa de exames
- [ ] Testar integração com módulo de exames

### Módulo 5: Sistema de Busca Inteligente
- [ ] Criar endpoint `busca.global` no tRPC
- [ ] Implementar busca por nome, CPF e telefone de pacientes
- [ ] Implementar busca por queixa principal em consultas
- [ ] Criar componente `BuscaGlobal.tsx` com dropdown de resultados
- [ ] Integrar componente no header do dashboard
- [ ] Testar navegação aos resultados


## Template de Receituário Profissional
- [x] Analisar PDF do receituário padrão do Dr. Rafael Lara
- [x] Extrair layout, cores (#2C5AA0 azul primário) e estrutura
- [x] Criar template HTML/CSS profissional (receituario_template.html)
- [x] Criar template Markdown simplificado (receituario_template.md)
- [x] Atualizar PROMPT_MEGA com template correto
- [ ] Testar geração de PDF com manus-md-to-pdf
- [ ] Validar fidelidade visual com PDF original


## Processamento de Templates SVG
- [x] Receber arquivos SVG originais (Receituario2.svg, AnáliseCorporal.svg)
- [x] Copiar SVGs para pasta templates/
- [x] Criar serviço svgProcessor.ts para manipulação de SVG
- [x] Criar serviço documentGenerator.ts para geração de PDFs
- [x] Instalar puppeteer para conversão SVG→PDF
- [x] Implementar função fillReceituarioSVG com SVG como background
- [x] Implementar conversão HTML→PDF com Puppeteer
- [x] Instalar Chrome para Puppeteer
- [x] Criar script de teste (test-receituario.ts)
- [x] Testar geração de receituário em PDF
- [x] Validar fidelidade visual do PDF gerado (95% fiel ao original)
- [ ] Implementar função fillBioimpedanciaSVG com dados de exame
- [ ] Criar endpoints tRPC para gerar documentos
- [ ] Testar geração de relatório de bioimpedância em PDF


## Implementação Atual (Solicitação do Usuário)
- [ ] Adicionar botões "Atualizar com IA" em todas as 7 abas
- [ ] Criar endpoint tRPC `consultas.gerarReceituario`
- [ ] Criar endpoint tRPC `consultas.gerarDocumento`
- [ ] Integrar documentGenerator.ts com endpoints
- [ ] Refatorar layout da consulta com 3 colunas
- [ ] Criar sidebar azul esquerda com indicadores relevantes
- [ ] Adicionar área central com 7 abas (HMA, EXAMES, RESUMO, PERFIL MET, DOCS, BIA, BOTÃO EXTRA)
- [ ] Criar coluna direita com últimas consultas
- [ ] Adicionar botões CADASTRO e FINALIZAR no header
- [ ] Implementar lógica de aplicação de sugestões do modal
- [ ] Testar geração de receituário via interface


## Migração para ConsultaDetalhesV2
- [x] Migrar estado de anamnese (queixaPrincipal, hda, etc.)
- [x] Migrar mutations (updateConsulta, generateSummary, syncHma)
- [x] Migrar lógica de gravação de áudio (MediaRecorder API)
- [x] Migrar lógica de transcrição com IA
- [x] Migrar formulários completos da aba HMA
- [x] Migrar botão "Sincronizar com IA"
- [ ] Migrar exibição de sugestões de exame físico
- [ ] Testar gravação, transcrição e salvamento


## Aba de Documentos (Implementação Atual)
- [x] Criar interface da aba Documentos no ConsultaDetalhesV2
- [x] Adicionar formulário de prescrição (medicamentos, posologia, orientações)
- [x] Atualizar svgProcessor.ts para preencher template de receituário
- [x] Integrar endpoint tRPC gerarReceituario
- [x] Implementar botão "Gerar Receituário em PDF"
- [x] Exibir preview/download do PDF gerado
- [ ] Salvar URL do PDF no banco de dados
- [ ] Testar geração de receituário completo


## MEGA PROMPT: 10 Módulos Completos (Próxima Implementação)

### Módulo 1: Migração Completa da Aba Exame Físico
- [ ] Migrar dados vitais (peso, altura, IMC, PA, FC, temperatura)
- [ ] Migrar exame geral (textarea)
- [ ] Migrar exame por sistemas (textarea)
- [ ] Exibir sugestões de IA geradas pela sincronização HMA
- [ ] Adicionar botão "Atualizar com IA"

### Módulo 2: Botão "Aplicar" nas Sugestões de Exame Físico
- [ ] Adicionar botão "Aplicar" em cada card de sugestão
- [ ] Implementar lógica de inserção automática de texto
- [ ] Diferenciar entre exame geral e exame por sistemas
- [ ] Adicionar botão "Remover" para descartar sugestão
- [ ] Feedback visual ao aplicar sugestão

### Módulo 3: Migração da Aba Resumo
- [ ] Migrar exibição do resumo gerado por IA
- [ ] Migrar botão "Gerar Resumo com IA"
- [ ] Migrar seções do resumo (queixas, achados, hipóteses, condutas)
- [ ] Permitir edição do resumo
- [ ] Salvar resumo editado no banco

### Módulo 4: Migração da Aba Hipóteses e Conduta
- [ ] Migrar campo de hipóteses diagnósticas
- [ ] Migrar campo de plano terapêutico
- [ ] Migrar campo de orientações
- [ ] Adicionar botão "Atualizar com IA"
- [ ] Salvar dados no banco

### Módulo 5: Aba de Perfil Metabólico
- [ ] Criar query para buscar últimos exames laboratoriais
- [ ] Exibir cards com valores de glicemia, HbA1c, colesterol, triglicerídeos
- [ ] Calcular e exibir HOMA-IR, TyG Index, QUICKI
- [ ] Adicionar badges de status (normal/alterado/crítico)
- [ ] Botão para navegar para página de exames completa

### Módulo 6: Sistema de Histórico de Documentos
- [ ] Criar tabela `documentos` no schema
- [ ] Salvar URL e metadados de PDFs gerados
- [ ] Exibir lista de documentos na aba Documentos
- [ ] Permitir reimpressão sem regenerar
- [ ] Adicionar filtro por tipo de documento

### Módulo 7: Cronômetro de Consulta no Header
- [ ] Calcular tempo decorrido desde início da consulta
- [ ] Exibir cronômetro em tempo real
- [ ] Cores dinâmicas (verde < 30min, laranja 30-60min, vermelho > 60min)
- [ ] Atualizar a cada segundo

### Módulo 8: Coluna de Últimas Consultas
- [ ] Criar query para buscar últimas 5 consultas do paciente
- [ ] Exibir cards com data, queixa principal e status
- [ ] Navegação rápida ao clicar
- [ ] Destacar consulta atual

### Módulo 9: Indicadores Relevantes na Sidebar
- [ ] Calcular FRAX (risco de fratura)
- [ ] Calcular ASCVD (risco cardiovascular)
- [ ] Exibir diagnósticos ativos do paciente
- [ ] Exibir pontos de atenção clínicos
- [ ] Atualizar dinamicamente conforme dados da consulta

### Módulo 10: Sistema de Busca Global
- [ ] Criar endpoint de busca global (pacientes + consultas)
- [ ] Componente de busca com dropdown de resultados
- [ ] Buscar por nome, CPF, telefone (pacientes)
- [ ] Buscar por queixa principal (consultas)
- [ ] Navegação direta ao selecionar resultado


## MEGA PROMPT: Módulos 11-20 (Funcionalidades Complementares)

### Módulo 11: Sistema Completo de Exames Laboratoriais
- [ ] Upload de PDFs/imagens de exames
- [ ] Extração automática de dados via IA (Gemini Vision)
- [ ] Tabela editável para revisar valores extraídos
- [ ] Cálculo automático de índices metabólicos
- [ ] Gráficos de evolução temporal (Chart.js)
- [ ] Página dedicada para gerenciar exames

### Módulo 12: Módulo de Agenda e Agendamentos
- [ ] Calendário mensal com visualização de consultas
- [ ] Criar/editar/cancelar agendamentos
- [ ] Filtros por status (agendado/realizado/cancelado)
- [ ] Notificações de consultas próximas
- [ ] Integração com WhatsApp para confirmação

### Módulo 13: Módulo Completo de Bioimpedância (BIA)
- [ ] Formulário de entrada de dados de BIA
- [ ] Cálculo automático de composição corporal
- [ ] Geração de PDF com template SVG profissional
- [ ] Gráficos de evolução de peso/gordura/músculo
- [ ] Comparação com exames anteriores

### Módulo 14: Templates Adicionais de Documentos
- [ ] Template de Atestado Médico
- [ ] Template de Relatório Médico
- [ ] Template de Solicitação de Exames
- [ ] Editor Markdown para personalização
- [ ] Geração de PDF para cada template

### Módulo 15: Sistema de Notificações ao Proprietário
- [ ] Notificar nova consulta agendada
- [ ] Notificar feedback de paciente
- [ ] Notificar exames críticos
- [ ] Configuração de preferências de notificação
- [ ] Histórico de notificações enviadas

### Módulo 16: Relatórios e Estatísticas
- [ ] Dashboard com KPIs (consultas/mês, pacientes ativos)
- [ ] Gráfico de consultas por período
- [ ] Gráfico de diagnósticos mais frequentes
- [ ] Exportar relatórios em Excel/PDF
- [ ] Filtros por data, paciente, diagnóstico

### Módulo 17: Gráficos de Evolução de Parâmetros
- [ ] Gráfico de evolução de peso
- [ ] Gráfico de evolução de glicemia/HbA1c
- [ ] Gráfico de evolução de pressão arterial
- [ ] Gráfico de evolução de colesterol/triglicerídeos
- [ ] Comparação de múltiplos parâmetros

### Módulo 18: Protocolos Clínicos Salvos
- [ ] Criar/editar protocolos personalizados
- [ ] Aplicar protocolo em consulta
- [ ] Biblioteca de protocolos (diabetes, obesidade, tireoide)
- [ ] Compartilhar protocolos entre consultas
- [ ] Versionamento de protocolos

### Módulo 19: Calculadoras Médicas Integradas
- [ ] Calculadora de IMC (já existe, melhorar)
- [ ] Calculadora de TFG (Taxa de Filtração Glomerular)
- [ ] Calculadora de Risco Cardiovascular (Framingham)
- [ ] Calculadora de Dose de Medicamentos
- [ ] Integrar resultados diretamente na consulta

### Módulo 20: Dashboard Administrativo
- [ ] Visão geral de pacientes ativos/inativos
- [ ] Consultas realizadas vs agendadas
- [ ] Receita estimada (se aplicável)
- [ ] Tempo médio de consulta
- [ ] Taxa de retorno de pacientes


## Integração dos 5 Módulos Prioritários (Em Andamento)

### Módulo 1: Aba de Exame Físico
- [x] Adicionar campo sugestoesExameFisico ao schema
- [x] Aplicar migração no banco de dados
- [x] Criar endpoint getSugestoes
- [x] Criar endpoint atualizarExameFisico
- [x] Criar endpoint gerarSugestoes com IA
- [ ] Migrar formulário de exame físico para ConsultaDetalhesV2
- [ ] Exibir sugestões de IA em cards
- [ ] Integrar salvamento de dados vitais

### Módulo 2: Botão Aplicar Sugestões
- [ ] Criar endpoint atualizarSugestoesExameFisico
- [ ] Implementar handleAplicarSugestao
- [ ] Implementar handleRemoverSugestao
- [ ] Adicionar botões nos cards de sugestões
- [ ] Feedback visual ao aplicar

### Módulo 7: Cronômetro de Consulta
- [ ] Criar hook useConsultaTimer
- [ ] Criar componente CronometroConsulta
- [ ] Integrar no header do ConsultaDetalhesV2
- [ ] Cores dinâmicas (verde/laranja/vermelho)

### Módulo 8: Coluna de Últimas Consultas
- [ ] Criar endpoint getUltimasConsultas
- [ ] Criar componente UltimasConsultasColumn
- [ ] Integrar na coluna direita (20%)
- [ ] Navegação entre consultas

### Módulo 6: Histórico de Documentos
- [ ] Criar tabela documentos no schema
- [ ] Criar endpoints salvarDocumento e listarDocumentos
- [ ] Atualizar gerarReceituario para salvar histórico
- [ ] Exibir lista de documentos na aba Documentos
- [ ] Botão de download para cada documento


## Integração dos Módulos 9-20 (Em Andamento)

### Módulo 9: Sidebar com IA para Indicadores
- [x] Criar serviço de IA para sugerir escores clínicos relevantes
- [x] Criar endpoint tRPC exameFisico.sugerirEscores
- [x] Criar componente IndicadoresSidebar.tsx
- [x] Integrar sidebar no ConsultaDetalhesV2
- [x] Exibir escores sugeridos pela IA com priorização
- [ ] Exibir pontos de atenção gerados por IA
- [ ] Testar cálculo de indicadores

### Módulo 4: Aba Hipóteses e Conduta
- [ ] Migrar conteúdo da aba Hipóteses do ConsultaDetalhes.tsx
- [ ] Adicionar campos de hipóteses diagnósticas
- [ ] Adicionar campo de plano terapêutico
- [ ] Adicionar campo de orientações ao paciente
- [ ] Implementar salvamento automático
- [ ] Testar funcionalidade

### Módulo 5: Aba Perfil Metabólico
- [ ] Criar endpoint para obter últimos exames do paciente
- [ ] Implementar cálculo de HOMA-IR
- [ ] Implementar cálculo de TyG Index
- [ ] Implementar cálculo de QUICKI
- [ ] Criar interface da aba Perfil Metabólico
- [ ] Exibir cards com índices calculados
- [ ] Adicionar badges de status (normal/alterado/crítico)
- [ ] Testar funcionalidade

### Módulos 10-20: Funcionalidades Adicionais
- [ ] Módulo 10: Sistema de busca global melhorado
- [ ] Módulo 11: Exames laboratoriais completo (upload + extração IA)
- [ ] Módulo 12: Agenda funcional com calendário
- [ ] Módulo 13: Bioimpedância completa integrada
- [ ] Módulo 14: Templates adicionais de documentos
- [ ] Módulo 15: Sistema de notificações
- [ ] Módulo 16: Relatórios e estatísticas
- [ ] Módulo 17: Gráficos de evolução
- [ ] Módulo 18: Protocolos clínicos salvos
- [ ] Módulo 19: Calculadoras médicas
- [ ] Módulo 20: Dashboard administrativo


### Módulo 4: Aba Hipóteses e Conduta
- [x] Criar endpoints tRPC updateHipotesesConduta e atualizarHipotesesCondutaIA
- [x] Criar componente AbaHipotesesConduta.tsx
- [x] Integrar aba no ConsultaDetalhesV2
- [x] Adicionar botão "Atualizar com IA" para gerar sugestões
- [x] Implementar salvamento manual com indicador de alterações não salvas


### Módulo 5: Perfil Metabólico com IA
- [x] Criar endpoint getUltimosExames (retorna dados brutos sem índices hardcoded)
- [x] Criar endpoint sugerirIndicesMetabolicos (IA sugere índices relevantes)
- [x] Criar componente AbaPerfilMetabolico.tsx
- [x] Exibir exames básicos (glicemia, HbA1c, perfil lipídico, tireoide)
- [x] Exibir índices metabólicos sugeridos pela IA (HOMA-IR, TyG, etc.)
- [x] Integrar aba no ConsultaDetalhesV2


### Módulo 10: Busca Global Avançada
- [x] Criar endpoint buscaGlobal no backend
- [x] Buscar pacientes por nome, CPF e WhatsApp
- [x] Buscar consultas por queixa principal e nome do paciente
- [x] Criar componente GlobalSearch.tsx com dropdown de resultados
- [x] Integrar busca global no AppLayout (header do dashboard)
- [x] Exibir resultados agrupados (PACIENTES e CONSULTAS)
- [x] Navegação direta para paciente ou consulta ao clicar


### Módulo 11: Upload e Parsing de Exames Laboratoriais
- [ ] Criar endpoint de upload de arquivos (PDF/imagem)
- [ ] Integrar OCR para extração de texto de imagens
- [ ] Criar serviço de IA para parsing de valores laboratoriais
- [ ] Criar componente de upload com drag-and-drop
- [ ] Exibir preview do arquivo antes do upload
- [ ] Salvar exame parseado no banco de dados
- [ ] Integrar com Módulo 5 (Perfil Metabólico)

### Módulo 12: Agenda Funcional com Calendário
- [ ] Criar schema de agendamentos no banco
- [ ] Criar endpoints CRUD para agendamentos
- [ ] Criar componente de calendário interativo
- [ ] Implementar visualização mensal/semanal/diária
- [ ] Adicionar funcionalidade de criar novo agendamento
- [ ] Adicionar funcionalidade de editar agendamento
- [ ] Adicionar funcionalidade de cancelar agendamento
- [ ] Integrar com sistema de pacientes

### Módulo 18: Prescrições Médicas Inteligentes
- [x] Adicionar schema (medicamentos, prescricoes, itens_prescricao)
- [x] Criar helpers de banco (criarPrescricaoComItens, listarPrescricoes)
- [x] Criar serviço de IA sugerirPrescricaoIA
- [x] Criar serviço de IA verificarInteracoesIA
- [x] Criar endpoints tRPC prescricoes (criar, listar, obter)
- [x] Criar endpoints tRPC medicamentos (buscar, listar)
- [x] Criar página PrescricoesPage com listagem de prescrições
- [x] Criar modal ModalNovaPrescricao com formulário
- [x] Adicionar sugestões de IA (botão "Sugerir com IA")
- [x] Integrar verificação de interações (botão "Verificar Interações")
- [x] Adicionar rotas no App.tsx (/prescricoes/:id)
- [x] Criar hook use-toast
- [ ] Testar funcionalidade completa no browser
- [x] Criar testes unitários (8 testes)
- [x] Testar integração completa (todos os testes passaram)


### Integração Módulo 18 com ConsultaDetalhesV2
- [x] Adicionar botão "Criar Prescrição" no header da ConsultaDetalhesV2
- [x] Integrar ModalNovaPrescricao na página de consulta
- [x] Pré-popular diagnóstico com hipóteses da consulta
- [x] Testar fluxo completo (consulta → prescrição)


### Reorganização da Interface de Documentos
- [x] Remover botão "Criar Prescrição" do header da ConsultaDetalhesV2
- [x] Aba "DOCS" já existia no sistema de abas
- [x] Adicionar botão "Gerar Receita" na aba DOCS (abre modal de prescrição)
- [x] Adicionar botão "Gerar Atestado" na aba DOCS (placeholder)
- [x] Adicionar botão "Pedido de Exames" na aba DOCS (placeholder)
- [x] Adicionar botão "Relatório Médico" na aba DOCS (placeholder)
- [x] Adicionar botão "Declaração" na aba DOCS (placeholder)
- [x] Adicionar botão "Laudo Médico" na aba DOCS (placeholder)
- [x] Testar fluxo completo


### Correção de Roteamento - Nova Consulta
- [x] Identificar componente antigo de consulta (ConsultaDetalhes.tsx)
- [x] Verificar rotas no App.tsx
- [x] Atualizar rota /consulta/:id para usar ConsultaDetalhesV2
- [x] Remover import do componente antigo
- [x] Testar fluxo: Dashboard → Nova Consulta → ConsultaDetalhesV2
- [x] Testar fluxo: Pacientes → Consultas → ConsultaDetalhesV2


### Correções ConsultaDetalhesV2
- [x] Corrigir botão "Finalizar Consulta" que não está funcionando
- [x] Corrigir menu que não aparece na página de consulta (botão hamburguer para voltar ao dashboard)
- [x] Corrigir erro ao carregar últimas consultas na sidebar direita (endpoint existe, usando cast temporário)
- [x] Adicionar botão "Sincronizar com IA" na sidebar de indicadores
- [x] Testar todas as correções

## Correção de Endpoint getUltimasConsultas
- [x] Corrigir erro "No procedure found on path 'consultas.getUltimasConsultas'"
- [x] Mover endpoint getUltimasConsultas do router exameFisico para router consultas
- [x] Corrigir chamada incorreta de createDocumento no router escores (deveria ser createEscoreClinico)
- [x] Executar testes para validar correção (58 testes passando)

## Correção de Bugs Reportados (30/11/2025)
- [x] Menu de abas (HMA, Exame Físico, BIA, etc) não estava aparecendo na página do paciente - CORRIGIDO: adicionado menu de navegação de abas após o header
- [x] Cronômetro começava a contar antes de iniciar a consulta - CORRIGIDO: agora só conta quando status for "em_andamento"
- [x] Idade do paciente não estava aparecendo no header da consulta - CORRIGIDO: implementado cálculo correto da idade considerando mês e dia
- [x] Botão de criar documentos (Gerar Receita) estava funcionando corretamente, outros botões mostram "em desenvolvimento" como esperado

## Correção de Bugs e Novas Funcionalidades (30/11/2025 - Parte 2)

### Bugs a Corrigir
- [x] Navegação entre consultas anteriores (coluna direita) abre página não encontrada - CORRIGIDO: rota era /consulta-v2/ mas deveria ser /consulta/
- [x] Erro no Exame Físico - CORRIGIDO: condição de renderização estava verificando "exames" ao invés de "exame-fisico"
- [x] Página de Exames Laboratoriais não acessível via página de consulta - CORRIGIDO: adicionada aba EXAMES com placeholder para funcionalidade futura

### Funcionalidade: Backup de Áudio
- [x] Salvar áudio gravado permanentemente no S3 (já está sendo feito)
- [x] Campo audioUrl já existe na tabela de consultas
- [ ] Criar seção "Áudios das Consultas" no histórico do paciente (pendente - frontend)
- [ ] Adicionar botão de play/download para cada áudio (pendente - frontend)
- [ ] Exibir duração e data/hora da gravação (pendente - frontend)

### Funcionalidade: Sistema de Resumo Evolutivo Inteligente
- [x] Criar serviço de IA para gerar resumo consolidado (resumo anterior + dados novos)
- [ ] Ao finalizar consulta: gerar automaticamente resumo consolidado (pendente - adicionar hook)
- [x] Ao abrir nova consulta: importar último resumo automaticamente (implementado com useEffect)
- [x] Adicionar indicador visual quando há novos dados (botão "Gerar Resumo" destacado com animação)
- [x] Implementar lógica de atualização inteligente do resumo (IA combina histórico + dados novos)
- [x] Criar campo "resumoEvolutivo" separado do resumo da consulta individual
- [x] Criar endpoints tRPC: gerarResumoEvolutivo, obterResumoEvolutivo, importarUltimoResumo
- [x] Criar componente AbaResumoEvolutivo com interface completa
- [ ] Testar fluxo completo: consulta 1 → finalizar → consulta 2 → importar resumo → atualizar
