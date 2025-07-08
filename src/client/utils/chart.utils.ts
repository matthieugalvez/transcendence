export async function loadChartJS() {
  // ⚠️ import dynamique ⇒ n’est chargé qu’au clic sur “Stats”
  const { Chart, registerables } = await import('chart.js');
  Chart.register(...registerables);      // obligatoire depuis Chart.js v3+
  return Chart;
}