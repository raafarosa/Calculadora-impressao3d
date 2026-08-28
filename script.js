document.addEventListener('DOMContentLoaded', () => {
  // Elementos de Entrada (Inputs)
  const inputs = {
    costFilamentKg: document.getElementById('costFilamentKg'),
    costEnergyHour: document.getElementById('costEnergyHour'),
    costPackaging: document.getElementById('costPackaging'),
    costMaintenanceHour: document.getElementById('costMaintenanceHour'),
    filamentUsed: document.getElementById('filamentUsed'),
    filamentWaste: document.getElementById('filamentWaste'),
    printTime: document.getElementById('printTime'),
    quantity: document.getElementById('quantity'),
  };

  const pricingModeRadios = document.getElementsByName('pricingMode');

  // Auxiliar para formatação de moeda BRL
  const formatBRL = (val) => {
    return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  // Auxiliar para formatação de porcentagem
  const formatPct = (val) => {
    return (val * 100).toFixed(1) + '%';
  };

  // Função Principal de Cálculo
  const calculate = () => {
    // 1. Obter valores numéricos dos inputs
    const costKg = parseFloat(inputs.costFilamentKg.value) || 0;
    const costEnergyHr = parseFloat(inputs.costEnergyHour.value) || 0;
    const costPkgUn = parseFloat(inputs.costPackaging.value) || 0;
    const costMaintHr = parseFloat(inputs.costMaintenanceHour.value) || 0;

    const gUsed = parseFloat(inputs.filamentUsed.value) || 0;
    const gWaste = parseFloat(inputs.filamentWaste.value) || 0;
    const hours = parseFloat(inputs.printTime.value) || 0;
    const qty = parseInt(inputs.quantity.value) || 1;

    // 2. Obter Multiplicador Selecionado
    let multiplier = 5.0; // Padrão Varejo
    for (const radio of pricingModeRadios) {
      if (radio.checked) {
        multiplier = radio.value === 'atacado' ? 3.0 : 5.0;
        break;
      }
    }

    // 3. Cálculos da Tabela de Custos (Composição do Lote)
    const costFilamentLote = (costKg / 1000) * gUsed * qty;
    const costWasteLote = (costKg / 1000) * gWaste * qty;
    const costEnergyLote = costEnergyHr * hours * qty;
    const costMaintLote = costMaintHr * hours * qty;
    const costPkgLote = costPkgUn * qty;

    const totalCostLote = costFilamentLote + costWasteLote + costEnergyLote + costMaintLote + costPkgLote;
    const totalCostUnit = qty > 0 ? totalCostLote / qty : 0;

    // 4. Atualizar Tabela de Custos na Interface
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

    // 5. Cálculos dos KPIs Comerciais
    const priceUnit = totalCostUnit * multiplier;
    const revenueTotal = priceUnit * qty;
    const profitTotal = revenueTotal - totalCostLote;
    const profitUnit = qty > 0 ? profitTotal / qty : 0;
    
    const totalHoursBatch = hours * qty;
    const profitHour = totalHoursBatch > 0 ? profitTotal / totalHoursBatch : 0;
    const realMargin = revenueTotal > 0 ? profitTotal / revenueTotal : 0;
    const energy8h = costEnergyHr * 8;

    // 6. Atualizar Cards de KPI na Interface
    document.getElementById('resPriceUnit').textContent = formatBRL(priceUnit);
    document.getElementById('resRevenueTotal').textContent = formatBRL(revenueTotal);
    document.getElementById('resProfitTotal').textContent = formatBRL(profitTotal);
    document.getElementById('resProfitHour').textContent = formatBRL(profitHour);
    document.getElementById('resProfitUnit').textContent = formatBRL(profitUnit);
    document.getElementById('resRealMargin').textContent = formatPct(realMargin);
    document.getElementById('resEnergy8h').textContent = formatBRL(energy8h);
  };

  // Registrar escutadores de eventos para atualização em tempo real
  Object.values(inputs).forEach(input => {
    input.addEventListener('input', calculate);
  });

  for (const radio of pricingModeRadios) {
    radio.addEventListener('change', calculate);
  }

  // Executar cálculo inicial ao carregar a página
  calculate();
});