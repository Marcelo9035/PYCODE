const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
const EXAMPLE_CODE = `import tkinter as tk

janela = tk.Tk()
janela.title("Meu primeiro app")
janela.geometry("480x300")
janela.configure(bg="#f3f6f3")

mensagem = tk.Label(
    janela,
    text="Seu aplicativo está pronto!",
    font=("Segoe UI", 16),
    bg="#f3f6f3",
    fg="#183d2b",
)
mensagem.pack(pady=88)

janela.mainloop()
`;

const els = {
  fileInput: $("#file-input"),
  dropZone: $("#drop-zone"),
  fileDetail: $("#file-detail"),
  fileName: $("#file-name"),
  fileMeta: $("#file-meta"),
  fileState: $("#file-state"),
  editorCard: $("#editor-card"),
  codeEditor: $("#code-editor"),
  showCodeToggle: $("#show-code-toggle"),
  previewCard: $("#code-preview"),
  previewEmpty: $("#preview-empty"),
  previewCode: $("#preview-code"),
  previewCodeText: $("#preview-code-text"),
  sourceStats: $("#source-stats"),
  lineNumbers: $("#line-numbers"),
  lineCount: $("#editor-line-count"),
  editorCharacters: $("#editor-characters"),
  editorFilename: $("#editor-filename"),
  dirtyMark: $("#dirty-mark"),
  appName: $("#app-name"),
  outputFolder: $("#output-folder"),
  nameHint: $("#name-hint"),
  modeDescription: $("#mode-description"),
  noConsole: $("#no-console"),
  buildButton: $("#build-button"),
  buildButtonLabel: $("#build-button-label"),
  logList: $("#log-list"),
  logEmpty: $("#log-empty"),
  progressBlock: $("#progress-block"),
  progressLabel: $("#progress-label"),
  progressValue: $("#progress-value"),
  progressFill: $("#progress-fill"),
  toastRegion: $("#toast-region"),
  viewMenu: $("#view-menu"),
  viewMenuTrigger: $("#view-menu-trigger"),
  advanced: $("#advanced-options"),
};

let sourceCode = "";
let selectedFileName = "";
let selectedFileSize = 0;
let buildMode = "onefile";
let buildRunning = false;
let buildSequence = 0;
let toastSequence = 0;
const logEntries = [];

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function showToast(message, type = "info") {
  const id = ++toastSequence;
  const toast = document.createElement("div");
  toast.className = `toast${type === "error" ? " error" : ""}`;
  toast.dataset.toastId = String(id);
  toast.setAttribute("role", type === "error" ? "alert" : "status");
  toast.textContent = message;
  els.toastRegion.append(toast);
  window.setTimeout(() => toast.remove(), 4200);
}

function timestamp() {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).format(new Date());
}

function addLog(message, type = "success", detail = "") {
  els.logEmpty.hidden = true;
  const entry = { time: timestamp(), message, type, detail };
  logEntries.push(entry);
  const row = document.createElement("div");
  row.className = "log-entry";
  row.innerHTML = `<span class="log-time">${escapeHtml(entry.time)}</span><span class="log-mark ${type === "error" ? "error" : type === "warning" ? "warning" : ""}"></span><span class="log-text"><strong>${escapeHtml(message)}</strong>${detail ? `<br>${escapeHtml(detail)}` : ""}</span>`;
  els.logList.append(row);
  els.logList.scrollTop = els.logList.scrollHeight;
}

function clearLog() {
  logEntries.length = 0;
  els.logList.querySelectorAll(".log-entry").forEach((entry) => entry.remove());
  els.logEmpty.hidden = false;
}

function formatLogText() {
  if (!logEntries.length) return "PyCode Builder — nenhum evento registrado nesta sessão.";
  return ["PyCode Builder — registro demonstrativo", "", ...logEntries.map((item) => `[${item.time}] ${item.type.toUpperCase()}  ${item.message}${item.detail ? ` — ${item.detail}` : ""}`)].join("\n");
}

function updateLineNumbers() {
  const lines = Math.max(1, els.codeEditor.value.split("\n").length);
  els.lineNumbers.textContent = Array.from({ length: lines }, (_, index) => index + 1).join("\n");
  els.lineCount.textContent = `${lines} ${lines === 1 ? "linha" : "linhas"}`;
  els.editorCharacters.textContent = `${els.codeEditor.value.length.toLocaleString("pt-BR")} caracteres`;
  els.lineNumbers.scrollTop = els.codeEditor.scrollTop;
}

function updateSourcePreview() {
  const hasCode = sourceCode.trim().length > 0;
  els.previewEmpty.hidden = hasCode;
  els.previewCode.hidden = !hasCode;
  if (hasCode) {
    const lines = sourceCode.replace(/\r\n?/g, "\n").split("\n");
    const displayed = lines.slice(0, 9).join("\n");
    els.previewCodeText.textContent = displayed.length > 1250 ? `${displayed.slice(0, 1250)}\n…` : displayed;
    els.sourceStats.textContent = `${lines.length} linhas · ${sourceCode.length.toLocaleString("pt-BR")} caracteres`;
  } else {
    els.sourceStats.textContent = "sem conteúdo";
  }
  els.editorFilename.textContent = selectedFileName || "sem_arquivo.py";
}

function updateEditorVisibility(focus = false) {
  const visible = els.showCodeToggle.checked;
  els.editorCard.hidden = !visible;
  els.previewCard.hidden = visible;
  els.viewMenuTrigger.setAttribute("aria-expanded", String(!els.viewMenu.hidden));
  if (visible) {
    els.codeEditor.value = sourceCode;
    updateLineNumbers();
    if (focus) els.codeEditor.focus();
  }
}

function updateFileStatus() {
  const loaded = Boolean(selectedFileName);
  els.fileDetail.hidden = !loaded;
  els.fileState.classList.toggle("loaded", loaded);
  els.fileState.innerHTML = loaded ? "<span></span> fonte selecionada" : "<span></span> aguardando arquivo";
  els.fileName.textContent = selectedFileName || "—";
  els.fileMeta.textContent = `${formatBytes(selectedFileSize)} · somente leitura`;
  updateSourcePreview();
}

function updateSourceCode(nextValue, markDirty = false) {
  sourceCode = nextValue;
  if (els.showCodeToggle.checked && els.codeEditor.value !== sourceCode) {
    els.codeEditor.value = sourceCode;
  }
  els.dirtyMark.hidden = !(markDirty && selectedFileName);
  updateLineNumbers();
  updateSourcePreview();
}

function setCodeEditorVisible(visible, focus = false) {
  els.showCodeToggle.checked = visible;
  updateEditorVisibility(focus);
  if (visible) {
    els.viewMenu.hidden = true;
    els.viewMenuTrigger.setAttribute("aria-expanded", "false");
  }
}

function clearProject({ keepOptions = true } = {}) {
  buildSequence += 1;
  buildRunning = false;
  sourceCode = "";
  selectedFileName = "";
  selectedFileSize = 0;
  els.fileInput.value = "";
  els.codeEditor.value = "";
  els.dirtyMark.hidden = true;
  els.appName.classList.remove("invalid");
  els.nameHint.classList.remove("error");
  els.nameHint.textContent = "Sem espaços ou caracteres especiais.";
  els.progressBlock.hidden = true;
  els.progressFill.style.width = "0%";
  els.buildButton.disabled = false;
  els.buildButtonLabel.textContent = "Gerar aplicativo";
  if (!keepOptions) {
    els.appName.value = "MeuAplicativo";
    els.outputFolder.value = "C:\\Builds";
    els.noConsole.checked = true;
    els.advanced.open = false;
  }
  clearLog();
  updateFileStatus();
  updateLineNumbers();
  updateEditorVisibility();
  showToast("Projeto limpo. Você já pode começar novamente.");
}

function validateAppName() {
  const name = els.appName.value.trim();
  const windowsReserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\..*)?$/i;
  const validCharacters = /^[\p{L}\p{N}_-]+$/u.test(name);
  const valid = name.length > 0 && validCharacters && !windowsReserved.test(name);
  els.appName.classList.toggle("invalid", !valid);
  els.nameHint.classList.toggle("error", !valid);
  els.nameHint.textContent = valid ? "Sem espaços ou caracteres especiais." : (windowsReserved.test(name) ? "Esse nome é reservado pelo Windows." : "Use apenas letras, números, hífen ou sublinhado.");
  return valid;
}

function openFilePicker() {
  els.fileInput.click();
}

async function loadPythonFile(file) {
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".py")) {
    showToast("Selecione um arquivo com extensão .py.", "error");
    addLog("Arquivo não carregado", "error", "Somente arquivos .py são aceitos.");
    els.fileInput.value = "";
    return;
  }
  if (file.size > MAX_SOURCE_BYTES) {
    showToast("Este protótipo aceita arquivos Python de até 2 MB.", "error");
    addLog("Arquivo não carregado", "error", "O arquivo excede o limite demonstrativo de 2 MB.");
    els.fileInput.value = "";
    return;
  }
  try {
    const text = (await file.text()).replace(/^\uFEFF/, "");
    selectedFileName = file.name;
    selectedFileSize = file.size;
    updateSourceCode(text);
    updateFileStatus();
    addLog("Arquivo Python carregado", "success", `${file.name} · ${formatBytes(file.size)} · lido localmente`);
    showToast(`${file.name} foi carregado. O código não foi executado.`);
  } catch (error) {
    console.error("Falha ao ler arquivo Python:", error);
    showToast("Não foi possível ler esse arquivo. Tente novamente.", "error");
    addLog("Falha ao ler o arquivo", "error", "O conteúdo não pôde ser aberto.");
  }
}

function setMode(mode) {
  buildMode = mode;
  $$(".segment").forEach((button) => {
    const selected = button.dataset.mode === mode;
    button.classList.toggle("active", selected);
    button.setAttribute("aria-checked", String(selected));
  });
  els.modeDescription.textContent = mode === "onefile"
    ? "Um único arquivo `.exe` fácil de compartilhar."
    : "Uma pasta com o `.exe` e seus arquivos auxiliares.";
}

function updateProgress(percent, label) {
  els.progressBlock.hidden = false;
  els.progressFill.style.width = `${percent}%`;
  els.progressValue.textContent = `${percent}%`;
  els.progressLabel.textContent = label;
}

function getBuildConfig() {
  const appName = els.appName.value.trim();
  const folder = els.outputFolder.value.trim();
  const version = $("#app-version").value.trim() || "1.0.0";
  const icon = $("#icon-file").files[0];
  const assets = [...$("#assets-files").files];
  return { appName, folder, version, icon, assets };
}

function validateBuild() {
  const nameIsValid = validateAppName();
  const config = getBuildConfig();
  let valid = true;
  if (!sourceCode.trim()) {
    addLog("Não foi possível iniciar a demonstração", "error", "Carregue ou escreva algum código Python primeiro.");
    showToast("Adicione um arquivo .py ou código Python antes de iniciar.", "error");
    valid = false;
  }
  if (!nameIsValid) {
    els.appName.focus();
    addLog("Não foi possível iniciar a demonstração", "error", "Corrija o nome do aplicativo antes de continuar.");
    valid = false;
  }
  if (!config.folder) {
    els.outputFolder.focus();
    addLog("Não foi possível iniciar a demonstração", "error", "Informe uma pasta de saída.");
    showToast("Informe uma pasta de saída para continuar.", "error");
    valid = false;
  }
  return valid ? config : null;
}

function sleep(ms) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runDemoBuild() {
  if (buildRunning) return;
  const config = validateBuild();
  if (!config) return;

  buildRunning = true;
  const sequence = ++buildSequence;
  els.buildButton.disabled = true;
  els.buildButtonLabel.textContent = "Simulando build…";
  els.progressBlock.hidden = false;
  updateProgress(0, "Iniciando demonstração");
  addLog("Demonstração de build iniciada", "warning", `${config.appName} · ${buildMode} · sem execução de código`);
  await sleep(260);
  if (sequence !== buildSequence) return;

  const stages = [
    { progress: 22, label: "Validando configuração", title: "Opções do projeto verificadas", detail: `Modo ${buildMode}; ${els.noConsole.checked ? "sem console" : "com console"}.`, type: "success" },
    { progress: 47, label: "Preparando empacotamento", title: "Parâmetros preparados", detail: `Nome ${config.appName} · versão ${config.version}.`, type: "success" },
    { progress: 72, label: "Simulando PyInstaller", title: "Etapa de compilação simulada", detail: "PyInstaller não foi executado neste site.", type: "warning" },
    { progress: 100, label: "Demonstração finalizada", title: "Simulação concluída — nenhum .exe criado", detail: `Destino ilustrativo: ${config.folder}\\${config.appName}${buildMode === "onefile" ? ".exe" : "\\"}.`, type: "warning" },
  ];

  for (const stage of stages) {
    await sleep(570);
    if (sequence !== buildSequence) return;
    updateProgress(stage.progress, stage.label);
    addLog(stage.title, stage.type, stage.detail);
  }

  if (sequence === buildSequence) {
    buildRunning = false;
    els.buildButton.disabled = false;
    els.buildButtonLabel.textContent = "Gerar novamente";
    showToast("Simulação concluída. Nenhum arquivo .exe foi gerado.");
  }
}

function promptAbout() {
  const dialog = $("#about-dialog");
  if (typeof dialog.showModal === "function") dialog.showModal();
  else showToast("Esta página demonstra o fluxo de interface; nenhuma compilação real é executada.");
}

function closeAbout() {
  const dialog = $("#about-dialog");
  if (typeof dialog.close === "function") dialog.close();
}

$("#choose-file-button").addEventListener("click", openFilePicker);
$("#load-side-button").addEventListener("click", openFilePicker);
$("#file-input").addEventListener("change", (event) => loadPythonFile(event.currentTarget.files[0]));
$("#remove-file-button").addEventListener("click", () => {
  selectedFileName = "";
  selectedFileSize = 0;
  els.fileInput.value = "";
  updateFileStatus();
  if (!els.showCodeToggle.checked) updateSourceCode("");
  addLog("Arquivo de origem removido", "success", "Você pode selecionar outro arquivo ou colar código no editor.");
});

["dragenter", "dragover"].forEach((eventName) => els.dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  els.dropZone.classList.add("drag-over");
}));
["dragleave", "drop"].forEach((eventName) => els.dropZone.addEventListener(eventName, (event) => {
  event.preventDefault();
  els.dropZone.classList.remove("drag-over");
}));
els.dropZone.addEventListener("drop", (event) => loadPythonFile(event.dataTransfer.files[0]));

els.viewMenuTrigger.addEventListener("click", () => {
  const willOpen = els.viewMenu.hidden;
  els.viewMenu.hidden = !willOpen;
  els.viewMenuTrigger.setAttribute("aria-expanded", String(willOpen));
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".view-menu-wrap")) {
    els.viewMenu.hidden = true;
    els.viewMenuTrigger.setAttribute("aria-expanded", "false");
  }
});
els.showCodeToggle.addEventListener("change", () => setCodeEditorVisible(els.showCodeToggle.checked));
els.codeEditor.addEventListener("input", () => {
  updateSourceCode(els.codeEditor.value, true);
});
els.codeEditor.addEventListener("scroll", () => { els.lineNumbers.scrollTop = els.codeEditor.scrollTop; });
els.codeEditor.addEventListener("keydown", (event) => {
  if (event.key === "Tab") {
    event.preventDefault();
    const { selectionStart, selectionEnd } = event.currentTarget;
    event.currentTarget.setRangeText("    ", selectionStart, selectionEnd, "end");
    event.currentTarget.dispatchEvent(new Event("input", { bubbles: true }));
  }
});
$("#clear-code-button").addEventListener("click", () => {
  updateSourceCode("", true);
  els.codeEditor.focus();
  showToast("Editor limpo.");
});
$("#example-button").addEventListener("click", () => {
  selectedFileName = "exemplo_app.py";
  selectedFileSize = new Blob([EXAMPLE_CODE]).size;
  setCodeEditorVisible(true);
  updateSourceCode(EXAMPLE_CODE);
  updateFileStatus();
  addLog("Exemplo Python carregado", "success", "Editor Tkinter · conteúdo demonstrativo local.");
  showToast("Exemplo pronto no editor. Edite o código quando quiser.");
});

$$(".segment").forEach((button) => button.addEventListener("click", () => setMode(button.dataset.mode)));
els.appName.addEventListener("input", () => {
  if (els.appName.classList.contains("invalid")) validateAppName();
});
$("#build-button").addEventListener("click", runDemoBuild);
$("#clear-side-button").addEventListener("click", () => clearProject());
$("#clear-log-button").addEventListener("click", () => {
  clearLog();
  if (buildRunning) addLog("Registro limpo", "success", "A demonstração ainda está em andamento.");
  else showToast("Registro de atividade limpo.");
});
$("#copy-log-button").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(formatLogText());
    showToast("Registro copiado para a área de transferência.");
  } catch {
    showToast("O navegador não permitiu copiar. Selecione o registro para copiá-lo.", "error");
  }
});
$("#icon-file").addEventListener("change", (event) => {
  const file = event.currentTarget.files[0];
  if (!file) return;
  if (!file.name.toLowerCase().endsWith(".ico")) {
    event.currentTarget.value = "";
    $("#icon-file-label").textContent = "Arquivo .ico opcional";
    showToast("O ícone precisa estar no formato .ico.", "error");
    return;
  }
  $("#icon-file-label").textContent = `${file.name} · ${formatBytes(file.size)}`;
  addLog("Ícone selecionado", "success", `${file.name} · referência demonstrativa`);
});
$("#assets-files").addEventListener("change", (event) => {
  const files = [...event.currentTarget.files];
  if (!files.length) return;
  $("#assets-file-label").textContent = `${files.length} ${files.length === 1 ? "arquivo" : "arquivos"} · ${formatBytes(files.reduce((sum, file) => sum + file.size, 0))}`;
  addLog("Assets selecionados", "success", `${files.length} ${files.length === 1 ? "arquivo" : "arquivos"} · não enviados nem empacotados`);
});
$("#dismiss-notice").addEventListener("click", () => { $(".notice").hidden = true; });
$("#help-button").addEventListener("click", promptAbout);
$("#close-about").addEventListener("click", closeAbout);
$("#about-done").addEventListener("click", closeAbout);
$("#about-dialog").addEventListener("click", (event) => {
  if (event.target === event.currentTarget) closeAbout();
});
document.addEventListener("keydown", (event) => {
  const modifier = event.ctrlKey || event.metaKey;
  if (modifier && event.key.toLowerCase() === "o") {
    event.preventDefault();
    openFilePicker();
  }
  if (modifier && event.key === "Enter") {
    event.preventDefault();
    runDemoBuild();
  }
  if (event.key === "Escape" && !$("#about-dialog").open) {
    els.viewMenu.hidden = true;
    els.viewMenuTrigger.setAttribute("aria-expanded", "false");
  }
});

updateFileStatus();
updateLineNumbers();
updateEditorVisibility();
