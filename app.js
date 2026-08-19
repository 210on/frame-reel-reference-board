import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const SUPABASE_URL = 'https://piktymhhfkxqsudwvjjh.supabase.co';
const SUPABASE_KEY = 'sb_publishable_4E2ggcOiVJH_93NNp9TPuw_nVu8PEWl';
const BOARD_ID = 'd00be40e-7621-418e-8e1b-e97c90dc5694';
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } });

const seed = [
  ['Dbpc_YRKnx9','Coffee shoot / behind the scenes','cinematic'],['DcCq1O5T0M6','arvoの1日 — 朝から夜まで','story'],['Db0TdE9hSep','仕事と暮らしのストーリー','story'],['DZ7RZ-DpZNE','Lunch combo at Dikby','coffee'],['DaTOuM5o48L','Apero? Yes please!','coffee'],['DaNJNSixqGg','Your daily coffee reminder','coffee'],['DZepx4ViQEu','映像で差別化するリール','tutorial'],['DZwgg8Gzmtv','Sound design is easy','sound'],['Db4vgbtt2bA','Cold brew character reel','coffee'],['Db03XWhAdD_','Shoot vs feed','cinematic'],['DZ9GTADTOLt','uneek.bkk coffee shop','coffee'],['DZk9iiONkkO','Food illustration transition','cinematic'],['DWgqzklDIb-','Coffee detail ASMR','sound'],['Da5KLAGNNg4','Why this hook reached 5.2M','tutorial'],['DbLdCqUtD68','3 proven hooks','tutorial'],['DR5cWhakhHu','Cinematic coffee shop','cinematic'],['DXWY4ovj8UV','One slow pour at a time','coffee'],['DMzQ1dmTblZ','Iced latte layers','coffee'],['C6BvxD6r5JF','Sunday coffee with a friend','story'],['CqFgd79IocZ','Coffee commercial BTS','cinematic'],['DZw-1tjps8R','Meet our Mont Blanc','coffee']
].map(([instagram_id,title,category],index)=>({id:`seed-${instagram_id}`,instagram_id,title,category,url:`https://www.instagram.com/p/${instagram_id}/`,sort_order:index,source:'instagram'}));

const $ = selector => document.querySelector(selector);
const board = $('#board');
const gradients = ['linear-gradient(145deg,#5d6a55,#151a15)','linear-gradient(145deg,#725949,#241c17)','linear-gradient(145deg,#535d70,#17191f)','linear-gradient(145deg,#745d35,#251f13)','linear-gradient(145deg,#5e4b5e,#1f171f)'];
const categories = ['all','coffee','cinematic','tutorial','sound','story'];
const labels = {all:'すべて',coffee:'Coffee',cinematic:'Cinematic',tutorial:'How to',sound:'Sound',story:'Story'};
const tokenStorageKey = `frame-owner-token-${BOARD_ID}`;
const query = new URLSearchParams(location.search);
if (query.get('edit')) {
  localStorage.setItem(tokenStorageKey, query.get('edit'));
  query.delete('edit');
  history.replaceState({}, '', `${location.pathname}${query.size ? `?${query}` : ''}${location.hash}`);
}

const state = {
  items: seed,
  notes: {},
  filter: 'all',
  query: '',
  selected: null,
  localVideo: null,
  loopIn: null,
  loopOut: null,
  looping: false,
  markers: [],
  canEdit: false,
  connected: false,
  syncing: false,
  editToken: localStorage.getItem(tokenStorageKey) || null,
};

function normalizeInstagramUrl(value) {
  try {
    const url = new URL(value.trim());
    const host = url.hostname.replace(/^www\./, '');
    if (host !== 'instagram.com') return null;
    const match = url.pathname.match(/^\/(p|reel|reels|tv)\/([^/?#]+)/i);
    if (!match) return null;
    const kind = match[1].toLowerCase() === 'p' ? 'p' : 'reel';
    const instagramId = match[2];
    const canonicalUrl = `https://www.instagram.com/${kind}/${instagramId}/`;
    return { instagramId, canonicalUrl, embedUrl: `${canonicalUrl}embed/` };
  } catch { return null; }
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[char]));
}

function toast(text) {
  const el = $('#toast');
  el.textContent = text;
  el.classList.add('visible');
  setTimeout(() => el.classList.remove('visible'), 2200);
}

function setSyncStatus(type, text) {
  const el = $('#syncStatus');
  el.className = `sync-status ${type}`;
  el.textContent = text;
}

function renderFilters() {
  $('#filters').innerHTML = categories.map(category => `<button class="chip ${state.filter===category?'active':''}" data-filter="${category}">${labels[category]}</button>`).join('');
}

function filteredItems() {
  let items = state.items.filter(item => (state.filter==='all' || item.category===state.filter) && `${item.title} ${item.category}`.toLowerCase().includes(state.query));
  if ($('#sortSelect').value === 'title') items.sort((a,b)=>a.title.localeCompare(b.title));
  if ($('#sortSelect').value === 'notes') items.sort((a,b)=>Number(!!state.notes[b.id])-Number(!!state.notes[a.id]));
  return items;
}

function render() {
  renderFilters();
  const items = filteredItems();
  board.innerHTML = items.map((item,index) => {
    const normalized = normalizeInstagramUrl(item.url);
    const sourceUrl = normalized?.canonicalUrl || item.url;
    const iframe = normalized ? `<iframe src="${escapeHtml(normalized.embedUrl)}" title="${escapeHtml(item.title)}" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture"></iframe>` : '';
    return `<article class="card ${normalized?'':'embed-failed'}" data-id="${item.id}" style="--card-bg:${gradients[(item.sort_order??index)%gradients.length]}">
      <span class="card-fallback"><span>${String(index+1).padStart(2,'0')}</span></span>${iframe}
      <span class="card-top"><span class="card-number">${String(index+1).padStart(2,'0')} / ${String(items.length).padStart(2,'0')}</span><button class="card-analyze" data-analyze="${item.id}">分析 ↗</button></span>
      <span class="card-copy"><h3>${escapeHtml(item.title)}</h3><span class="card-meta"><span>${state.notes[item.id]?'<i class="note-dot"></i>ANALYZED':labels[item.category]||item.category}</span><span>REEL</span></span></span>
      <a class="card-source" href="${escapeHtml(sourceUrl)}" target="_blank" rel="noopener">Instagram ↗</a>
    </article>`;
  }).join('');
  board.querySelectorAll('iframe').forEach(frame => {
    const card = frame.closest('.card');
    frame.addEventListener('error', () => card.classList.add('embed-failed'), {once:true});
  });
  $('#reelCount').textContent = state.items.length;
  $('#noteCount').textContent = Object.keys(state.notes).length;
  $('#addButton').disabled = !state.canEdit;
  $('#addButton').classList.toggle('readonly-control', !state.canEdit);
  updateProgress();
}

async function loadSnapshot({quiet=false}={}) {
  if (state.syncing) return;
  state.syncing = true;
  if (!quiet) setSyncStatus('', '同期中…');
  const { data, error } = await supabase.rpc('get_reel_board_snapshot', { p_board_id: BOARD_ID, p_edit_token: state.editToken });
  state.syncing = false;
  if (error || !data) {
    state.connected = false;
    setSyncStatus('error', 'オフライン');
    if (!quiet) toast('同期サーバーへ接続できませんでした');
    render();
    return;
  }
  state.connected = true;
  state.canEdit = Boolean(data.can_edit);
  state.items = data.items || [];
  state.notes = Object.fromEntries((data.notes || []).map(note => [note.item_id, {...note, loop: note.loop_range}]));
  setSyncStatus(state.canEdit ? 'online' : 'readonly', state.canEdit ? '同期・編集可' : '同期・閲覧専用');
  if (state.selected && !state.selected.id.startsWith('local-')) {
    const current = state.items.find(item => item.id === state.selected.id);
    if (!current && $('#playerDialog').open) $('#playerDialog').close();
    if (current) state.selected = current;
  }
  render();
}

function selectItem(id) {
  state.selected = state.items.find(item => item.id === id);
  state.localVideo = null;
  openPlayer();
}

function openPlayer() {
  const item = state.selected || {id:'local',title:'My footage',url:'#',category:'cinematic'};
  const isLocal = Boolean(state.localVideo);
  const normalized = normalizeInstagramUrl(item.url || '');
  $('#analysisTitle').textContent = item.title;
  $('#instagramLink').href = normalized?.canonicalUrl || item.url || '#';
  $('#instagramLink').style.display = 'none';
  $('#videoEmpty').style.display = normalized || isLocal ? 'none' : 'flex';
  $('#video').style.display = isLocal ? 'block' : 'none';
  $('#instagramEmbed').style.display = !isLocal && normalized ? 'block' : 'none';
  $('#instagramEmbed').src = !isLocal && normalized ? normalized.embedUrl : 'about:blank';
  $('#precisionNote').style.display = isLocal ? 'none' : 'block';
  $('.viewer-panel').classList.toggle('instagram-mode', !isLocal);
  const note = state.notes[item.id] || {};
  $('#whyNote').value = note.why || '';
  $('#hookNote').value = note.hook || '';
  $('#pacingNote').value = note.pacing || 'Medium';
  $('#shotNote').value = note.shots || '';
  $('#audioNote').value = note.audio || '';
  $('#noteVisibility').checked = note.visibility === 'shared';
  state.markers = note.markers || [];
  [state.loopIn,state.loopOut] = note.loop || [null,null];
  renderTags(note.tags || []);
  const remoteItem = state.items.some(candidate => candidate.id === item.id);
  const editable = state.canEdit && remoteItem;
  for (const control of document.querySelectorAll('.analysis-panel input,.analysis-panel textarea,.analysis-panel select')) control.disabled = !editable;
  $('#saveAnalysis').disabled = !editable;
  $('#saveAnalysis').classList.toggle('readonly-control', !editable);
  const del = $('#deleteReference');
  del.disabled = !editable;
  del.classList.remove('confirming');
  del.textContent = isLocal ? 'ローカル動画は削除対象外' : editable ? 'このリールを削除' : '閲覧専用';
  $('#playerDialog').showModal();
}

function renderTags(active=[]) {
  $('#tagPicker').innerHTML = ['hook','camera','light','edit','sound','color'].map(tag => `<button class="${active.includes(tag)?'active':''}" data-tag="${tag}" ${state.canEdit?'':'disabled'}>#${tag}</button>`).join('');
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds)) seconds=0;
  const minutes=Math.floor(seconds/60), whole=Math.floor(seconds%60), ms=Math.floor((seconds%1)*1000);
  return `${String(minutes).padStart(2,'0')}:${String(whole).padStart(2,'0')}.${String(ms).padStart(3,'0')}`;
}

function updateTimeline() {
  const video=$('#video');
  $('#currentTime').textContent=formatTime(video.currentTime);
  $('#duration').textContent=formatTime(video.duration);
  $('#timeline').value=video.duration?video.currentTime/video.duration*1000:0;
  $('#playButton').textContent=video.paused?'▶':'Ⅱ';
  if(state.looping&&state.loopOut!=null&&video.currentTime>=state.loopOut)video.currentTime=state.loopIn||0;
  renderMarkers();
}

function renderMarkers(){const video=$('#video');$('#markerLayer').innerHTML=state.markers.map(marker=>`<i class="timeline-marker" style="left:${video.duration?marker/video.duration*100:0}%"></i>`).join('')}

$('#filters').addEventListener('click',event=>{const filter=event.target.closest('[data-filter]');if(filter){state.filter=filter.dataset.filter;render()}});
board.addEventListener('click',event=>{const button=event.target.closest('[data-analyze]');if(button)selectItem(button.dataset.analyze)});
$('#sortSelect').addEventListener('change',render);
$('#searchToggle').onclick=()=>{$('#searchBox').classList.toggle('visible');$('#searchInput').focus()};
$('#searchInput').oninput=event=>{state.query=event.target.value.toLowerCase();render()};
$('#shareButton').onclick=async()=>{const shareUrl=`${location.origin}${location.pathname}`;const data={title:'FRAME — Reel reference board',text:`${state.items.length}本の同期リール・リファレンス`,url:shareUrl};try{if(navigator.share)await navigator.share(data);else{await navigator.clipboard.writeText(shareUrl);toast('閲覧用リンクをコピーしました')}}catch{}};
$('#addButton').onclick=()=>{if(state.canEdit)$('#addDialog').showModal();else toast('このブラウザーは閲覧専用です')};
$('#addForm').addEventListener('submit',async event=>{
  if(event.submitter?.value==='cancel')return;
  event.preventDefault();
  const normalized=normalizeInstagramUrl($('#newUrl').value);
  if(!normalized){toast('Instagramの投稿・リールURLを確認してください');return}
  const {error}=await supabase.rpc('mutate_reel_item',{p_board_id:BOARD_ID,p_edit_token:state.editToken,p_action:'upsert',p_item:{instagram_id:normalized.instagramId,url:normalized.canonicalUrl,title:$('#newTitle').value||'Untitled reference',category:$('#newCategory').value,sort_order:state.items.length},p_item_id:null});
  if(error){toast('追加できませんでした');return}
  $('#addDialog').close();event.target.reset();toast('リールを追加・同期しました');await loadSnapshot({quiet:true});
});

$('#uploadButton').onclick=()=>$('#videoInput').click();
$('#videoInput').onchange=event=>{const file=event.target.files[0];if(!file)return;if(state.localVideo)URL.revokeObjectURL(state.localVideo);state.localVideo=URL.createObjectURL(file);state.selected={id:`local-${file.name}`,title:file.name,category:'cinematic',source:'local'};const video=$('#video');video.src=state.localVideo;state.markers=[];state.loopIn=state.loopOut=null;openPlayer()};
$('#closePlayer').onclick=()=>{$('#video').pause();$('#playerDialog').close()};
$('#playButton').onclick=()=>{$('#video').paused?$('#video').play():$('#video').pause()};
$('#backButton').onclick=()=>$('#video').currentTime=Math.max(0,$('#video').currentTime-5);
$('#forwardButton').onclick=()=>$('#video').currentTime=Math.min($('#video').duration||0,$('#video').currentTime+5);
$('#prevFrame').onclick=()=>$('#video').currentTime=Math.max(0,$('#video').currentTime-1/30);
$('#nextFrame').onclick=()=>$('#video').currentTime=Math.min($('#video').duration||0,$('#video').currentTime+1/30);
$('#speed').oninput=event=>{$('#video').playbackRate=Number(event.target.value);$('#speedValue').value=`${Number(event.target.value).toFixed(2)}×`};
$('#timeline').oninput=event=>{const video=$('#video');if(video.duration)video.currentTime=Number(event.target.value)/1000*video.duration};
for(const name of ['timeupdate','loadedmetadata','play','pause'])$('#video').addEventListener(name,updateTimeline);
$('#setIn').onclick=()=>{state.loopIn=$('#video').currentTime;toast(`IN ${formatTime(state.loopIn)}`)};
$('#setOut').onclick=()=>{state.loopOut=$('#video').currentTime;toast(`OUT ${formatTime(state.loopOut)}`)};
$('#loopButton').onclick=event=>{state.looping=!state.looping;event.currentTarget.setAttribute('aria-pressed',state.looping);toast(state.looping?'区間ループ ON':'区間ループ OFF')};
$('#addMarker').onclick=()=>{state.markers.push($('#video').currentTime);renderMarkers();toast('マーカーを追加しました')};
$('#tagPicker').onclick=event=>{const button=event.target.closest('[data-tag]');if(button&&!button.disabled)button.classList.toggle('active')};
$('#saveAnalysis').onclick=async()=>{
  if(!state.canEdit||!state.selected)return;
  const note={visibility:$('#noteVisibility').checked?'shared':'private',why:$('#whyNote').value,hook:$('#hookNote').value,pacing:$('#pacingNote').value,shots:$('#shotNote').value,audio:$('#audioNote').value,tags:[...document.querySelectorAll('#tagPicker .active')].map(el=>el.dataset.tag),markers:state.markers,loop:[state.loopIn,state.loopOut]};
  const {error}=await supabase.rpc('upsert_reel_note',{p_board_id:BOARD_ID,p_edit_token:state.editToken,p_item_id:state.selected.id,p_note:note});
  if(error){toast('分析を保存できませんでした');return}toast(note.visibility==='shared'?'分析を共有・同期しました':'非公開分析を同期しました');await loadSnapshot({quiet:true});
};
$('#deleteReference').onclick=async event=>{
  const button=event.currentTarget,id=state.selected?.id;
  if(!state.canEdit||!id)return;
  if(!button.classList.contains('confirming')){button.classList.add('confirming');button.textContent='もう一度押して削除';return}
  button.disabled=true;
  const {error}=await supabase.rpc('mutate_reel_item',{p_board_id:BOARD_ID,p_edit_token:state.editToken,p_action:'delete',p_item:null,p_item_id:id});
  if(error){button.disabled=false;toast('削除できませんでした');return}
  $('#video').pause();$('#playerDialog').close();toast('全ブラウザーから削除しました');await loadSnapshot({quiet:true});
};

document.addEventListener('keydown',event=>{if(!$('#playerDialog').open||['INPUT','TEXTAREA','SELECT'].includes(event.target.tagName))return;if(event.code==='Space'){event.preventDefault();$('#playButton').click()}if(event.key.toLowerCase()==='i')$('#setIn').click();if(event.key.toLowerCase()==='o')$('#setOut').click();if(event.key.toLowerCase()==='m')$('#addMarker').click();if(event.key==='ArrowLeft')$('#prevFrame').click();if(event.key==='ArrowRight')$('#nextFrame').click()});
function updateProgress(){const max=board.scrollWidth-board.clientWidth;const progress=max?board.scrollLeft/max:0;$('#scrollProgress').style.width=`${Math.max(12,progress*100)}%`}
board.addEventListener('scroll',updateProgress,{passive:true});

supabase.channel(`frame-${BOARD_ID}`)
  .on('postgres_changes',{event:'*',schema:'public',table:'reel_items',filter:`board_id=eq.${BOARD_ID}`},()=>loadSnapshot({quiet:true}))
  .on('postgres_changes',{event:'*',schema:'public',table:'reel_notes',filter:`board_id=eq.${BOARD_ID}`},()=>loadSnapshot({quiet:true}))
  .subscribe();
setInterval(()=>loadSnapshot({quiet:true}),5000);
render();
loadSnapshot();
