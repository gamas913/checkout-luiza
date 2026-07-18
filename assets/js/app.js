(function(){
  var STORAGE_PREFIX = 'checkout:';
  var currentDate = todayStr();
  var entryExists = false;
  var ratingRow = document.getElementById('day-rating');

  // ---------- utils ----------
  function todayStr(){
    var d = new Date();
    var off = d.getTimezoneOffset();
    return new Date(d.getTime() - off*60000).toISOString().slice(0,10);
  }
  function parseLocalDate(iso){
    var parts = iso.split('-').map(Number);
    return new Date(parts[0], parts[1]-1, parts[2]);
  }
  function fmtDateBR(iso){
    var p = iso.split('-');
    return p[2] + '/' + p[1] + '/' + p[0];
  }
  function escapeAttr(s){
    return (s===undefined||s===null?'':s).toString().replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }
  function escapeHtml(s){
    return (s===undefined||s===null?'':s).toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function updateHeroDate(iso){
    var d = parseLocalDate(iso);
    var formatted = d.toLocaleDateString('pt-BR', {weekday:'long', day:'numeric', month:'long', year:'numeric'});
    document.getElementById('hero-date-display').textContent = formatted;
  }

  // ---------- tabs ----------
  var tabBtns = document.querySelectorAll('.tab-btn');
  for(var t=0;t<tabBtns.length;t++){
    tabBtns[t].addEventListener('click', function(e){
      for(var i=0;i<tabBtns.length;i++) tabBtns[i].classList.remove('active');
      e.currentTarget.classList.add('active');
      var tab = e.currentTarget.dataset.tab;
      document.getElementById('view-form').hidden = tab !== 'form';
      document.getElementById('view-history').hidden = tab !== 'history';
      if(tab === 'history') renderHistory();
    });
  }

  // ---------- single-select button groups ----------
  function setupChoiceGroup(containerId, onChange){
    var el = document.getElementById(containerId);
    el.addEventListener('click', function(e){
      var btn = e.target.closest('.choice-btn, .radio-btn');
      if(!btn) return;
      var buttons = el.querySelectorAll('.choice-btn, .radio-btn');
      for(var i=0;i<buttons.length;i++) buttons[i].classList.remove('selected');
      btn.classList.add('selected');
      el.dataset.value = btn.dataset.value;
      if(onChange) onChange(btn.dataset.value);
    });
  }
  setupChoiceGroup('avoided-started', function(val){
    document.getElementById('avoided-time-wrap').hidden = (val !== 'sim');
  });
  setupChoiceGroup('stalled-project', function(val){
    document.getElementById('stalled-fields').hidden = (val !== 'sim');
  });
  setupChoiceGroup('reflection-scale');

  function selectChoice(id, value){
    var el = document.getElementById(id);
    var buttons = el.querySelectorAll('.choice-btn, .radio-btn');
    for(var i=0;i<buttons.length;i++){
      buttons[i].classList.toggle('selected', buttons[i].dataset.value === value);
    }
    el.dataset.value = value || '';
  }
  function clearChoice(id){
    var el = document.getElementById(id);
    var buttons = el.querySelectorAll('.choice-btn, .radio-btn');
    for(var i=0;i<buttons.length;i++) buttons[i].classList.remove('selected');
    el.dataset.value = '';
  }

  // ---------- rating 0-10 ----------
  for(var r=0;r<=10;r++){
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'rating-btn';
    b.textContent = r;
    b.dataset.value = r;
    ratingRow.appendChild(b);
  }
  ratingRow.addEventListener('click', function(e){
    var btn = e.target.closest('.rating-btn');
    if(!btn) return;
    var buttons = ratingRow.querySelectorAll('.rating-btn');
    for(var i=0;i<buttons.length;i++) buttons[i].classList.remove('selected');
    btn.classList.add('selected');
    ratingRow.dataset.value = btn.dataset.value;
  });

  // ---------- "outro" toggles ----------
  var otherToggles = document.querySelectorAll('[data-other-toggle]');
  for(var o=0;o<otherToggles.length;o++){
    otherToggles[o].addEventListener('change', function(e){
      var key = e.target.dataset.otherToggle;
      var input = document.getElementById(key + '-other');
      input.hidden = !e.target.checked;
      if(!e.target.checked) input.value = '';
    });
  }

  // ---------- project rows ----------
  var projectsList = document.getElementById('projects-list');
  function addProjectRow(data){
    data = data || {name:'', hours:'', progress:''};
    var row = document.createElement('div');
    row.className = 'project-row';
    row.innerHTML =
      '<input type="text" class="proj-name" placeholder="Projeto" list="project-suggestions" value="' + escapeAttr(data.name) + '">' +
      '<input type="number" class="proj-hours" placeholder="Horas" min="0" step="0.5" value="' + escapeAttr(data.hours) + '">' +
      '<input type="text" class="proj-progress" placeholder="O que avancei?" value="' + escapeAttr(data.progress) + '">' +
      '<button type="button" class="remove-row" title="Remover">✕</button>';
    row.querySelector('.remove-row').addEventListener('click', function(){
      if(projectsList.children.length > 1){
        row.remove();
      } else {
        var inputs = row.querySelectorAll('input');
        for(var i=0;i<inputs.length;i++) inputs[i].value = '';
      }
    });
    projectsList.appendChild(row);
  }
  document.getElementById('add-project').addEventListener('click', function(){ addProjectRow(); });

  // ---------- collect / populate / reset ----------
  function collectForm(){
    var rows = projectsList.querySelectorAll('.project-row');
    var projects = [];
    for(var i=0;i<rows.length;i++){
      var name = rows[i].querySelector('.proj-name').value.trim();
      var hours = rows[i].querySelector('.proj-hours').value.trim();
      var progress = rows[i].querySelector('.proj-progress').value.trim();
      if(name || hours || progress) projects.push({name:name, hours:hours, progress:progress});
    }
    var avoidedReasons = [];
    var arChecks = document.querySelectorAll('#avoided-reasons input:checked');
    for(var j=0;j<arChecks.length;j++) avoidedReasons.push(arChecks[j].value);
    var distractions = [];
    var dChecks = document.querySelectorAll('#distractions input:checked');
    for(var k=0;k<dChecks.length;k++) distractions.push(dChecks[k].value);

    return {
      date: document.getElementById('entry-date').value || currentDate,
      hoursPlanned: document.getElementById('hours-planned').value,
      hoursActual: document.getElementById('hours-actual').value,
      projects: projects,
      avoidedTask: document.getElementById('avoided-task').value,
      avoidedStarted: document.getElementById('avoided-started').dataset.value || '',
      avoidedTime: document.getElementById('avoided-time').value,
      avoidedReasons: avoidedReasons,
      avoidedOther: document.getElementById('avoided-other').value,
      distractions: distractions,
      distractionsOther: document.getElementById('distractions-other').value,
      delivered: document.getElementById('delivered').value,
      stalledProject: document.getElementById('stalled-project').dataset.value || '',
      stalledName: document.getElementById('stalled-name').value,
      stalledDays: document.getElementById('stalled-days').value,
      stalledReason: document.getElementById('stalled-reason').value,
      tomorrowPriority: document.getElementById('tomorrow-priority').value,
      reflectionScale: document.getElementById('reflection-scale').dataset.value || '',
      dayRating: ratingRow.dataset.value || '',
      smallWin: document.getElementById('small-win').value,
      improvement: document.getElementById('improvement').value
    };
  }

  function resetForm(){
    document.getElementById('hours-planned').value = '';
    document.getElementById('hours-actual').value = '';
    projectsList.innerHTML = '';
    addProjectRow();
    document.getElementById('avoided-task').value = '';
    clearChoice('avoided-started');
    document.getElementById('avoided-time-wrap').hidden = true;
    document.getElementById('avoided-time').value = '';
    var arInputs = document.querySelectorAll('#avoided-reasons input');
    for(var i=0;i<arInputs.length;i++) arInputs[i].checked = false;
    document.getElementById('avoided-other').value = '';
    document.getElementById('avoided-other').hidden = true;
    var dInputs = document.querySelectorAll('#distractions input');
    for(var j=0;j<dInputs.length;j++) dInputs[j].checked = false;
    document.getElementById('distractions-other').value = '';
    document.getElementById('distractions-other').hidden = true;
    document.getElementById('delivered').value = '';
    clearChoice('stalled-project');
    document.getElementById('stalled-fields').hidden = true;
    document.getElementById('stalled-name').value = '';
    document.getElementById('stalled-days').value = '';
    document.getElementById('stalled-reason').value = '';
    document.getElementById('tomorrow-priority').value = '';
    clearChoice('reflection-scale');
    var ratingBtns = ratingRow.querySelectorAll('.rating-btn');
    for(var k=0;k<ratingBtns.length;k++) ratingBtns[k].classList.remove('selected');
    ratingRow.dataset.value = '';
    document.getElementById('small-win').value = '';
    document.getElementById('improvement').value = '';
  }

  function populateForm(entry){
    document.getElementById('hours-planned').value = entry.hoursPlanned || '';
    document.getElementById('hours-actual').value = entry.hoursActual || '';
    projectsList.innerHTML = '';
    if(entry.projects && entry.projects.length){
      for(var p=0;p<entry.projects.length;p++) addProjectRow(entry.projects[p]);
    } else {
      addProjectRow();
    }
    document.getElementById('avoided-task').value = entry.avoidedTask || '';
    selectChoice('avoided-started', entry.avoidedStarted);
    document.getElementById('avoided-time-wrap').hidden = (entry.avoidedStarted !== 'sim');
    document.getElementById('avoided-time').value = entry.avoidedTime || '';
    var arInputs = document.querySelectorAll('#avoided-reasons input');
    var avoidedReasons = entry.avoidedReasons || [];
    for(var i=0;i<arInputs.length;i++) arInputs[i].checked = avoidedReasons.indexOf(arInputs[i].value) !== -1;
    var avOther = document.getElementById('avoided-other');
    avOther.value = entry.avoidedOther || '';
    avOther.hidden = avoidedReasons.indexOf('outro') === -1;

    var dInputs = document.querySelectorAll('#distractions input');
    var distractions = entry.distractions || [];
    for(var j=0;j<dInputs.length;j++) dInputs[j].checked = distractions.indexOf(dInputs[j].value) !== -1;
    var disOther = document.getElementById('distractions-other');
    disOther.value = entry.distractionsOther || '';
    disOther.hidden = distractions.indexOf('outro') === -1;

    document.getElementById('delivered').value = entry.delivered || '';
    selectChoice('stalled-project', entry.stalledProject);
    document.getElementById('stalled-fields').hidden = (entry.stalledProject !== 'sim');
    document.getElementById('stalled-name').value = entry.stalledName || '';
    document.getElementById('stalled-days').value = entry.stalledDays || '';
    document.getElementById('stalled-reason').value = entry.stalledReason || '';
    document.getElementById('tomorrow-priority').value = entry.tomorrowPriority || '';
    selectChoice('reflection-scale', entry.reflectionScale);
    var ratingBtns = ratingRow.querySelectorAll('.rating-btn');
    for(var k=0;k<ratingBtns.length;k++){
      ratingBtns[k].classList.toggle('selected', String(ratingBtns[k].dataset.value) === String(entry.dayRating));
    }
    ratingRow.dataset.value = entry.dayRating || '';
    document.getElementById('small-win').value = entry.smallWin || '';
    document.getElementById('improvement').value = entry.improvement || '';
  }

  // ---------- storage ----------
  async function loadEntry(date){
    try{
      var raw = localStorage.getItem(STORAGE_PREFIX + date);
      return raw ? JSON.parse(raw) : null;
    }catch(e){
      return null;
    }
  }

  async function saveEntry(){
    var data = collectForm();
    var btn = document.getElementById('save-btn');
    var msg = document.getElementById('save-msg');
    var fallbackLabel = entryExists ? 'Atualizar checkout de hoje' : 'Salvar checkout de hoje';
    btn.disabled = true;
    btn.textContent = 'Salvando...';
    try{
      var result = await (()=>{localStorage.setItem(STORAGE_PREFIX + data.date, JSON.stringify(data)); return true;})()
      if(!result) throw new Error('sem resultado');
      var hora = new Date().toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'});
      msg.textContent = '✓ Checkout salvo às ' + hora + '.';
      msg.className = 'save-msg ok';
      entryExists = true;
      btn.textContent = 'Atualizar checkout de hoje';
    }catch(e){
      msg.textContent = 'Não foi possível salvar agora. Tente novamente.';
      msg.className = 'save-msg error';
      btn.textContent = fallbackLabel;
    }finally{
      btn.disabled = false;
      setTimeout(function(){ msg.textContent = ''; }, 5000);
    }
  }
  document.getElementById('save-btn').addEventListener('click', saveEntry);

  document.getElementById('entry-date').addEventListener('change', function(e){
    currentDate = e.target.value;
    updateHeroDate(currentDate);
    loadIntoForm(currentDate);
  });

  async function loadIntoForm(date){
    var status = document.getElementById('load-status');
    status.textContent = 'Carregando...';
    var entry = await loadEntry(date);
    if(entry){
      populateForm(entry);
      entryExists = true;
      document.getElementById('save-btn').textContent = 'Atualizar checkout de hoje';
      status.textContent = 'Já existe um checkout salvo neste dia — você está editando.';
    } else {
      resetForm();
      entryExists = false;
      document.getElementById('save-btn').textContent = 'Salvar checkout de hoje';
      try{
        var draftRaw = localStorage.getItem('checkout:draft:' + date);
        if(draftRaw){
          populateForm(JSON.parse(draftRaw));
          status.textContent = 'Rascunho recuperado automaticamente — toque em salvar para confirmar.';
        } else {
          status.textContent = '';
        }
      }catch(e){ status.textContent = ''; }
    }
  }

  // ---------- history ----------
  async function renderHistory(){
    var list = document.getElementById('history-list');
    var stats = document.getElementById('stats-summary');
    list.innerHTML = '<p class="empty-state">Carregando histórico...</p>';
    try{
      var keys=[]; for(var ii=0;ii<localStorage.length;ii++){var k=localStorage.key(ii); if(k&&k.indexOf(STORAGE_PREFIX)===0) keys.push(k);}
      var dates = keys.map(function(k){ return k.replace(STORAGE_PREFIX, ''); }).sort().reverse();

      if(dates.length === 0){
        stats.innerHTML = '';
        stats.style.display = 'none';
        list.innerHTML = '<p class="empty-state">Nenhum dia fechado ainda. Preencha o checkout na aba "Novo checkout" para começar seu histórico.</p>';
        return;
      }
      stats.style.display = 'flex';

      var entries = [];
      for(var i=0;i<dates.length;i++){
        var e = await loadEntry(dates[i]);
        if(e) entries.push(e);
      }

      var ratings = [];
      var plannedSum = 0, actualSum = 0;
      for(var j=0;j<entries.length;j++){
        var rNum = Number(entries[j].dayRating);
        if(!isNaN(rNum) && entries[j].dayRating !== '') ratings.push(rNum);
        plannedSum += Number(entries[j].hoursPlanned) || 0;
        actualSum += Number(entries[j].hoursActual) || 0;
      }
      var avgRating = ratings.length ? (ratings.reduce(function(a,b){return a+b;},0) / ratings.length).toFixed(1) : '—';

      stats.innerHTML =
        '<div class="stat"><span class="stat-value">' + entries.length + '</span><span class="stat-label">DIAS FECHADOS</span></div>' +
        '<div class="stat"><span class="stat-value">' + avgRating + '</span><span class="stat-label">NOTA MÉDIA</span></div>' +
        '<div class="stat"><span class="stat-value">' + actualSum.toFixed(1) + 'h / ' + plannedSum.toFixed(1) + 'h</span><span class="stat-label">REALIZADO / PLANEJADO</span></div>';

      list.innerHTML = '';
      entries.forEach(function(entry){
        var card = document.createElement('div');
        card.className = 'card history-item';
        var ratingBadge = (entry.dayRating !== '' && entry.dayRating !== null && entry.dayRating !== undefined)
          ? '<span class="badge">Nota ' + escapeHtml(entry.dayRating) + '</span>' : '';
        card.innerHTML =
          '<div class="history-head"><strong>' + fmtDateBR(entry.date) + '</strong>' + ratingBadge + '</div>' +
          '<div class="history-body" hidden></div>';
        card.querySelector('.history-head').addEventListener('click', function(){
          var body = this.parentElement.querySelector('.history-body');
          if(body.hidden){
            body.innerHTML = buildHistoryDetail(entry);
            body.hidden = false;
          } else {
            body.hidden = true;
          }
        });
        list.appendChild(card);
      });
    }catch(err){
      list.innerHTML = '<p class="empty-state">Não foi possível carregar o histórico agora.</p>';
    }
  }

  function buildHistoryDetail(e){
    var out = '';
    out += '<p><strong>Horas:</strong> ' + escapeHtml(e.hoursActual || '—') + 'h realizadas de ' + escapeHtml(e.hoursPlanned || '—') + 'h planejadas</p>';
    var projLines = '';
    (e.projects || []).forEach(function(p){
      if(p.name || p.hours || p.progress){
        projLines += '<li><strong>' + escapeHtml(p.name || '—') + '</strong> (' + escapeHtml(p.hours || '0') + 'h): ' + escapeHtml(p.progress || '') + '</li>';
      }
    });
    if(projLines) out += '<ul class="proj-list">' + projLines + '</ul>';
    if(e.avoidedTask) out += '<p><strong>Tarefa evitada:</strong> ' + escapeHtml(e.avoidedTask) + ' — ' + (e.avoidedStarted === 'sim' ? 'iniciada' : 'não iniciada') + '</p>';
    if(e.delivered) out += '<p><strong>Entregue:</strong> ' + escapeHtml(e.delivered) + '</p>';
    if(e.stalledProject === 'sim' && e.stalledName) out += '<p><strong>Projeto parado:</strong> ' + escapeHtml(e.stalledName) + ' (' + escapeHtml(e.stalledDays || '?') + ' dias)</p>';
    if(e.tomorrowPriority) out += '<p><strong>Prioridade seguinte:</strong> ' + escapeHtml(e.tomorrowPriority) + '</p>';
    if(e.smallWin) out += '<p><strong>Pequena vitória:</strong> ' + escapeHtml(e.smallWin) + '</p>';
    if(e.improvement) out += '<p><strong>Melhoria:</strong> ' + escapeHtml(e.improvement) + '</p>';
    return out;
  }


  // Exporta arquivos de forma compatível com Android/PWA e desktop.
  // No celular, abre a folha de compartilhamento para salvar em Arquivos ou Drive.
  async function exportJsonFile(data, filename){
    var json=JSON.stringify(data,null,2);
    var file=new File([json],filename,{type:'application/json'});

    if(navigator.share && (!navigator.canShare || navigator.canShare({files:[file]}))){
      try{
        await navigator.share({files:[file],title:filename});
        return 'shared';
      }catch(err){
        if(err && err.name==='AbortError') return 'cancelled';
        // Se o compartilhamento falhar, tenta o download tradicional abaixo.
      }
    }

    var url=URL.createObjectURL(file);
    var a=document.createElement('a');
    a.href=url;
    a.download=filename;
    a.rel='noopener';
    a.style.display='none';
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(function(){URL.revokeObjectURL(url);},5000);
    return 'downloaded';
  }

  document.addEventListener('click',async function(e){
    if(e.target&&e.target.id==='export-json'){
      var dados=[];
      for(var i=0;i<localStorage.length;i++){
        var k=localStorage.key(i);
        if(k&&k.indexOf(STORAGE_PREFIX)===0&&k.indexOf('checkout:draft:')!==0&&k!=='checkout:projects'){
          try{dados.push(JSON.parse(localStorage.getItem(k)));}catch(err){}
        }
      }
      var result=await exportJsonFile(dados,'historico-checkout-luiza-'+todayStr()+'.json');
      var status=document.getElementById('backup-status');
      if(result==='shared') status.textContent='Escolha Arquivos, Drive ou outro local para guardar o histórico.';
      else if(result==='downloaded') status.textContent='Histórico exportado para os downloads do aparelho.';
      else status.textContent='Exportação cancelada.';
    }
  });


  // ---------- project catalog, backup and autosave ----------
  var PROJECTS_KEY = 'checkout:projects';
  var DRAFT_KEY = 'checkout:draft:';
  function getProjectCatalog(){
    try{return JSON.parse(localStorage.getItem(PROJECTS_KEY) || '[]');}catch(e){return [];}
  }
  function saveProjectCatalog(projects){
    var names=[];
    (projects||[]).forEach(function(p){
      var name=(p.name||'').trim();
      if(name && names.indexOf(name)===-1) names.push(name);
    });
    localStorage.setItem(PROJECTS_KEY, JSON.stringify(names));
    renderProjectSuggestions();
  }
  function renderProjectSuggestions(){
    var dl=document.getElementById('project-suggestions');
    if(!dl) return;
    dl.innerHTML='';
    getProjectCatalog().forEach(function(name){var op=document.createElement('option');op.value=name;dl.appendChild(op);});
  }
  function updateCatalogFromEntry(data){
    var old=getProjectCatalog().map(function(n){return {name:n};});
    saveProjectCatalog(old.concat(data.projects||[]));
  }
  var originalSaveEntry=saveEntry;
  saveEntry=async function(){
    var data=collectForm();
    updateCatalogFromEntry(data);
    await originalSaveEntry();
    localStorage.removeItem(DRAFT_KEY + data.date);
  };
  document.getElementById('save-btn').removeEventListener('click', originalSaveEntry);
  document.getElementById('save-btn').addEventListener('click', saveEntry);

  var draftTimer;
  document.getElementById('view-form').addEventListener('input', function(){
    clearTimeout(draftTimer);
    draftTimer=setTimeout(function(){
      try{var d=collectForm(); localStorage.setItem(DRAFT_KEY+d.date,JSON.stringify(d));}catch(e){}
    },400);
  });

  function buildBackup(){
    var data={version:1,exportedAt:new Date().toISOString(),entries:[],projects:getProjectCatalog()};
    for(var i=0;i<localStorage.length;i++){
      var k=localStorage.key(i);
      if(k && k.indexOf(STORAGE_PREFIX)===0 && k.indexOf(DRAFT_KEY)!==0 && k!==PROJECTS_KEY){
        try{data.entries.push(JSON.parse(localStorage.getItem(k)));}catch(e){}
      }
    }
    return data;
  }
  document.getElementById('export-backup').addEventListener('click',async function(){
    var status=document.getElementById('backup-status');
    status.textContent='Preparando backup...';
    try{
      var result=await exportJsonFile(buildBackup(),'backup-checkout-luiza-'+todayStr()+'.json');
      if(result==='shared') status.textContent='Escolha Arquivos, Drive ou outro local para guardar o backup.';
      else if(result==='downloaded') status.textContent='Backup salvo nos downloads do aparelho.';
      else status.textContent='Backup cancelado.';
    }catch(err){
      status.textContent='Não foi possível exportar o backup neste aparelho.';
    }
  });
  document.getElementById('import-backup').addEventListener('change',function(e){
    var file=e.target.files&&e.target.files[0]; if(!file) return;
    var reader=new FileReader();
    reader.onload=function(){
      try{
        var backup=JSON.parse(reader.result);
        if(!backup || !Array.isArray(backup.entries)) throw new Error('Formato inválido');
        backup.entries.forEach(function(entry){if(entry&&entry.date)localStorage.setItem(STORAGE_PREFIX+entry.date,JSON.stringify(entry));});
        if(Array.isArray(backup.projects)) localStorage.setItem(PROJECTS_KEY,JSON.stringify(backup.projects));
        renderProjectSuggestions(); loadIntoForm(currentDate);
        document.getElementById('backup-status').textContent='Backup restaurado com sucesso.';
      }catch(err){document.getElementById('backup-status').textContent='Arquivo de backup inválido.';}
      e.target.value='';
    };
    reader.readAsText(file);
  });
  document.getElementById('clear-all').addEventListener('click',function(){
    if(!confirm('Isso apagará todos os checkouts e projetos deste aparelho. Faça um backup antes. Continuar?')) return;
    var remove=[];
    for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('checkout:')===0)remove.push(k);}
    remove.forEach(function(k){localStorage.removeItem(k);});
    renderHistory(); loadIntoForm(currentDate); renderProjectSuggestions();
  });
  renderProjectSuggestions();

  // ---------- installable PWA ----------
  if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('./service-worker.js').catch(function(){});});}
  var deferredPrompt;
  window.addEventListener('beforeinstallprompt',function(e){
    e.preventDefault(); deferredPrompt=e;
    var bar=document.createElement('div');bar.className='install-banner';bar.innerHTML='<span>Instalar como aplicativo neste aparelho</span><button type="button">Instalar</button>';
    bar.querySelector('button').onclick=function(){deferredPrompt.prompt();bar.remove();};document.body.appendChild(bar);
  });

  // ---------- init ----------
  document.getElementById('entry-date').value = currentDate;
  updateHeroDate(currentDate);
  loadIntoForm(currentDate);
})();