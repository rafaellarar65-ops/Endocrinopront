    } else {
      setExamePorSistemas((prev) => prev + "\n\n" + sug.textoSugerido);
    }
    setHasUnsavedChanges(true);
    toast.success("Sugestão aplicada");
  };

  // Carrega valores iniciais
  useEffect(() => {
    if (!consulta) return;

    const exameFisico = consulta.exameFisico as any;
    if (exameFisico) {
      setDadosVitais({
        peso: exameFisico.peso || 0,
        altura: exameFisico.altura || 0,
        imc: exameFisico.imc || 0,
        pressaoArterial: exameFisico.pressaoArterial || "",
        frequenciaCardiaca: exameFisico.frequenciaCardiaca || 0,
        temperatura: exameFisico.temperatura || 0,
      });
      setExameGeral(exameFisico.exameGeral || "");
      setExamePorSistemas(exameFisico.examePorSistemas || "");
    }
    setHasUnsavedChanges(false);
  }, [consulta]);

  // Cálculo automático do IMC
  useEffect(() => {
    if (dadosVitais.peso > 0 && dadosVitais.altura > 0) {
      const imc = dadosVitais.peso / ((dadosVitais.altura / 100) ** 2);
      setDadosVitais((prev) => ({
        ...prev,
        imc: parseFloat(imc.toFixed(1)),
      }));
    }
  }, [dadosVitais.peso, dadosVitais.altura]);

  const handleSalvar = async () => {
    if (!consulta) return;
    
    await atualizarExameFisicoMutation.mutateAsync({
      id: consulta.id,
      exameFisico: {
        ...dadosVitais,
        exameGeral,
        examePorSistemas,
      },
    });
  };

  const handleGerarSugestoes = async () => {
    await gerarSugestoesMutation.mutateAsync({ consultaId });
  };

  if (isLoadingConsulta) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Carregando dados da consulta...
      </div>
    );
  }

  if (!consulta) {
    return (
      <div className="text-center py-12 text-gray-500">
        Consulta não encontrada.
      </div>
    );
  }

  const prioridadeColor = {
    alta: "bg-red-100 text-red-700 border-red-300",
    media: "bg-yellow-100 text-yellow-700 border-yellow-300",
    baixa: "bg-green-100 text-green-700 border-green-300",
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold">Exame Físico</h2>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={handleGerarSugestoes}
            disabled={gerarSugestoesMutation.isPending}
          >
            {gerarSugestoesMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Gerando sugestões...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Atualizar com IA