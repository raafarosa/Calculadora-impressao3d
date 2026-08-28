document.addEventListener('DOMContentLoaded', () => {
  // COLE AQUI A URL GERADA NO PASSO 2 DO GOOGLE APPS SCRIPT
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
  const customMultiplierGroup = document.getElementById('customMultiplierGroup');
  const btnSubmit = document.getElementById('btnSubmit');
  const submitStatus = document.getElementById('submitStatus');

  let calculatedValues = {};

  const formatBRL = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const formatPct = (val) => (val * 100).toFixed(1) + '%';

  const calculate = () => {
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

    const costFilamentLote = (costKg / 1000) * gUsed * qty;
    const costWasteLote = (costKg / 1000) * gWaste * qty;
    const costEnergyLote = costEnergyHr * totalHoursDecimal * qty;
    const costMaintLote = costMaintHr * totalHoursDecimal * qty;
    const costPkgLote = costPkgUn * qty;

    const totalCostLote = costFilamentLote + costWasteLote + costEnergyLote + costMaintLote + costPkgLote;
    const totalCostUnit = qty > 0 ? totalCostLote / qty : 0;

    // Atualização da Tabela
    document.getElementById('costFilamentLote').textContent = formatBRL(costFilamentLote);
    document.getElementById('costFilamentUnit').textContent = formatBRL(qty > 0 ? costFilamentLote / qty : 0);
    document.getElementById('costFilamentPct').textContent = totalCostLote > 0 ? formatPct(costFilamentLote / totalCostLote) : '0.0%';

    document.getElementById('costWasteLote').textContent = formatBRL(costWasteLote);
    document.getElementById('costWasteUnit').textContent = formatBRL(qty > 0 ? costWasteLote / qty : 0);
    document.getElementById('costWastePct').textContent = totalCostLote > 0 ? formatPct(costWasteLote / totalCostLote) : '0.0%';

    document.getElementById('costEnergyLote').textContent = formatBRL(costEnergyLote);
    document.getElementById('costEnergyUnit').textContent = formatBRL(qty > 0 ? costEnergyLote / qty : 0);
    document.getElementById('costEnergyPct').textContent = totalCostLote > 0 ? formatPct(costEnergyLote / totalCostLote) : '0.0%';

    document.getElementById('costMaintLote').textContent = formatBRL(costMaintLote);
    document.getElementById('costMaintUnit').textContent = formatBRL(qty > 0 ? costMaintLote / qty : 0);
    document.getElementById('costMaintPct').textContent = totalCostLote > 0 ? formatPct(costMaintLote / totalCostLote) : '0.0%';

    document.getElementById('costPkgLote').textContent = formatBRL(costPkgLote);
    document.getElementById('costPkgUnit').textContent = formatBRL(qty > 0 ? costPkgLote / qty : 0);
    document.getElementById('costPkgPct').textContent = totalCostLote > 0 ? formatPct(costPkgLote / totalCostLote) : '0.0%';

    document.getElementById('costTotalLote').textContent = formatBRL(totalCostLote);
    document.getElementById('costTotalUnit').textContent = formatBRL(totalCostUnit);

    // Métricas Finais
    const priceUnit = totalCostUnit * multiplier;
    const revenueTotal = priceUnit * qty;
    const profitTotal = revenueTotal - totalCostLote;
    const profitUnit = qty > 0 ? profitTotal / qty : 0;
    
    const totalHoursBatch = totalHoursDecimal * qty;
    const profitHour = totalHoursBatch > 0 ? profitTotal / totalHoursBatch : 0;
    const realMargin = revenueTotal > 0 ? profitTotal / revenueTotal : 0;

    document.getElementById('resPriceUnit').textContent = formatBRL(priceUnit);
    document.getElementById('resRevenueTotal').textContent = formatBRL(revenueTotal);
    document.getElementById('resProfitTotal').textContent = formatBRL(profitTotal);
    document.getElementById('resProfitHour').textContent = formatBRL(profitHour);
    document.getElementById('resProfitUnit').textContent = formatBRL(profitUnit);
    document.getElementById('resRealMargin').textContent = formatPct(realMargin);
    document.getElementById('resEnergy8h').textContent = formatBRL(costEnergyHr * 8);

    // Guarda objeto para envio ao Sheets
    calculatedValues = {
      data_hora: new Date().toLocaleString('pt-BR'),
      nome_projeto: inputs.projectName.value || 'Projeto Sem Nome',
      filamento_g: gUsed,
      perda_g: gWaste,
      tempo_h: totalHoursDecimal.toFixed(2),
      quantidade: qty,
      modalidade: selectedMode,
      custo_lote: totalCostLote.toFixed(2),
      custo_unitario: totalCostUnit.toFixed(2),
      preco_sugerido_unit: priceUnit.toFixed(2),
      faturamento_total: revenueTotal.toFixed(2),
      lucro_total: profitTotal.toFixed(2),
      lucro_unitario: profitUnit.toFixed(2),
      lucro_hora: profitHour.toFixed(2),
      margem_real_pct: (realMargin * 100).toFixed(1) + '%'
    };
  };

  // Envio dos Dados via Fetch API
  btnSubmit.addEventListener('click', async () => {
    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL.includes('SUA_URL_DO_GOOGLE_APPS_SCRIPT_AQUI')) {
      alert('Por favor, cole a URL do seu Google Apps Script no arquivo script.js!');
      return;
    }

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

      submitStatus.textContent = '✅ Orçamento salvo com sucesso!';
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
  });

  Object.values(inputs).forEach(input => input.addEventListener('input', calculate));
  pricingModeRadios.forEach(radio => radio.addEventListener('change', calculate));

  calculate();
});