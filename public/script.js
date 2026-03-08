// script.js - Lógica JavaScript para o Sistema de Logística

// Configurações globais
const API_BASE = '';

// Funções utilitárias
function showMessage(message, type = 'success') {
  const messageEl = document.getElementById('message');
  if (messageEl) {
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    messageEl.style.display = 'block';

    setTimeout(() => {
      messageEl.style.display = 'none';
    }, 5000);
  }
}

function formatDateTime(dateString) {
  if (!dateString) return 'Data inválida';

  try {
    console.log('Data recebida:', dateString, typeof dateString);

    // Cria objeto Date diretamente da string ISO
    const date = new Date(dateString);

    // Verifica se a data é válida
    if (isNaN(date.getTime())) {
      console.error('Data inválida após parse:', dateString);
      return 'Data inválida';
    }

    // Formata para português brasileiro
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error, dateString);
    return 'Erro na data';
  }
}

function getStatusClass(status) {
  switch (status) {
    case 'separando': return 'status-separando';
    case 'separado': return 'status-separado';
    case 'faltando': return 'status-faltando';
    default: return 'status-separando';
  }
}

function getStatusText(status) {
  switch (status) {
    case 'separando': return 'Em Separação';
    case 'separado': return 'Separado';
    case 'faltando': return 'Faltando Produto';
    default: return status;
  }
}

// ===== FUNÇÕES PARA INDEX.HTML (VENDEDOR) =====
function initVendedorPage() {
  const form = document.getElementById('pedidoForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const data = {
      cliente: formData.get('cliente').trim(),
      vendedor: formData.get('vendedor').trim(),
      observacao: formData.get('observacao').trim()
    };

    if (!data.cliente || !data.vendedor) {
      showMessage('Cliente e vendedor são obrigatórios!', 'error');
      return;
    }

    try {
      const response = await fetch('/api/pedidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (response.ok) {
        showMessage('Pedido enviado para separação com sucesso!');
        form.reset();
      } else {
        showMessage(result.error || 'Erro ao enviar pedido', 'error');
      }
    } catch (error) {
      console.error('Erro:', error);
      showMessage('Erro de conexão. Tente novamente.', 'error');
    }
  });
}

// ===== FUNÇÕES PARA LOGISTICA.HTML (SEPARAÇÃO) =====
async function loadPedidos() {
  try {
    const response = await fetch('/api/pedidos');
    const pedidos = await response.json();

    const tbody = document.getElementById('pedidosBody');
    if (!tbody) return;

    if (pedidos.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Nenhum pedido encontrado</td></tr>';
      return;
    }

    tbody.innerHTML = pedidos.map((pedido, index) => `
      <tr class="fade-in">
        <td>${index + 1}</td>
        <td>${pedido.cliente}</td>
        <td>${pedido.vendedor}</td>
        <td><span class="status-badge ${getStatusClass(pedido.status)}">${getStatusText(pedido.status)}</span></td>
        <td>${formatDateTime(pedido.dataHora)}</td>
        <td>
          <div style="display: flex; gap: 0.5rem; flex-wrap: wrap; align-items: center;">
            <button class="btn btn-warning" onclick="updateStatus(${pedido.id}, 'separando')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Em Separação</button>
            <button class="btn btn-success" onclick="updateStatus(${pedido.id}, 'separado')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Separado</button>
            <button class="btn btn-danger" onclick="updateStatus(${pedido.id}, 'faltando')" style="padding: 0.5rem 1rem; font-size: 0.8rem;">Faltando</button>
            ${document.getElementById('adminSection') && document.getElementById('adminSection').style.display !== 'none' ? `<button class="btn btn-remove" onclick="removePedido(${pedido.id})" style="padding: 0.5rem 1rem; font-size: 0.8rem;">🗑️ Remover</button>` : ''}
          </div>
        </td>
      </tr>
    `).join('');

  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    const tbody = document.getElementById('pedidosBody');
    if (tbody) {
      tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar pedidos</td></tr>';
    }
  }
}

async function loadEstatisticas() {
  try {
    const response = await fetch('/api/estatisticas');
    const stats = await response.json();

    document.getElementById('statSeparando').textContent = stats.separando;
    document.getElementById('statSeparados').textContent = stats.separados;
    document.getElementById('statFaltando').textContent = stats.faltando;
  } catch (error) {
    console.error('Erro ao carregar estatísticas:', error);
  }
}

async function updateStatus(pedidoId, newStatus) {
  try {
    const response = await fetch(`/api/pedidos/${pedidoId}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: newStatus })
    });

    const result = await response.json();

    if (response.ok) {
      showMessage(`Status atualizado para "${getStatusText(newStatus)}"`);
      loadPedidos();
      loadEstatisticas();
    } else {
      showMessage(result.error || 'Erro ao atualizar status', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showMessage('Erro de conexão. Tente novamente.', 'error');
  }
}

function initLogisticaPage() {
  loadPedidos();
  loadEstatisticas();

  // Atualizar automaticamente a cada 5 segundos
  setInterval(() => {
    loadPedidos();
    loadEstatisticas();
  }, 5000);
}

// ===== FUNÇÕES PARA PAINEL.HTML (GERENTE/TV) =====
async function loadPainelPedidos() {
  try {
    const response = await fetch('/api/pedidos');
    const pedidos = await response.json();

    const container = document.getElementById('ordersContainer');
    if (!container) return;

    if (pedidos.length === 0) {
      container.innerHTML = '<div class="loading">Nenhum pedido encontrado</div>';
      return;
    }

    container.innerHTML = pedidos.map(pedido => `
      <div class="order-item ${pedido.status} fade-in">
        <div class="order-info">
          <h3>${pedido.cliente}</h3>
          <p><strong>Vendedor:</strong> ${pedido.vendedor}</p>
          <p><strong>Data:</strong> ${formatDateTime(pedido.dataHora)}</p>
          ${pedido.observacao ? `<p><strong>Obs:</strong> ${pedido.observacao}</p>` : ''}
        </div>
        <div class="order-status ${getStatusClass(pedido.status)}">
          ${getStatusText(pedido.status)}
        </div>
      </div>
    `).join('');

  } catch (error) {
    console.error('Erro ao carregar pedidos do painel:', error);
    const container = document.getElementById('ordersContainer');
    if (container) {
      container.innerHTML = '<div style="text-align: center; color: red; padding: 2rem;">Erro ao carregar pedidos</div>';
    }
  }
}

async function loadPainelEstatisticas() {
  try {
    const response = await fetch('/api/estatisticas');
    const stats = await response.json();

    document.getElementById('tvStatSeparando').textContent = stats.separando;
    document.getElementById('tvStatSeparados').textContent = stats.separados;
    document.getElementById('tvStatFaltando').textContent = stats.faltando;
  } catch (error) {
    console.error('Erro ao carregar estatísticas do painel:', error);
  }
}

function initPainelPage() {
  loadPainelPedidos();
  loadPainelEstatisticas();

  // Atualizar automaticamente a cada 5 segundos
  setInterval(() => {
    loadPainelPedidos();
    loadPainelEstatisticas();
  }, 5000);
}

// ===== FUNÇÕES ADMINISTRATIVAS =====
function showAdminLogin() {
  document.getElementById("passwordModal").style.display = "block";
  document.getElementById("adminPassword").focus();
}

function closeAdminModal() {
  document.getElementById("passwordModal").style.display = "none";
  document.getElementById("adminPassword").value = "";
}

function checkAdminPassword() {
  const password = document.getElementById("adminPassword").value;
  if (password === "gestao") {
    document.getElementById("adminSection").style.display = "block";
    document.getElementById("adminBtn").style.display = "none";
    closeAdminModal();
    showMessage("Acesso administrativo liberado!", "success");
  } else {
    showMessage("Senha incorreta!", "error");
    document.getElementById("adminPassword").value = "";
  }
}

async function clearAllPedidos() {
  if (!confirm("⚠️ ATENÇÃO: Esta ação irá remover TODOS os pedidos permanentemente!\n\nTem certeza que deseja continuar?")) {
    return;
  }

  if (!confirm("🚨 ÚLTIMA CHANCE: Todos os pedidos serão perdidos!\n\nDeseja realmente limpar tudo?")) {
    return;
  }

  try {
    const response = await fetch("/api/pedidos/clear-all", {
      method: "DELETE"
    });

    const result = await response.json();

    if (response.ok) {
      showMessage("Todos os pedidos foram removidos com sucesso!");
      loadPedidos();
      loadEstatisticas();
    } else {
      showMessage(result.error || "Erro ao limpar pedidos", "error");
    }
  } catch (error) {
    console.error("Erro:", error);
    showMessage("Erro de conexão. Tente novamente.", "error");
  }
}

async function removePedido(id) {
  if (!confirm("Tem certeza que deseja remover este pedido?")) {
    return;
  }

  try {
    const response = await fetch(`/api/pedidos/${id}`, {
      method: "DELETE"
    });

    const result = await response.json();

    if (response.ok) {
      showMessage("Pedido removido com sucesso!");
      loadPedidos();
      loadEstatisticas();
    } else {
      showMessage(result.error || "Erro ao remover pedido", "error");
    }
  } catch (error) {
    console.error("Erro:", error);
    showMessage("Erro de conexão. Tente novamente.", "error");
  }
}

// Fechar modal ao clicar fora
document.addEventListener("click", (e) => {
  const modal = document.getElementById("passwordModal");
  if (e.target === modal) {
    closeAdminModal();
  }
});

// Fechar modal com tecla ESC
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    closeAdminModal();
  }
});

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
  // Detectar qual página está sendo carregada
  const path = window.location.pathname;

  if (path === '/' || path === '/index.html') {
    initVendedorPage();
  } else if (path === '/logistica' || path === '/logistica.html') {
    initLogisticaPage();
  } else if (path === '/painel' || path === '/painel.html') {
    initPainelPage();
  }
});