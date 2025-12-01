# TODO - Prontuário Médico Inteligente - Endocrinologia

## Status Atual
Todas as funcionalidades críticas dos 14 PRs foram implementadas. O foco agora é testes de integração e refinamento.

## Funcionalidades Implementadas (Validadas)
- [x] PR #5: Receitas em PDF (Via `lib/prescricaoPdfService.ts` e `PrescricoesPage.tsx`)
- [x] PR #6: Atestados em PDF (Via `lib/atestadoPdfService.ts` e `AtestadoModal.tsx`)
- [x] PR #7: Relatórios Clínicos (Via `lib/relatorioClinicoPdfService.ts` e `RelatoriosPage.tsx`)
- [x] PR #8: Solicitação de Exames (Via `lib/solicitacaoExamesPdfService.ts` e `SolicitacaoExamesModal.tsx`)
- [x] PR #9: Declarações Médicas (Via `lib/declaracaoMedicaPdfService.ts` e `DeclaracaoMedicaModal.tsx`)
- [x] PR #10: Encaminhamentos (Via `lib/encaminhamentoPdfService.ts` e `EncaminhamentoModal.tsx`)
- [x] PR #11: Laudos (Via `lib/laudoPdfService.ts` e `ModalNovoLaudo.tsx`)
- [x] PR #17: Planos Terapêuticos (Editor e versões médico/paciente em `PacienteDetalhes.tsx` aba Planos)
- [x] Upload e Processamento de Exames com IA
- [x] Bioimpedância (Parser Excel, Visualização e PDF InBody)
- [x] Dashboard Metabólico e Timeline de Evolução

## Próximos Passos (Prioridade)
1. **Pipeline de Exames**: Refinar a interface de edição de valores extraídos pela IA para lidar melhor com unidades mistas (mg/dL vs mmol/L).
2. **Áudios**: Melhorar a UX do player de áudio na aba de Consultas.
3. **Testes**: Expandir a cobertura de testes E2E para o fluxo de geração de documentos.

## Validação das Funcionalidades (Checklist dos PRs)
Confirmei a presença dos arquivos que implementam cada funcionalidade solicitada:

- Receitas (#5): ModalNovaPrescricao.tsx usa gerarPrescricaoPdf e salva no banco. OK.
- Atestados (#6): AtestadoModal.tsx integrado com generateAtestadoPdf. OK.
- Relatórios (#7): RelatoriosPage.tsx e serviço de geração de PDF evolutivo. OK.
- Solicitação Exames (#8): SolicitacaoExamesModal.tsx permite selecionar itens e gerar PDF. OK.
- Declarações (#9): DeclaracaoMedicaModal.tsx com opção de assinatura digital/manual. OK.
- Encaminhamentos (#10): EncaminhamentoModal.tsx com histórico clínico. OK.
- Laudos (#11): ModalNovoLaudo.tsx com estrutura de achados e conclusão. OK.
- Planos Terapêuticos (#17): Implementado na aba "Planos" de PacienteDetalhes.tsx com suporte a templates e metas SMART. OK.
- Bioimpedância: Parser XLS, gráficos EvolutionChart e PDF InBody (BioimpedanciaPDFv3Final.ts). OK.
- IA Mestra: aiOrchestrator e serviços específicos (anamnese.ts, exames.ts) estão configurados. OK.
