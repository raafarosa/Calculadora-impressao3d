document.addEventListener('DOMContentLoaded', () => {

  // ==========================================
  // CONFIGURAÇÕES E ELEMENTOS DO DOM
  // ==========================================
  const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbx2_DffzKynMlEIH06bXC-2dwXmIVO-7mw5UEQwppe9GruLV_6F4H5X6o7sMTzG2moH/exec';

  const inputs = {
    projectName: document.getElementById('projectName'),
    costFilamentKg: document.getElementById('costFilamentKg'),
    costEnergyHour: document.getElementById('costEnergyHour'),
    costPackaging: document.getElementById('costPackaging'),
    costMaintenanceHour: document.getElementById('costMaintenanceHour'),
    filamentUsed: document.getElementById('filamentUsed'),
    filamentWaste: document.getElementById('filamentWaste'),
    printHours: document.getElementById('printHours'),
    printMinutes: document.getElementById('printMinutes'),
    quantity: document.getElementById('quantity'),
    customMultiplier: document.getElementById('customMultiplier'),
  };

  const pricingModeRadios = document.getElementsByName('pricingMode');
  const printTypeRadios = document.getElementsByName('printType');
  const customMultiplierGroup = document.getElementById('customMultiplierGroup');
  const btnSubmit = document.getElementById('btnSubmit');
  const submitStatus = document.getElementById('submitStatus');

  let calculatedValues = {};

  // ==========================================
  // FUNÇÕES AUXILIARES DE FORMATAÇÃO
  // ==========================================
  const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatPct = (val) => (val * 100).toFixed(1) + '%';

  // ==========================================
  // FUNÇÕES DE EXTRAÇÃO DE ENTRADAS
  // ==========================================

  // Captura o multiplicador e o modo de precificação
  const getPricingConfig = () => {
    let multiplier = 5.0;
    let selectedMode = 'Varejo (5.0x)';

    for (const radio of pricingModeRadios) {
      if (radio.checked) {
        if (radio.value === 'atacado') {
          multiplier = 3.0;
          selectedMode = 'Atacado (3.0x)';
          customMultiplierGroup.style.display = 'none';
        } else if (radio.value === 'varejo') {
          multiplier = 5.0;
          selectedMode = 'Varejo (5.0x)';
          customMultiplierGroup.style.display = 'none';
        } else if (radio.value === 'custom') {
          customMultiplierGroup.style.display = 'flex';
          multiplier = parseFloat(inputs.customMultiplier.value) || 1.0;
          selectedMode = `Personalizado (${multiplier.toFixed(1)}x)`;
        }
        break;
      }
    }
    return { multiplier, selectedMode };
  };

  // Calcula o tempo de máquina rodando (Corrigido para Mesa Cheia vs Peça Única)
  const getMachineHours = (totalHoursDecimal, qty) => {
    let printType = 'batch';
    for (const radio of printTypeRadios) {
      if (radio.checked) {
        printType = radio.value;
        break;
      }
    }

    // Se 'batch' (Mesa Cheia): O tempo informado no fatiador já cobre todas as peças
    // Se 'unit' (Peça Única): Multiplica o tempo individual pela quantidade de peças
    return printType === 'batch' ? totalHoursDecimal : (totalHoursDecimal * qty);
  };

  // ==========================================
  // LÓGICA DE CÁLCULO PRINCIPAL
  // ==========================================
  const calculate = () => {
    // 1. Leitura de Parâmetros Básicos
    const costKg = parseFloat(inputs.costFilamentKg.value) || 0;
    const costEnergyHr = parseFloat(inputs.costEnergyHour.value) || 0;
    const costPkgUn = parseFloat(inputs.costPackaging.value) || 0;
    const costMaintHr = parseFloat(inputs.costMaintenanceHour.value) || 0;

    const gUsed = parseFloat(inputs.filamentUsed.value) || 0;
    const gWaste = parseFloat(inputs.filamentWaste.value) || 0;
    const hrs = parseFloat(inputs.printHours.value) || 0;
    const mins = parseFloat(inputs.printMinutes.value) || 0;
    const totalHoursDecimal = hrs + (mins / 60);

    const qty = parseInt(inputs.quantity.value) || 1;

    // 2. Determinação de Estratégia e Tempo
    const { multiplier, selectedMode } = getPricingConfig();
    const totalMachineHours = getMachineHours(totalHoursDecimal, qty);

    // 3. Custos do Lote
    const costFilamentLote = (costKg / 1000) * gUsed * qty;
    const costWasteLote = (costKg / 1000) * gWaste * qty;
    const costEnergyLote = costEnergyHr * totalMachineHours; // Usa horas totais de máquina
    const costMaintLote = costMaintHr * totalMachineHours;   // Usa horas totais de máquina
    const costPkgLote = costPkgUn * qty;

    const totalCostLote = costFilamentLote + costWasteLote + costEnergyLote + costMaintLote + costPkgLote;
    const totalCostUnit = qty > 0 ? totalCostLote / qty : 0;

    // 4. Métricas Finais e Margens
    const priceUnit = totalCostUnit * multiplier;
    const revenueTotal = priceUnit * qty;
    const profitTotal = revenueTotal - totalCostLote;
    const profitUnit = qty > 0 ? profitTotal / qty : 0;

    const profitHour = totalMachineHours > 0 ? profitTotal / totalMachineHours : 0;
    const realMargin = revenueTotal > 0 ? profitTotal / revenueTotal : 0;

    // 5. Atualização da Interface do Usuário (UI)
    updateTableUI(costFilamentLote, costWasteLote, costEnergyLote, costMaintLote, costPkgLote, totalCostLote, qty);
    updateKpisUI(priceUnit, revenueTotal, totalCostLote, profitTotal, profitHour, profitUnit, realMargin, costEnergyHr);

    // 6. Preparação dos dados para persistência
    calculatedValues = prepareDataPayload(
      inputs.projectName.value,
      gUsed,
      gWaste,
      totalHoursDecimal,
      totalMachineHours,
      qty,
      selectedMode,
      totalCostLote,
      totalCostUnit,
      priceUnit,
      revenueTotal,
      profitTotal,
      profitUnit,
      profitHour,
      realMargin
    );
  };

  // ==========================================
  // FUNÇÕES DE ATUALIZAÇÃO DA INTERFACE (DOM)
  // ==========================================
  const updateTableUI = (filamentLote, wasteLote, energyLote, maintLote, pkgLote, totalLote, qty) => {
    document.getElementById('costFilamentLote').textContent = formatBRL(filamentLote);
    document.getElementById('costFilamentUnit').textContent = formatBRL(qty > 0 ? filamentLote / qty : 0);
    document.getElementById('costFilamentPct').textContent = totalLote > 0 ? formatPct(filamentLote / totalLote) : '0.0%';

    document.getElementById('costWasteLote').textContent = formatBRL(wasteLote);
    document.getElementById('costWasteUnit').textContent = formatBRL(qty > 0 ? wasteLote / qty : 0);
    document.getElementById('costWastePct').textContent = totalLote > 0 ? formatPct(wasteLote / totalLote) : '0.0%';

    document.getElementById('costEnergyLote').textContent = formatBRL(energyLote);
    document.getElementById('costEnergyUnit').textContent = formatBRL(qty > 0 ? energyLote / qty : 0);
    document.getElementById('costEnergyPct').textContent = totalLote > 0 ? formatPct(energyLote / totalLote) : '0.0%';

    document.getElementById('costMaintLote').textContent = formatBRL(maintLote);
    document.getElementById('costMaintUnit').textContent = formatBRL(qty > 0 ? maintLote / qty : 0);
    document.getElementById('costMaintPct').textContent = totalLote > 0 ? formatPct(maintLote / totalLote) : '0.0%';

    document.getElementById('costPkgLote').textContent = formatBRL(pkgLote);
    document.getElementById('costPkgUnit').textContent = formatBRL(qty > 0 ? pkgLote / qty : 0);
    document.getElementById('costPkgPct').textContent = totalLote > 0 ? formatPct(pkgLote / totalLote) : '0.0%';

    document.getElementById('costTotalLote').textContent = formatBRL(totalLote);
    document.getElementById('costTotalUnit').textContent = formatBRL(qty > 0 ? totalLote / qty : 0);
  };

  const updateKpisUI = (priceUnit, revenueTotal, totalCostLote, profitTotal, profitHour, profitUnit, realMargin, costEnergyHr) => {
    document.getElementById('resPriceUnit').textContent = formatBRL(priceUnit);
    document.getElementById('resCostTotalBatch').textContent = formatBRL(totalCostLote);
    document.getElementById('resRevenueTotal').textContent = formatBRL(revenueTotal);
    document.getElementById('resProfitTotal').textContent = formatBRL(profitTotal);
    document.getElementById('resProfitHour').textContent = formatBRL(profitHour);
    document.getElementById('resProfitUnit').textContent = formatBRL(profitUnit);
    document.getElementById('resRealMargin').textContent = formatPct(realMargin);
    document.getElementById('resEnergy8h').textContent = formatBRL(costEnergyHr * 8);
  };

  // Prepara o objeto formatado que vai para o Google Apps Script
  const prepareDataPayload = (projectName, gUsed, gWaste, totalHoursDecimal, totalMachineHours, qty, selectedMode, totalCostLote, totalCostUnit, priceUnit, revenueTotal, profitTotal, profitUnit, profitHour, realMargin) => {
    return {
      data_hora: new Date().toLocaleString('pt-BR'),
      nome_projeto: projectName || 'Projeto Sem Nome',
      filamento_g: gUsed,
      perda_g: gWaste,
      tempo_fatiador_h: totalHoursDecimal.toFixed(2),
      tempo_total_maquina_h: totalMachineHours.toFixed(2),
      quantidade: qty,
      modalidade: selectedMode,
      custo_lote: totalCostLote.toFixed(2).replace('.', ','),
      custo_unitario: totalCostUnit.toFixed(2).replace('.', ','),
      preco_sugerido_unit: priceUnit.toFixed(2).replace('.', ','),
      faturamento_total: revenueTotal.toFixed(2).replace('.', ','),
      lucro_total: profitTotal.toFixed(2).replace('.', ','),
      lucro_unitario: profitUnit.toFixed(2).replace('.', ','),
      lucro_hora: profitHour.toFixed(2).replace('.', ','),
      margem_real_pct: (realMargin * 100).toFixed(1) + '%'
    };
  };

  // ==========================================
  // ENVIO PARA O GOOGLE SHEETS
  // ==========================================
  const handleSubmit = async () => {
    btnSubmit.disabled = true;
    submitStatus.textContent = 'Enviando para a planilha...';
    submitStatus.className = 'submit-status';

    try {
      await fetch(GOOGLE_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(calculatedValues)
      });

      submitStatus.textContent = '✅ Orçamento salvo na planilha!';
      submitStatus.className = 'submit-status success';

      setTimeout(() => {
        submitStatus.textContent = '';
        btnSubmit.disabled = false;
      }, 3000);

    } catch (err) {
      console.error(err);
      submitStatus.textContent = '❌ Erro ao salvar na planilha.';
      submitStatus.className = 'submit-status error';
      btnSubmit.disabled = false;
    }
  };

  // ==========================================
  // REGISTRO DE EVENTOS E INICIALIZAÇÃO
  // ==========================================
  Object.values(inputs).forEach(input => input?.addEventListener('input', calculate));
  pricingModeRadios.forEach(radio => radio.addEventListener('change', calculate));
  printTypeRadios.forEach(radio => radio.addEventListener('change', calculate));
  btnSubmit?.addEventListener('click', handleSubmit);

  // Execução inicial para popular dados na tela
  calculate();
});