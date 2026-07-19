const builtInSong={id:1,title:"Amazing Grace",artist:"John Newton",originalKey:"G",difficulty:"Beginner",category:"Hymn",isBuiltIn:true,sections:[{name:"Verse 1",lines:[{chords:"G                 C        G",lyrics:"Amazing grace, how sweet the sound"},{chords:"G                         D",lyrics:"That saved a wretch like me"},{chords:"G                  C       G",lyrics:"I once was lost, but now am found"},{chords:"G             D       G",lyrics:"Was blind, but now I see"}]},{name:"Verse 2",lines:[{chords:"G                         C       G",lyrics:"'Twas grace that taught my heart to fear"},{chords:"G                           D",lyrics:"And grace my fears relieved"},{chords:"G                   C       G",lyrics:"How precious did that grace appear"},{chords:"G              D       G",lyrics:"The hour I first believed"}]},{name:"Verse 3",lines:[{chords:"G                         C          G",lyrics:"Through many dangers, toils and snares"},{chords:"G                    D",lyrics:"I have already come"},{chords:"G                         C          G",lyrics:"'Tis grace hath brought me safe thus far"},{chords:"G                 D       G",lyrics:"And grace will lead me home"}]}]};
let songs=[builtInSong,...(JSON.parse(localStorage.getItem("simpleChordsSongs"))||[])];
const $=id=>document.getElementById(id);
const songList=$("songList"),songCount=$("songCount"),emptyMessage=$("emptyMessage"),searchInput=$("searchInput"),songArtist=$("songArtist"),songTitle=$("songTitle"),songKey=$("songKey"),songDifficulty=$("songDifficulty"),songCategory=$("songCategory"),songContent=$("songContent"),transposeValue=$("transposeValue"),deleteSongButton=$("deleteSongButton"),favoriteButton=$("favoriteButton");
const editorModal=$("editorModal"),songForm=$("songForm"),editorTitle=$("editorTitle"),editingSongId=$("editingSongId"),editorSongTitle=$("editorSongTitle"),editorArtist=$("editorArtist"),editorKey=$("editorKey"),editorDifficulty=$("editorDifficulty"),editorCategory=$("editorCategory"),editorSongText=$("editorSongText"),editorMessage=$("editorMessage"),lineNumbers=$("lineNumbers"),editorLivePreview=$("editorLivePreview"),detectedChordCount=$("detectedChordCount");
let selectedSongId=songs[0].id,transposeSteps=0,songFontSize=18,chordsAreVisible=true,favoriteSongs=JSON.parse(localStorage.getItem("favoriteSongs"))||[];
const notes=["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"],flatToSharp={Db:"C#",Eb:"D#",Gb:"F#",Ab:"G#",Bb:"A#"};
function transposeChord(chord,steps){return chord.replace(/[A-G](#|b)?/g,n=>{const normalized=flatToSharp[n]||n,index=notes.indexOf(normalized);return index<0?n:notes[(index+steps+notes.length)%notes.length]})}
function transposeChordLine(line,steps){return line.split(/(\s+)/).map(part=>/\s+/.test(part)?part:part.split("/").map(c=>transposeChord(c,steps)).join("/")).join("")}

/* Chord detection: accepts common chord names and slash chords. */
const chordTokenPattern=/^(?:N\.?C\.?|[A-G](?:#|b)?(?:(?:maj|min|m|M|dim|aug|sus|add)?(?:2|4|5|6|7|9|11|13)?(?:\([^)]*\))?)?(?:\/[A-G](?:#|b)?)?)$/i;
function cleanChordToken(token){return token.replace(/^[|:,(]+|[|:,.);]+$/g,"")}
function isSectionLine(line){return /^\s*\[[^\]]+\]\s*$/.test(line)}
function isChordLine(line){
  const trimmed=line.trim();
  if(!trimmed||isSectionLine(trimmed))return false;
  const tokens=trimmed.split(/\s+/).map(cleanChordToken).filter(Boolean);
  if(!tokens.length)return false;
  const valid=tokens.filter(token=>chordTokenPattern.test(token));
  if(valid.length!==tokens.length)return false;
  return tokens.length>=2||trimmed.length<=10;
}

function parseSongText(text){
  const lines=text.replace(/\r/g,"").split("\n");
  const sections=[];let current={name:"Song",lines:[]};
  const pushSection=()=>{if(current.lines.length){sections.push(current);current={name:"Song",lines:[]}}};
  for(let i=0;i<lines.length;i++){
    const line=lines[i],trimmed=line.trim();
    if(isSectionLine(line)){pushSection();current={name:trimmed.slice(1,-1).trim(),lines:[]};continue}
    if(!trimmed)continue;
    if(isChordLine(line)){
      const next=lines[i+1]??"";
      if(next.trim()&&!isChordLine(next)&&!isSectionLine(next)){current.lines.push({chords:line,lyrics:next});i++}
      else{current.lines.push({chords:line,lyrics:""})}
    }else current.lines.push({chords:"",lyrics:line});
  }
  pushSection();return sections;
}


/* =========================================================
   GUITAR CHORD DIAGRAMS
   frets: -1 = muted string, 0 = open string, 1+ = fret number
   The strings are ordered from low E to high E.
   ========================================================= */
const chordDiagrams={
  C:{frets:[-1,3,2,0,1,0],fingers:[0,3,2,0,1,0]},
  Cm:{frets:[-1,3,5,5,4,3],fingers:[0,1,3,4,2,1],baseFret:3},
  C7:{frets:[-1,3,2,3,1,0],fingers:[0,3,2,4,1,0]},
  Cmaj7:{frets:[-1,3,2,0,0,0],fingers:[0,3,2,0,0,0]},
  Csus2:{frets:[-1,3,0,0,1,3],fingers:[0,2,0,0,1,3]},
  Csus4:{frets:[-1,3,3,0,1,1],fingers:[0,3,4,0,1,1]},
  D:{frets:[-1,-1,0,2,3,2],fingers:[0,0,0,1,3,2]},
  Dm:{frets:[-1,-1,0,2,3,1],fingers:[0,0,0,2,3,1]},
  D7:{frets:[-1,-1,0,2,1,2],fingers:[0,0,0,2,1,3]},
  Dmaj7:{frets:[-1,-1,0,2,2,2],fingers:[0,0,0,1,1,1]},
  Dsus2:{frets:[-1,-1,0,2,3,0],fingers:[0,0,0,1,2,0]},
  Dsus4:{frets:[-1,-1,0,2,3,3],fingers:[0,0,0,1,3,4]},
  E:{frets:[0,2,2,1,0,0],fingers:[0,2,3,1,0,0]},
  Em:{frets:[0,2,2,0,0,0],fingers:[0,2,3,0,0,0]},
  E7:{frets:[0,2,0,1,0,0],fingers:[0,2,0,1,0,0]},
  Emaj7:{frets:[0,2,1,1,0,0],fingers:[0,3,1,2,0,0]},
  Esus4:{frets:[0,2,2,2,0,0],fingers:[0,1,2,3,0,0]},
  F:{frets:[1,3,3,2,1,1],fingers:[1,3,4,2,1,1]},
  Fm:{frets:[1,3,3,1,1,1],fingers:[1,3,4,1,1,1]},
  F7:{frets:[1,3,1,2,1,1],fingers:[1,3,1,2,1,1]},
  Fmaj7:{frets:[-1,-1,3,2,1,0],fingers:[0,0,3,2,1,0]},
  G:{frets:[3,2,0,0,0,3],fingers:[2,1,0,0,0,3]},
  Gm:{frets:[3,5,5,3,3,3],fingers:[1,3,4,1,1,1],baseFret:3},
  G7:{frets:[3,2,0,0,0,1],fingers:[3,2,0,0,0,1]},
  Gmaj7:{frets:[3,2,0,0,0,2],fingers:[3,2,0,0,0,1]},
  Gsus4:{frets:[3,3,0,0,1,3],fingers:[2,3,0,0,1,4]},
  A:{frets:[-1,0,2,2,2,0],fingers:[0,0,1,2,3,0]},
  Am:{frets:[-1,0,2,2,1,0],fingers:[0,0,2,3,1,0]},
  A7:{frets:[-1,0,2,0,2,0],fingers:[0,0,2,0,3,0]},
  Amaj7:{frets:[-1,0,2,1,2,0],fingers:[0,0,2,1,3,0]},
  Asus2:{frets:[-1,0,2,2,0,0],fingers:[0,0,1,2,0,0]},
  Asus4:{frets:[-1,0,2,2,3,0],fingers:[0,0,1,2,3,0]},
  B:{frets:[-1,2,4,4,4,2],fingers:[0,1,2,3,4,1],baseFret:2},
  Bm:{frets:[-1,2,4,4,3,2],fingers:[0,1,3,4,2,1],baseFret:2},
  B7:{frets:[-1,2,1,2,0,2],fingers:[0,2,1,3,0,4]},
  Bmaj7:{frets:[-1,2,4,3,4,2],fingers:[0,1,3,2,4,1],baseFret:2},
  Bb:{frets:[-1,1,3,3,3,1],fingers:[0,1,2,3,4,1]},
  Bbm:{frets:[-1,1,3,3,2,1],fingers:[0,1,3,4,2,1]},
  Bb7:{frets:[-1,1,3,1,3,1],fingers:[0,1,3,1,4,1]}
};
const diagramAliases={
  "A#":"Bb","A#m":"Bbm","A#7":"Bb7",
  "A#maj7":"Bbmaj7","A#m7":"Bbm7"
};

/*
  Movable barre-chord templates let the site create diagrams for every
  sharp and flat root. The numbers are fret offsets from the root fret.
*/
const movableChordTemplates={
  "":{offsets:[0,2,2,1,0,0],fingers:[1,3,4,2,1,1]},
  m:{offsets:[0,2,2,0,0,0],fingers:[1,3,4,1,1,1]},
  7:{offsets:[0,2,0,1,0,0],fingers:[1,3,1,2,1,1]},
  maj7:{offsets:[0,2,1,1,0,0],fingers:[1,4,2,3,1,1]},
  m7:{offsets:[0,2,0,0,0,0],fingers:[1,3,1,1,1,1]},
  sus2:{offsets:[0,2,4,4,0,0],fingers:[1,2,3,4,1,1]},
  sus4:{offsets:[0,2,2,2,0,0],fingers:[1,2,3,4,1,1]},
  5:{offsets:[0,2,2,-1,-1,-1],fingers:[1,3,4,0,0,0]},
  6:{offsets:[0,2,2,1,2,0],fingers:[1,3,4,2,4,1]},
  m6:{offsets:[0,2,2,0,2,0],fingers:[1,3,4,1,2,1]},
  9:{offsets:[0,2,0,1,2,0],fingers:[1,3,1,2,4,1]},
  add9:{offsets:[0,2,2,1,0,2],fingers:[1,3,4,2,1,4]},
  dim:{offsets:[0,1,2,0,2,0],fingers:[1,2,4,1,3,1]},
  aug:{offsets:[0,3,2,1,1,0],fingers:[1,4,3,2,2,1]}
};

const noteToLowEFret={
  E:0,F:1,"F#":2,G:3,"G#":4,A:5,"A#":6,B:7,C:8,"C#":9,D:10,"D#":11,
  Gb:2,Ab:4,Bb:6,Db:9,Eb:11
};
let chordTooltip=null;

function normalizeDiagramChord(chord){
  let value=chord.replace(/[()]/g,"").split("/")[0].trim();
  value=value
    .replace(/^([A-G][#b]?)min/i,"$1m")
    .replace(/^([A-G][#b]?)M7$/,"$1maj7")
    .replace(/^([A-G][#b]?)minor7$/i,"$1m7")
    .replace(/^([A-G][#b]?)major7$/i,"$1maj7");
  return diagramAliases[value]||value;
}

function generateMovableChordShape(chord){
  const match=chord.match(/^([A-G](?:#|b)?)(maj7|m7|sus2|sus4|add9|dim|aug|m6|6|9|7|5|m)?$/i);
  if(!match)return null;

  const root=match[1][0].toUpperCase()+match[1].slice(1);
  let quality=(match[2]||"").toLowerCase();
  if(quality==="maj7")quality="maj7";
  const template=movableChordTemplates[quality];
  const rootFret=noteToLowEFret[root];
  if(!template||rootFret===undefined)return null;

  /* Open E-family chords already have clearer hand-written diagrams. */
  const effectiveRootFret=rootFret===0?12:rootFret;
  const frets=template.offsets.map(offset=>offset<0?-1:effectiveRootFret+offset);
  return {frets,fingers:template.fingers,baseFret:effectiveRootFret};
}

function getChordDiagramShape(chord){
  const normalized=normalizeDiagramChord(chord);
  return {normalized,shape:chordDiagrams[normalized]||generateMovableChordShape(normalized)};
}

function buildChordSvg(chord){
  const {normalized,shape}=getChordDiagramShape(chord);
  if(!shape)return `<div class="chord-diagram-unavailable">A diagram for <strong>${escapeHtml(chord)}</strong> is not available yet.</div>`;
  const width=150,height=172,left=31,top=30,stringGap=18,fretGap=24;
  const base=shape.baseFret||1;
  let svg=`<svg class="chord-diagram-svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Guitar chord diagram for ${escapeHtml(chord)}">`;
  for(let i=0;i<6;i++){const x=left+i*stringGap;svg+=`<line class="grid" x1="${x}" y1="${top}" x2="${x}" y2="${top+5*fretGap}"/>`}
  for(let i=0;i<=5;i++){const y=top+i*fretGap;svg+=`<line class="${i===0&&base===1?'nut':'grid'}" x1="${left}" y1="${y}" x2="${left+5*stringGap}" y2="${y}"/>`}
  if(base>1)svg+=`<text class="fret-label" x="15" y="${top+16}">${base}fr</text>`;
  shape.frets.forEach((fret,i)=>{const x=left+i*stringGap;if(fret===-1)svg+=`<text class="marker" x="${x}" y="17">×</text>`;else if(fret===0)svg+=`<text class="marker" x="${x}" y="17">○</text>`;else{const displayed=fret-base+1,y=top+(displayed-.5)*fretGap;svg+=`<circle class="finger" cx="${x}" cy="${y}" r="8"/>`;const finger=shape.fingers?.[i];if(finger)svg+=`<text class="finger-number" x="${x}" y="${y+.5}">${finger}</text>`}});
  svg+=`</svg>`;return svg;
}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]))}
function ensureChordTooltip(){if(chordTooltip)return chordTooltip;chordTooltip=document.createElement("div");chordTooltip.className="chord-diagram-tooltip";chordTooltip.setAttribute("role","tooltip");document.body.append(chordTooltip);return chordTooltip}
function showChordTooltip(target){
  const chord=target.dataset.chord,tooltip=ensureChordTooltip();
  tooltip.innerHTML=`<div class="chord-tooltip-heading"><strong>${escapeHtml(chord)}</strong><span>Guitar chord</span></div>${buildChordSvg(chord)}<p class="chord-diagram-note">Numbers indicate suggested fingers. ○ means open; × means muted.</p>`;
  tooltip.classList.add("visible");positionChordTooltip(target,tooltip);
}
function positionChordTooltip(target,tooltip){
  const rect=target.getBoundingClientRect(),gap=10,tw=tooltip.offsetWidth,th=tooltip.offsetHeight;
  let left=rect.left+rect.width/2-tw/2,top=rect.top-th-gap;
  left=Math.max(8,Math.min(left,window.innerWidth-tw-8));
  if(top<8)top=rect.bottom+gap;
  if(top+th>window.innerHeight-8)top=Math.max(8,window.innerHeight-th-8);
  tooltip.style.left=`${left}px`;tooltip.style.top=`${top}px`;
}
function hideChordTooltip(){if(chordTooltip)chordTooltip.classList.remove("visible")}
function appendInteractiveChordLine(element,line){
  const transposed=transposeChordLine(line,transposeSteps),parts=transposed.split(/(\s+)/);
  parts.forEach(part=>{if(!part)return;if(/^\s+$/.test(part)){element.append(document.createTextNode(part));return}const cleaned=cleanChordToken(part);if(chordTokenPattern.test(cleaned)&&!/^N\.?C\.?$/i.test(cleaned)){const span=document.createElement("span");span.className="chord-token";span.tabIndex=0;span.dataset.chord=cleaned;span.textContent=part;span.addEventListener("mouseenter",()=>showChordTooltip(span));span.addEventListener("mouseleave",hideChordTooltip);span.addEventListener("focus",()=>showChordTooltip(span));span.addEventListener("blur",hideChordTooltip);span.addEventListener("click",event=>{event.stopPropagation();showChordTooltip(span)});element.append(span)}else element.append(document.createTextNode(part))});
}
document.addEventListener("click",event=>{if(!event.target.closest(".chord-token"))hideChordTooltip()});
window.addEventListener("scroll",hideChordTooltip,true);window.addEventListener("resize",hideChordTooltip);

function songToPlainText(song){return song.sections.map(section=>`[${section.name}]\n`+section.lines.map(line=>line.chords?`${line.chords}\n${line.lyrics}`:line.lyrics).join("\n")).join("\n\n")}
function saveCustomSongs(){localStorage.setItem("simpleChordsSongs",JSON.stringify(songs.filter(song=>!song.isBuiltIn)))}

function renderSongList(filtered=songs){songList.innerHTML="";songCount.textContent=`${filtered.length} song${filtered.length===1?"":"s"}`;emptyMessage.hidden=filtered.length!==0;filtered.forEach(song=>{const button=document.createElement("button");button.type="button";button.className="song-card"+(song.id===selectedSongId?" active":"");const strong=document.createElement("strong"),span=document.createElement("span");strong.textContent=song.title;span.textContent=`${song.artist} · Key of ${song.originalKey}`;button.append(strong,span);button.onclick=()=>{selectedSongId=song.id;transposeSteps=0;renderSongList(filtered);renderSelectedSong()};songList.append(button)})}
function renderSelectedSong(){const song=songs.find(s=>s.id===selectedSongId);if(!song)return;songArtist.textContent=song.artist;songTitle.textContent=song.title;songKey.textContent=`Key: ${transposeChord(song.originalKey,transposeSteps)}`;songDifficulty.textContent=song.difficulty;songCategory.textContent=song.category;transposeValue.textContent=transposeSteps>0?`+${transposeSteps}`:transposeSteps;deleteSongButton.hidden=!!song.isBuiltIn;songContent.innerHTML="";song.sections.forEach(section=>{const sectionEl=document.createElement("section");sectionEl.className="song-section";const heading=document.createElement("h3");heading.textContent=section.name;sectionEl.append(heading);section.lines.forEach(line=>{const wrap=document.createElement("div"),chord=document.createElement("p"),lyric=document.createElement("p");wrap.className="lyric-line";chord.className="chord-line";lyric.className="lyrics-line";appendInteractiveChordLine(chord,line.chords);lyric.textContent=line.lyrics;wrap.append(chord,lyric);sectionEl.append(wrap)});songContent.append(sectionEl)});updateFavoriteButton()}
function updateFavoriteButton(){const active=favoriteSongs.includes(selectedSongId);favoriteButton.classList.toggle("active",active);favoriteButton.textContent=active?"♥ Favorited":"♡ Favorite"}

function updateEditorVisuals(){
  const lines=editorSongText.value.replace(/\r/g,"").split("\n");
  lineNumbers.textContent=lines.map((_,i)=>i+1).join("\n");
  editorLivePreview.innerHTML="";let count=0;
  lines.forEach(line=>{const div=document.createElement("div");div.className="preview-line";if(isSectionLine(line))div.classList.add("section-line");else if(isChordLine(line)){div.classList.add("detected-chord");count++}else if(!line.trim())div.classList.add("blank-line");div.textContent=line||" ";editorLivePreview.append(div)});
  detectedChordCount.textContent=count;
}
function openEditor(song=null){songForm.reset();editorMessage.textContent="";if(song){editorTitle.textContent="Edit song";editingSongId.value=song.id;editorSongTitle.value=song.title;editorArtist.value=song.artist;editorKey.value=song.originalKey;editorDifficulty.value=song.difficulty;editorCategory.value=song.category;editorSongText.value=songToPlainText(song)}else{editorTitle.textContent="Add a new song";editingSongId.value="";editorKey.value="G";editorDifficulty.value="Beginner";editorCategory.value="Worship";editorSongText.value=`[Verse 1]\nG                 C        G\nAmazing grace, how sweet the sound\nG                         D\nThat saved a wretch like me\n\n[Chorus]\nG          C\nType chords above the lyrics here`}
  updateEditorVisuals();editorModal.hidden=false;document.body.style.overflow="hidden";setTimeout(()=>editorSongTitle.focus(),0)}
function closeEditor(){editorModal.hidden=true;document.body.style.overflow=""}

songForm.addEventListener("submit",event=>{event.preventDefault();const sections=parseSongText(editorSongText.value);if(!sections.length){editorMessage.textContent="Please enter at least one lyric line.";return}const existingId=Number(editingSongId.value),data={id:existingId||Date.now(),title:editorSongTitle.value.trim(),artist:editorArtist.value.trim(),originalKey:editorKey.value,difficulty:editorDifficulty.value,category:editorCategory.value.trim()||"Other",isBuiltIn:false,sections};if(existingId){const index=songs.findIndex(s=>s.id===existingId);if(index!==-1)songs[index]=data}else songs.push(data);saveCustomSongs();selectedSongId=data.id;transposeSteps=0;renderSongList();renderSelectedSong();closeEditor()});
$("openEditorButton").onclick=()=>openEditor();$("closeEditorButton").onclick=closeEditor;$("cancelEditorButton").onclick=closeEditor;document.querySelector("[data-close-editor]").onclick=closeEditor;$("editSongButton").onclick=()=>openEditor(songs.find(s=>s.id===selectedSongId));
deleteSongButton.onclick=()=>{const song=songs.find(s=>s.id===selectedSongId);if(!song||song.isBuiltIn)return;if(confirm(`Delete “${song.title}”?`)){songs=songs.filter(s=>s.id!==selectedSongId);saveCustomSongs();selectedSongId=songs[0].id;renderSongList();renderSelectedSong()}};
editorSongText.addEventListener("input",updateEditorVisuals);editorSongText.addEventListener("scroll",()=>{lineNumbers.scrollTop=editorSongText.scrollTop;editorLivePreview.scrollTop=editorSongText.scrollTop});
editorSongText.addEventListener("keydown",event=>{if(event.key==="Tab"){event.preventDefault();const start=editorSongText.selectionStart,end=editorSongText.selectionEnd;editorSongText.setRangeText("    ",start,end,"end");updateEditorVisuals()}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="s"){event.preventDefault();songForm.requestSubmit()}if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==="f"){event.preventDefault();$("findReplacePanel").hidden=false;$("findText").focus()}});
$("insertTemplateButton").onclick=()=>{const template=`[Verse 1]\nG                 C\nWrite the first lyric line here\nG                         D\nWrite the second lyric line here\n\n[Chorus]\nC                 G\nWrite the chorus here`;const start=editorSongText.selectionStart;editorSongText.setRangeText(template,start,editorSongText.selectionEnd,"end");updateEditorVisuals();editorSongText.focus()};
$("findReplaceButton").onclick=()=>{$("findReplacePanel").hidden=!$("findReplacePanel").hidden;if(!$("findReplacePanel").hidden)$("findText").focus()};
$("replaceAllButton").onclick=()=>{const find=$("findText").value;if(!find)return;editorSongText.value=editorSongText.value.split(find).join($("replaceText").value);updateEditorVisuals()};
$("hotKeysButton").onclick=()=>$("hotKeysModal").hidden=false;$("closeHotKeysButton").onclick=()=>$("hotKeysModal").hidden=true;

searchInput.oninput=()=>{const q=searchInput.value.toLowerCase().trim();renderSongList(songs.filter(s=>s.title.toLowerCase().includes(q)||s.artist.toLowerCase().includes(q)))};
$("transposeDown").onclick=()=>{transposeSteps--;renderSelectedSong()};$("transposeUp").onclick=()=>{transposeSteps++;renderSelectedSong()};
$("fontDown").onclick=()=>{if(songFontSize>14){songFontSize-=2;document.documentElement.style.setProperty("--song-font-size",`${songFontSize}px`)}};$("fontUp").onclick=()=>{if(songFontSize<30){songFontSize+=2;document.documentElement.style.setProperty("--song-font-size",`${songFontSize}px`)}};
$("chordsButton").onclick=()=>{chordsAreVisible=!chordsAreVisible;songContent.classList.toggle("hide-chords",!chordsAreVisible);$("chordsButton").textContent=chordsAreVisible?"Hide chords":"Show chords"};
favoriteButton.onclick=()=>{const index=favoriteSongs.indexOf(selectedSongId);index===-1?favoriteSongs.push(selectedSongId):favoriteSongs.splice(index,1);localStorage.setItem("favoriteSongs",JSON.stringify(favoriteSongs));updateFavoriteButton()};
$("themeButton").onclick=()=>{document.body.classList.toggle("dark-mode");const dark=document.body.classList.contains("dark-mode");$("themeButton").textContent=dark?"☀️":"🌙";localStorage.setItem("simpleChordsTheme",dark?"dark":"light")};
if(localStorage.getItem("simpleChordsTheme")==="dark"){document.body.classList.add("dark-mode");$("themeButton").textContent="☀️"}
$("year").textContent=new Date().getFullYear();renderSongList();renderSelectedSong();
