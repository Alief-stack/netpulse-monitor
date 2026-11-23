// Konfigurasi Tailwind Dark Mode Class
tailwind.config = {
  darkMode: 'class'
};

// ==========================================
// 1. DATA SIMULASI PERANGKAT & TIKET
// ==========================================
const devicesData = [
  { id: 1, name: 'RTR-CORE-01', type: 'MikroTik CCR2004', ip: '192.168.1.1', location: 'Rak Server Utama A1', status: 'online', latency: 4, cpu: 28 },
  { id: 2, name: 'FW-GATEWAY-01', type: 'FortiGate 60F', ip: '103.145.22.1', location: 'Rak Server Utama A1', status: 'online', latency: 6, cpu: 34 },
  { id: 3, name: 'SW-DIST-LT1', type: 'Cisco Catalyst 2960', ip: '192.168.10.2', location: 'Panel Lantai 1', status: 'online', latency: 9, cpu: 19 },
  { id: 4, name: 'SW-DIST-LT2', type: 'Cisco Catalyst 2960', ip: '192.168.20.2', location: 'Panel Lantai 2', status: 'warning', latency: 68, cpu: 84 },
  { id: 5, name: 'SRV-PROXMOX-01', type: 'Dell PowerEdge R740', ip: '192.168.5.10', location: 'Rak Server Utama B2', status: 'online', latency: 3, cpu: 46 },
  { id: 6, name: 'AP-LOBBY-01', type: 'UniFi U6 Pro', ip: '192.168.30.11', location: 'Plafon Lobby Utama', status: 'online', latency: 12, cpu: 15 },
  { id: 7, name: 'AP-GUDANG-02', type: 'UniFi U6 Lite', ip: '192.168.30.14', location: 'Area Gudang Timur', status: 'offline', latency: 0, cpu: 0 },
  { id: 8, name: 'NAS-BACKUP-01', type: 'Synology RS1221+', ip: '192.168.5.25', location: 'Rak Server Utama B2', status: 'online', latency: 5, cpu: 22 }
];

let ticketsData = [
  {
    id: 'TKT-104',
    title: 'AP-GUDANG-02 Tidak Merespons Ping',
    device: 'AP-GUDANG-02',
    priority: 'Kritis',
    status: 'Diproses',
    time: '14 menit lalu',
    desc: 'Indikator PoE pada port 8 switch distribusi padam. Teknisi sedang mengecek kabel UTP jalur timur.'
  },
  {
    id: 'TKT-103',
    title: 'Lonjakan CPU & Latensi Switch Lantai 2',
    device: 'SW-DIST-LT2',
    priority: 'Sedang',
    status: 'Menunggu',
    time: '42 menit lalu',
    desc: 'Utilisasi CPU mencapai 84% akibat broadcast trafik dari VLAN Tamu.'
  },
  {
    id: 'TKT-102',
    title: 'Pembaruan Firmware Router Backup',
    device: 'RTR-CORE-01',
    priority: 'Rendah',
    status: 'Selesai',
    time: '3 jam lalu',
    desc: 'Upgrade RouterOS ke versi stabil terbaru selesai tanpa gangguan sesi BGP.'
  }
];

let trafficChartInstance = null;
let pingInterval = null;

// ==========================================
// 2. INISIALISASI HALAMAN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  startClock();
  renderDevices(devicesData);
  renderTickets();
  initTrafficChart();
  calculateSubnet();
  startLiveSimulation();
});

// Jam Real-time
function startClock() {
  const clockEl = document.getElementById('live-clock');
  const update = () => {
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString('id-ID', { hour12: false }) + ' WIB';
  };
  update();
  setInterval(update, 1000);
}

// ==========================================
// 3. NAVIGASI TAB & TEMA WARNA
// ==========================================
function switchTab(tabName) {
  document.querySelectorAll('.nav-item').forEach(btn => {
    btn.classList.remove('active');
    btn.classList.add('text-slate-600', 'dark:text-slate-400');
  });

  const activeNav = document.getElementById(`nav-${tabName}`);
  if (activeNav) {
    activeNav.classList.add('active');
    activeNav.classList.remove('text-slate-600', 'dark:text-slate-400');
  }

  const sectionMap = {
    overview: 'section-kpi',
    devices: 'section-devices',
    tickets: 'section-tickets',
    topology: 'section-topology'
  };

  const target = document.getElementById(sectionMap[tabName]);
  if (target) {
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function toggleTheme() {
  const html = document.documentElement;
  const icon = document.getElementById('theme-icon');
  html.classList.toggle('dark');

  const isDark = html.classList.contains('dark');
  icon.setAttribute('data-lucide', isDark ? 'sun' : 'moon');
  lucide.createIcons();

  // Perbarui warna grid grafik agar tetap nyaman di mata
  if (trafficChartInstance) {
    const gridColor = isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.15)';
    const tickColor = isDark ? '#94A3B8' : '#64748B';
    trafficChartInstance.options.scales.x.grid.color = gridColor;
    trafficChartInstance.options.scales.y.grid.color = gridColor;
    trafficChartInstance.options.scales.x.ticks.color = tickColor;
    trafficChartInstance.options.scales.y.ticks.color = tickColor;
    trafficChartInstance.update();
  }
}

// ==========================================
// 4. GRAFIK TRAFIK BANDWIDTH (CHART.JS)
// ==========================================
function initTrafficChart() {
  const ctx = document.getElementById('trafficChart').getContext('2d');
  const labels = ['21:00', '21:05', '21:10', '21:15', '21:20', '21:25', '21:30'];

  trafficChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Download (Mbps)',
          data: [410, 445, 430, 490, 475, 510, 480],
          borderColor: '#6366F1',
          backgroundColor: 'rgba(99, 102, 241, 0.12)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3
        },
        {
          label: 'Upload (Mbps)',
          data: [140, 155, 148, 170, 160, 182, 162],
          borderColor: '#10B981',
          backgroundColor: 'rgba(16, 185, 129, 0.08)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
          pointRadius: 3
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: 'index', intersect: false },
      plugins: {
        legend: {
          position: 'top',
          align: 'end',
          labels: { usePointStyle: true, boxWidth: 6, font: { size: 11 } }
        }
      },
      scales: {
        x: {
          grid: { color: 'rgba(148, 163, 184, 0.15)' },
          ticks: { font: { size: 11 }, color: '#64748B' }
        },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(148, 163, 184, 0.15)' },
          ticks: { font: { size: 11 }, color: '#64748B' }
        }
      }
    }
  });
}

function updateChartRange(range, btn) {
  document.querySelectorAll('.range-btn').forEach(b => {
    b.classList.remove('active');
    b.classList.add('text-slate-600', 'dark:text-slate-400');
  });
  btn.classList.add('active');
  btn.classList.remove('text-slate-600', 'dark:text-slate-400');

  const presets = {
    '1h': {
      labels: ['21:00', '21:05', '21:10', '21:15', '21:20', '21:25', '21:30'],
      dl: [410, 445, 430, 490, 475, 510, 480],
      ul: [140, 155, 148, 170, 160, 182, 162]
    },
    '24h': {
      labels: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '21:30'],
      dl: [180, 150, 520, 680, 640, 510, 480],
      ul: [65, 50, 190, 240, 215, 175, 162]
    },
    '7d': {
      labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
      dl: [590, 620, 610, 645, 670, 390, 350],
      ul: [210, 225, 218, 230, 245, 130, 115]
    }
  };

  trafficChartInstance.data.labels = presets[range].labels;
  trafficChartInstance.data.datasets[0].data = presets[range].dl;
  trafficChartInstance.data.datasets[1].data = presets[range].ul;
  trafficChartInstance.update();
}

// Simulasi Pembaruan Otomatis setiap 4 detik
function startLiveSimulation() {
  setInterval(() => {
    const newDl = Math.floor(450 + Math.random() * 80);
    const newUl = Math.floor(145 + Math.random() * 35);
    const newLat = Math.floor(11 + Math.random() * 7);

    document.getElementById('kpi-latency').textContent = `${newLat} ms`;
    document.getElementById('kpi-bandwidth').textContent = `${newDl + newUl} Mbps`;

    const dsDl = trafficChartInstance.data.datasets[0].data;
    const dsUl = trafficChartInstance.data.datasets[1].data;
    dsDl.shift();
    dsDl.push(newDl);
    dsUl.shift();
    dsUl.push(newUl);
    trafficChartInstance.update('none');
  }, 4000);
}

// ==========================================
// 5. TABEL PERANGKAT & FILTER
// ==========================================
function renderDevices(list) {
  const tbody = document.getElementById('device-table-body');
  tbody.innerHTML = '';

  list.forEach(dev => {
    const statusBadge = {
      online: `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"><span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Online</span>`,
      warning: `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-amber-500/10 text-amber-600 dark:text-amber-400"><span class="w-1.5 h-1.5 rounded-full bg-amber-500"></span>Warning</span>`,
      offline: `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400"><span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span>Offline</span>`
    }[dev.status];

    const latencyText = dev.status === 'offline' ? '<span class="text-rose-500 font-mono">Timeout</span>' : `<span class="font-mono">${dev.latency} ms</span>`;
    const cpuColor = dev.cpu > 80 ? 'bg-amber-500' : 'bg-indigo-500';

    const row = `
      <tr class="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
        <td class="py-3.5 px-6">
          <div class="font-semibold text-slate-800 dark:text-slate-100">${dev.name}</div>
          <div class="text-[11px] text-slate-400">${dev.type}</div>
        </td>
        <td class="py-3.5 px-4 font-mono text-slate-600 dark:text-slate-300">${dev.ip}</td>
        <td class="py-3.5 px-4 text-slate-500 dark:text-slate-400">${dev.location}</td>
        <td class="py-3.5 px-4">${statusBadge}</td>
        <td class="py-3.5 px-4">${latencyText}</td>
        <td class="py-3.5 px-4">
          <div class="flex items-center gap-2">
            <div class="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div class="h-full ${cpuColor}" style="width: ${dev.cpu}%"></div>
            </div>
            <span class="text-[11px] font-mono text-slate-500">${dev.cpu}%</span>
          </div>
        </td>
        <td class="py-3.5 px-6 text-right">
          <button onclick="runPingTest('${dev.name}', '${dev.ip}', '${dev.status}')" class="px-3 py-1.5 rounded-lg text-[11px] font-medium border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
            Tes Ping
          </button>
        </td>
      </tr>
    `;
    tbody.insertAdjacentHTML('beforeend', row);
  });
}

function filterDevices() {
  const query = document.getElementById('device-search').value.toLowerCase();
  const status = document.getElementById('device-status-filter').value;

  const filtered = devicesData.filter(d => {
    const matchQuery = d.name.toLowerCase().includes(query) || d.ip.includes(query) || d.location.toLowerCase().includes(query);
    const matchStatus = status === 'all' || d.status === status;
    return matchQuery && matchStatus;
  });

  renderDevices(filtered);
}

// ==========================================
// 6. TERMINAL DIAGNOSTIK PING
// ==========================================
function runPingTest(name, ip, status) {
  const modal = document.getElementById('ping-modal');
  const terminal = document.getElementById('ping-terminal');
  document.getElementById('ping-modal-title').textContent = `Ping ICMP — ${name} (${ip})`;

  modal.classList.remove('hidden');
  modal.classList.add('flex');
  terminal.innerHTML = `<p class="text-slate-400">$ ping -c 5 ${ip}</p><p class="text-slate-400">PING ${ip} (${ip}): 56 data bytes</p>`;

  let seq = 1;
  clearInterval(pingInterval);

  pingInterval = setInterval(() => {
    if (seq > 5) {
      clearInterval(pingInterval);
      const loss = status === 'offline' ? '100.0%' : '0.0%';
      terminal.insertAdjacentHTML('beforeend', `<p class="text-indigo-400 mt-2">--- ${ip} ping statistics ---</p><p class="text-slate-300">5 packets transmitted, ${loss} packet loss</p>`);
      terminal.scrollTop = terminal.scrollHeight;
      return;
    }

    if (status === 'offline') {
      terminal.insertAdjacentHTML('beforeend', `<p class="text-rose-400">Request timeout for icmp_seq ${seq}</p>`);
    } else {
      const ms = status === 'warning' ? (58 + Math.random() * 25).toFixed(1) : (3 + Math.random() * 9).toFixed(1);
      terminal.insertAdjacentHTML('beforeend', `<p>64 bytes from ${ip}: icmp_seq=${seq} ttl=64 time=${ms} ms</p>`);
    }

    terminal.scrollTop = terminal.scrollHeight;
    seq++;
  }, 600);
}

function closePingModal() {
  clearInterval(pingInterval);
  const modal = document.getElementById('ping-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

// ==========================================
// 7. MANAJEMEN TIKET GANGGUAN
// ==========================================
function renderTickets() {
  const container = document.getElementById('ticket-list');
  container.innerHTML = '';

  const openCount = ticketsData.filter(t => t.status !== 'Selesai').length;
  document.getElementById('badge-ticket-count').textContent = openCount;

  ticketsData.forEach((t, idx) => {
    const priorityBadge = {
      Kritis: 'bg-rose-500/10 text-rose-600 dark:text-rose-400',
      Sedang: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      Rendah: 'bg-sky-500/10 text-sky-600 dark:text-sky-400'
    }[t.priority];

    const card = `
      <div class="card-surface p-5 rounded-2xl flex flex-col justify-between space-y-4">
        <div>
          <div class="flex items-center justify-between gap-2 mb-2.5">
            <span class="text-[11px] font-mono text-slate-400">${t.id} • ${t.device}</span>
            <span class="px-2.5 py-0.5 rounded-full text-[11px] font-medium ${priorityBadge}">${t.priority}</span>
          </div>
          <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-100 mb-1.5">${t.title}</h4>
          <p class="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">${t.desc}</p>
        </div>

        <div class="pt-3 border-t border-slate-200/70 dark:border-slate-800 flex items-center justify-between">
          <span class="text-[11px] text-slate-400">${t.time}</span>
          <select onchange="changeTicketStatus(${idx}, this.value)" class="text-[11px] font-medium px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
            <option value="Menunggu" ${t.status === 'Menunggu' ? 'selected' : ''}>Menunggu</option>
            <option value="Diproses" ${t.status === 'Diproses' ? 'selected' : ''}>Diproses</option>
            <option value="Selesai" ${t.status === 'Selesai' ? 'selected' : ''}>Selesai</option>
          </select>
        </div>
      </div>
    `;
    container.insertAdjacentHTML('beforeend', card);
  });
}

function openTicketModal() {
  const modal = document.getElementById('ticket-modal');
  modal.classList.remove('hidden');
  modal.classList.add('flex');
}

function closeTicketModal() {
  const modal = document.getElementById('ticket-modal');
  modal.classList.add('hidden');
  modal.classList.remove('flex');
}

function submitNewTicket(e) {
  e.preventDefault();
  const title = document.getElementById('ticket-title').value;
  const device = document.getElementById('ticket-device').value;
  const priority = document.getElementById('ticket-priority').value;
  const desc = document.getElementById('ticket-desc').value;

  ticketsData.unshift({
    id: `TKT-${100 + ticketsData.length + 2}`,
    title,
    device,
    priority,
    status: 'Menunggu',
    time: 'Baru saja',
    desc
  });

  renderTickets();
  closeTicketModal();
  e.target.reset();
  showToast('Tiket gangguan baru berhasil ditambahkan');
}

function changeTicketStatus(index, newStatus) {
  ticketsData[index].status = newStatus;
  renderTickets();
  showToast(`Status ${ticketsData[index].id} diubah menjadi ${newStatus}`);
}

// ==========================================
// 8. KALKULATOR SUBNET IPV4
// ==========================================
function calculateSubnet() {
  const ip = document.getElementById('subnet-ip').value.trim();
  const cidr = parseInt(document.getElementById('subnet-cidr').value, 10);

  const maskMap = {
    24: { mask: '255.255.255.0', hosts: 254, end: 254 },
    25: { mask: '255.255.255.128', hosts: 126, end: 126 },
    26: { mask: '255.255.255.192', hosts: 62, end: 62 },
    27: { mask: '255.255.255.224', hosts: 30, end: 30 },
    28: { mask: '255.255.255.240', hosts: 14, end: 14 },
    29: { mask: '255.255.255.248', hosts: 6, end: 6 },
    30: { mask: '255.255.255.252', hosts: 2, end: 2 }
  };

  const parts = ip.split('.');
  const prefix = parts.length === 4 ? `${parts[0]}.${parts[1]}.${parts[2]}` : '192.168.10';
  const info = maskMap[cidr];

  document.getElementById('res-mask').textContent = info.mask;
  document.getElementById('res-hosts').textContent = `${info.hosts} Host`;
  document.getElementById('res-range').textContent = `${prefix}.1 — .${info.end}`;
}

// Notifikasi Toast
function showToast(msg) {
  const toast = document.getElementById('toast');
  document.getElementById('toast-message').textContent = msg;
  toast.classList.remove('translate-y-20', 'opacity-0');
  setTimeout(() => {
    toast.classList.add('translate-y-20', 'opacity-0');
  }, 3000);
}