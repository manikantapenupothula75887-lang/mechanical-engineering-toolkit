// ==============================
// STATE
// ==============================
let calculationHistory = [];
let myChart, beamChartInstance, stressChartInstance, stressStrainChartInstance;
let customStrainData = [];
 
// ==============================
// INIT ON LOAD
// ==============================
window.addEventListener('load', function () {
  // Hide loader
  setTimeout(() => {
    const loader = document.getElementById('loader');
    if (loader) loader.style.display = 'none';
  }, 1200);
 
  // Restore theme
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') document.body.classList.add('light');
 
  // Load history from localStorage
  const saved = JSON.parse(localStorage.getItem('calcHistory') || '[]');
  calculationHistory = saved;
  renderHistoryList();
  renderHistoryBox();
 
  // Init charts AFTER DOM is ready
  initMainChart();
  initBeamChart();
  initStressStrainChart();
 
  // Accordion setup
  setupAccordions();
});
 
// ==============================
// SECTION NAVIGATION
// ==============================
function showSection(id) {
  document.querySelectorAll('.main-content section').forEach(sec => {
    sec.classList.add('hidden');
  });
  const target = document.getElementById(id);
  if (target) {
    target.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  // Update active sidebar link
  document.querySelectorAll('.sidebar a').forEach(a => a.classList.remove('active'));
}
 
function showDashboard() { showSection('dashboard'); }
 
function scrollToSection(id) {
  showSection(id);
}
 
function globalSearch() {
  const q = document.getElementById('globalSearch').value.toLowerCase().trim();
  if (!q) return;
  const secs = document.querySelectorAll('.main-content section');
  let found = null;
  secs.forEach(sec => {
    if (sec.innerText.toLowerCase().includes(q) && !found) found = sec.id;
  });
  if (found) showSection(found);
}
 
// ==============================
// SIDEBAR TOGGLE
// ==============================
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (!sb) return;
 
  if (window.innerWidth <= 768) {
    // Mobile: slide in/out with overlay
    sb.classList.toggle('open');
    overlay.classList.toggle('active');
  } else {
    // Desktop: collapse
    sb.classList.toggle('collapsed');
    // Adjust main content padding
    const mc = document.querySelector('.main-content');
    if (mc) {
      mc.style.paddingLeft = sb.classList.contains('collapsed') ? '' : '';
    }
  }
}
 
function closeSidebar() {
  const sb = document.getElementById('sidebar');
  const overlay = document.getElementById('sidebarOverlay');
  if (sb) sb.classList.remove('open');
  if (overlay) overlay.classList.remove('active');
}
 
// Close sidebar on resize to desktop
window.addEventListener('resize', function () {
  if (window.innerWidth > 768) {
    closeSidebar();
  }
});
 
// ==============================
// THEME
// ==============================
function toggleTheme() {
  document.body.classList.toggle('light');
  const isLight = document.body.classList.contains('light');
  localStorage.setItem('theme', isLight ? 'light' : 'dark');
  updateAllChartsTheme();
}
 
function updateAllChartsTheme() {
  const dark = !document.body.classList.contains('light');
  const tickColor = dark ? '#e5e7eb' : '#0f172a';
  const gridColor = dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';
 
  [myChart, beamChartInstance, stressChartInstance, stressStrainChartInstance].forEach(chart => {
    if (!chart) return;
    chart.options.plugins.legend.labels.color = tickColor;
    if (chart.options.scales) {
      ['x','y'].forEach(axis => {
        if (chart.options.scales[axis]) {
          chart.options.scales[axis].ticks = { ...(chart.options.scales[axis].ticks||{}), color: tickColor };
          chart.options.scales[axis].grid = { ...(chart.options.scales[axis].grid||{}), color: gridColor };
          if (chart.options.scales[axis].title) {
            chart.options.scales[axis].title.color = tickColor;
          }
        }
      });
    }
    chart.update();
  });
}
 
// ==============================
// HISTORY
// ==============================
function addToHistory(text) {
  const time = new Date().toLocaleString();
  calculationHistory.unshift({ time, result: text });
  localStorage.setItem('calcHistory', JSON.stringify(calculationHistory.slice(0, 100)));
  renderHistoryList();
  renderHistoryBox();
}
 
function renderHistoryList() {
  const ul = document.getElementById('historyList');
  if (!ul) return;
  ul.innerHTML = '';
  calculationHistory.forEach(item => {
    const li = document.createElement('li');
    li.innerHTML = `<b>${item.time}</b> — ${item.result}`;
    ul.appendChild(li);
  });
}
 
function renderHistoryBox() {
  const box = document.getElementById('historyBox');
  if (!box) return;
  if (calculationHistory.length === 0) {
    box.innerHTML = 'No calculations yet.';
    return;
  }
  box.innerHTML = calculationHistory.slice(0, 10).map(item =>
    `<p><b>${item.time}</b><br>${item.result}</p><hr>`
  ).join('');
}
 
function clearHistory() {
  calculationHistory = [];
  localStorage.removeItem('calcHistory');
  renderHistoryList();
  renderHistoryBox();
  if (myChart) {
    myChart.data.labels = [];
    myChart.data.datasets[0].data = [];
    myChart.update();
  }
}
 
function exportCSV() {
  if (!calculationHistory.length) { alert('No data to export'); return; }
  let csv = 'Time,Calculation\n';
  calculationHistory.forEach(item => { csv += `"${item.time}","${item.result}"\n`; });
  const blob = new Blob([csv], { type: 'text/csv' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'engineering_calculations.csv';
  link.click();
}
 
function exportPDF() {
  if (!calculationHistory.length) { alert('No data to export'); return; }
  const win = window.open('', '', 'width=800,height=600');
  win.document.write('<h1>Engineering Calculation Report</h1><hr>');
  calculationHistory.forEach(item => {
    win.document.write(`<p><b>${item.time}</b> — ${item.result}</p>`);
  });
  win.document.write('<hr><p>Generated by Mechanical Engineering Toolkit</p>');
  win.print();
}
 
function downloadReport() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text('Mechanical Engineering Report', 20, 20);
  doc.setFontSize(12);
  let y = 35;
  calculationHistory.forEach(item => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`${item.time} — ${item.result}`, 20, y);
    y += 10;
  });
  doc.save('Engineering_Report.pdf');
}
 
// ==============================
// CHART UPDATE
// ==============================
function updateChart(label, value) {
  if (!myChart) return;
  myChart.data.labels.push(label);
  myChart.data.datasets[0].data.push(value);
  myChart.update();
}
 
// ==============================
// INIT CHARTS
// ==============================
function chartDefaults() {
  const dark = !document.body.classList.contains('light');
  return {
    tickColor: dark ? '#e5e7eb' : '#0f172a',
    gridColor: dark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };
}
 
function initMainChart() {
  const el = document.getElementById('myChart');
  if (!el) return;
  const { tickColor, gridColor } = chartDefaults();
  myChart = new Chart(el.getContext('2d'), {
    type: 'bar',
    data: {
      labels: [],
      datasets: [{
        label: 'Engineering Values',
        data: [],
        backgroundColor: ['#2563eb','#16a34a','#dc2626','#f59e0b','#7c3aed','#06b6d4','#ec4899'],
        borderRadius: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: tickColor } } },
      scales: {
        x: { ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { beginAtZero: true, ticks: { color: tickColor }, grid: { color: gridColor } }
      }
    }
  });
}
 
function initBeamChart() {
  const el = document.getElementById('beamChart');
  if (!el) return;
  const { tickColor, gridColor } = chartDefaults();
  beamChartInstance = new Chart(el.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Beam Deflection Profile',
        data: [],
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.15)',
        tension: 0.4,
        fill: true,
        pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: tickColor } } },
      scales: {
        x: { ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { ticks: { color: tickColor }, grid: { color: gridColor } }
      }
    }
  });
}
 
function initStressStrainChart() {
  const el = document.getElementById('stressStrainChart');
  if (!el) return;
  const { tickColor, gridColor } = chartDefaults();
  stressStrainChartInstance = new Chart(el.getContext('2d'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Custom Stress-Strain',
        data: [],
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,0.2)',
        showLine: true,
        tension: 0.3,
        pointRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: tickColor } } },
      scales: {
        x: { title: { display: true, text: 'Strain', color: tickColor }, ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { title: { display: true, text: 'Stress (MPa)', color: tickColor }, ticks: { color: tickColor }, grid: { color: gridColor } }
      }
    }
  });
}
 
// ==============================
// STRESS-STRAIN TOOLS
// ==============================
function generateStressStrainCurve() {
  const el = document.getElementById('stressChart');
  if (!el) return;
  const { tickColor, gridColor } = chartDefaults();
 
  if (stressChartInstance) stressChartInstance.destroy();
 
  const strain = [0, 0.005, 0.01, 0.015, 0.02, 0.03, 0.04, 0.05, 0.06, 0.07];
  const stress = [0, 50, 100, 200, 280, 320, 310, 290, 250, 180];
 
  stressChartInstance = new Chart(el.getContext('2d'), {
    type: 'line',
    data: {
      labels: strain,
      datasets: [{
        label: 'Stress-Strain Curve (Steel)',
        data: stress,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37,99,235,0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 6,
        pointBackgroundColor: ['#22c55e','#22c55e','#22c55e','#f59e0b','#ef4444','#dc2626','#9333ea','#9333ea','#9333ea','#7c3aed']
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: { legend: { labels: { color: tickColor } } },
      scales: {
        x: { title: { display: true, text: 'Strain', color: tickColor }, ticks: { color: tickColor }, grid: { color: gridColor } },
        y: { title: { display: true, text: 'Stress (MPa)', color: tickColor }, ticks: { color: tickColor }, grid: { color: gridColor } }
      }
    }
  });
}
 
function addStressStrainPoint() {
  const stress = parseFloat(document.getElementById('stressInput').value);
  const strain = parseFloat(document.getElementById('strainInput').value);
  if (isNaN(stress) || isNaN(strain)) { alert('Enter valid values'); return; }
  customStrainData.push({ x: strain, y: stress });
  if (stressStrainChartInstance) {
    stressStrainChartInstance.data.datasets[0].data = customStrainData;
    stressStrainChartInstance.update();
  }
  document.getElementById('stressInput').value = '';
  document.getElementById('strainInput').value = '';
}
 
function downloadStressGraph() {
  const id = stressChartInstance ? 'stressChart' : 'stressStrainChart';
  const link = document.createElement('a');
  link.download = 'StressStrainCurve.png';
  link.href = document.getElementById(id).toDataURL();
  link.click();
}
 
function downloadCustomGraph() {
  const link = document.createElement('a');
  link.download = 'CustomStressStrain.png';
  link.href = document.getElementById('stressStrainChart').toDataURL();
  link.click();
}
 
function downloadChart() {
  const link = document.createElement('a');
  link.download = 'EngineeringChart.png';
  link.href = document.getElementById('myChart').toDataURL();
  link.click();
}
 
// ==============================
// CALCULATORS
// ==============================
 
function calculateStress() {
  const force = parseFloat(document.getElementById('stressForce').value);
  const area  = parseFloat(document.getElementById('stressArea').value);
  if (isNaN(force) || isNaN(area) || area === 0) { alert('Enter valid values'); return; }
  const stress = force / area;
  document.getElementById('stressResult').innerHTML = `Stress = ${stress.toFixed(4)} MPa`;
  addToHistory(`Stress = ${stress.toFixed(4)} MPa`);
  updateChart('Stress', stress);
}
 
function calculateTorque() {
  const force  = parseFloat(document.getElementById('torqueForce').value);
  const radius = parseFloat(document.getElementById('torqueRadius').value);
  if (isNaN(force) || isNaN(radius)) { alert('Enter valid values'); return; }
  const torque = force * radius;
  document.getElementById('torqueResult').innerHTML = `Torque = ${torque.toFixed(2)} Nm`;
  addToHistory(`Torque = ${torque.toFixed(2)} Nm`);
  updateChart('Torque', torque);
}
 
function calculateRPM() {
  const v = parseFloat(document.getElementById('cuttingSpeed').value);
  const d = parseFloat(document.getElementById('toolDiameter').value);
  if (isNaN(v) || isNaN(d) || d === 0) { alert('Enter valid values'); return; }
  const rpm = (1000 * v) / (Math.PI * d);
  document.getElementById('rpmResult').innerHTML = `RPM = ${rpm.toFixed(2)}`;
  addToHistory(`RPM = ${rpm.toFixed(2)}`);
  updateChart('RPM', rpm);
}
 
function calculateHeat() {
  const m = parseFloat(document.getElementById('heatMass').value);
  const c = parseFloat(document.getElementById('specificHeat').value);
  const t = parseFloat(document.getElementById('tempChange').value);
  if (isNaN(m) || isNaN(c) || isNaN(t)) { alert('Enter valid values'); return; }
  const q = m * c * t;
  document.getElementById('heatResult').innerHTML = `Heat Transfer Q = ${q.toFixed(2)} J`;
  addToHistory(`Heat Q = ${q.toFixed(2)} J`);
  updateChart('Heat', q);
}
 
function calculatePressure() {
  const force = parseFloat(document.getElementById('pressureForce').value);
  const area  = parseFloat(document.getElementById('pressureArea').value);
  if (isNaN(force) || isNaN(area) || area === 0) { alert('Enter valid values'); return; }
  const pressure = (force / area) / 1000;
  document.getElementById('pressureResult').innerHTML = `Pressure = ${pressure.toFixed(4)} kPa`;
  addToHistory(`Pressure = ${pressure.toFixed(4)} kPa`);
  updateChart('Pressure', pressure);
}
 
function calculateVelocity() {
  const d = parseFloat(document.getElementById('velDistance').value);
  const t = parseFloat(document.getElementById('velTime').value);
  if (isNaN(d) || isNaN(t) || t === 0) { alert('Enter valid values'); return; }
  const v = d / t;
  document.getElementById('velocityResult').innerHTML = `Velocity = ${v.toFixed(4)} m/s`;
  addToHistory(`Velocity = ${v.toFixed(4)} m/s`);
  updateChart('Velocity', v);
}
 
function calculatePower() {
  const T     = parseFloat(document.getElementById('powerTorque').value);
  const omega = parseFloat(document.getElementById('powerOmega').value);
  if (isNaN(T) || isNaN(omega)) { alert('Enter valid values'); return; }
  const power = T * omega;
  document.getElementById('powerResult').innerHTML = `Power = ${power.toFixed(2)} W`;
  addToHistory(`Power = ${power.toFixed(2)} W`);
  updateChart('Power', power);
}
 
function calculateDensity() {
  const m = parseFloat(document.getElementById('densityMass').value);
  const v = parseFloat(document.getElementById('densityVolume').value);
  if (isNaN(m) || isNaN(v) || v === 0) { alert('Enter valid values'); return; }
  const density = m / v;
  document.getElementById('densityResult').innerHTML = `Density = ${density.toFixed(4)} kg/m³`;
  addToHistory(`Density = ${density.toFixed(4)} kg/m³`);
  updateChart('Density', density);
}
 
function calculateEfficiency() {
  const out = parseFloat(document.getElementById('outputPower').value);
  const inp = parseFloat(document.getElementById('inputPower').value);
  if (isNaN(out) || isNaN(inp) || inp === 0) { alert('Enter valid values'); return; }
  const eff = (out / inp) * 100;
  document.getElementById('efficiencyResult').innerHTML = `Efficiency = ${eff.toFixed(2)} %`;
  addToHistory(`Efficiency = ${eff.toFixed(2)} %`);
  updateChart('Efficiency', eff);
}
 
function calculateSpring() {
  const k = parseFloat(document.getElementById('springK').value);
  const x = parseFloat(document.getElementById('springX').value);
  if (isNaN(k) || isNaN(x)) { alert('Enter valid values'); return; }
  const force = k * x;
  document.getElementById('springResult').innerHTML = `Spring Force = ${force.toFixed(2)} N`;
  addToHistory(`Spring Force = ${force.toFixed(2)} N`);
  updateChart('Spring', force);
}
 
function calculateBeamDeflection() {
  const type   = document.getElementById('beamType').value;
  const W      = parseFloat(document.getElementById('beamLoad').value);
  const L      = parseFloat(document.getElementById('beamLength').value);
  const E      = parseFloat(document.getElementById('youngModulus').value);
  const I      = parseFloat(document.getElementById('momentInertia').value);
  if (isNaN(W) || isNaN(L) || isNaN(E) || isNaN(I) || E === 0 || I === 0) {
    alert('Enter valid values'); return;
  }
  const delta = type === 'cantilever'
    ? (W * Math.pow(L, 3)) / (3 * E * I)
    : (W * Math.pow(L, 3)) / (48 * E * I);
  document.getElementById('beamResult').innerHTML =
    `Maximum Deflection = ${delta.toExponential(3)} m`;
  addToHistory(`Beam Deflection (${type}) = ${delta.toExponential(3)} m`);
  updateBeamGraph(delta);
}
 
function updateBeamGraph(delta) {
  if (!beamChartInstance) return;
  beamChartInstance.data.labels = ['0%','25%','50%','75%','100%'];
  beamChartInstance.data.datasets[0].data = [
    0, delta * 0.3, delta * 0.7, delta * 0.9, delta
  ];
  beamChartInstance.update();
}
 
// ==============================
// UNIT CONVERTERS
// ==============================
 
function convertMMtoM() {
  const mm = parseFloat(document.getElementById('mmInput').value);
  if (isNaN(mm)) { alert('Enter valid value'); return; }
  document.getElementById('mmResult').innerHTML = `${(mm / 1000).toFixed(6)} m`;
}
 
function convertNtoKN() {
  const n = parseFloat(document.getElementById('nInput').value);
  if (isNaN(n)) { alert('Enter valid value'); return; }
  document.getElementById('nResult').innerHTML = `${(n / 1000).toFixed(6)} kN`;
}
 
function convertPaToMPa() {
  const pa = parseFloat(document.getElementById('paInput').value);
  if (isNaN(pa)) { alert('Enter valid value'); return; }
  document.getElementById('paResult').innerHTML = `${(pa / 1e6).toFixed(8)} MPa`;
}
 
function convertRPM() {
  const rpm = parseFloat(document.getElementById('rpmConvInput').value);
  if (isNaN(rpm)) { alert('Enter valid value'); return; }
  document.getElementById('rpmConvResult').innerHTML = `${(rpm * 0.10472).toFixed(4)} rad/s`;
}
 
function convertTemp() {
  const c = parseFloat(document.getElementById('tempInput').value);
  if (isNaN(c)) { alert('Enter valid value'); return; }
  document.getElementById('tempResult').innerHTML = `${(c + 273.15).toFixed(2)} K`;
}
 
function convertUnits() {
  const value = parseFloat(document.getElementById('unitValue').value);
  const type  = document.getElementById('unitType').value;
  if (isNaN(value)) { alert('Enter valid value'); return; }
  let result = '';
  switch (type) {
    case 'mmToM':   result = (value / 1000) + ' m'; break;
    case 'mToMm':   result = (value * 1000) + ' mm'; break;
    case 'nToKn':   result = (value / 1000) + ' kN'; break;
    case 'knToN':   result = (value * 1000) + ' N'; break;
    case 'paToMpa': result = (value / 1e6) + ' MPa'; break;
    case 'mpaToPa': result = (value * 1e6) + ' Pa'; break;
    case 'cToK':    result = (value + 273.15).toFixed(2) + ' K'; break;
    case 'kToC':    result = (value - 273.15).toFixed(2) + ' °C'; break;
  }
  document.getElementById('unitResult').innerHTML = `Converted: ${result}`;
  addToHistory(`Unit Conversion → ${result}`);
}
 
// ==============================
// SEARCH
// ==============================
 
function searchCalculators() {
  const q = document.getElementById('searchInput').value.toLowerCase().trim();
  document.querySelectorAll('#calculators .card').forEach(card => {
    card.style.display = (!q || card.innerText.toLowerCase().includes(q)) ? '' : 'none';
  });
}
 
function searchMaterial() {
  const q = document.getElementById('materialSearch').value.toLowerCase();
  document.querySelectorAll('#materialTable tbody tr').forEach(row => {
    const name = row.cells[0]?.textContent.toLowerCase() || '';
    row.style.display = name.includes(q) ? '' : 'none';
  });
}
 
function searchFormulas() {
  const q = document.getElementById('formulaSearch').value.toLowerCase();
  document.querySelectorAll('.formula-category').forEach(cat => {
    cat.style.display = cat.innerText.toLowerCase().includes(q) ? '' : 'none';
  });
}
 
// ==============================
// ACCORDION
// ==============================
function setupAccordions() {
  document.querySelectorAll('.accordion').forEach(btn => {
    btn.addEventListener('click', function () {
      const panel = this.nextElementSibling;
      if (!panel) return;
      panel.classList.toggle('open');
    });
  });
}