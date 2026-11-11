/* Migraine Diary Lovelace card — initial prototype.
 * Resource: /local/migraine-diary/migraine-diary-card.js
 * SVG: /local/migraine-diary/head.svg (bundled in frontend/head.svg).
 */
const WORDS = {
  lb: {title:"Migränendagbuch",start:"Ufank",end:"Enn",premonition:"Virzeechen",pain:"Schmäerzintensitéit",zones:"Schmäerzberäicher",symptoms:"Symptomer",medications:"Medikamenter",record:"Schmäerz späicheren",noEpisode:"Keen aktiven Ufall",active:"Ufall ass aktiv",error:"Feeler",nausea:"Iwwelzegkeet",vomiting:"Erbriechen",light:"Liichtempfindlechkeet",noise:"Kaméidiempfindlechkeet",neck:"Halswéi",dizzy:"Schwindel",blur:"Onschaarf Siicht",fatigue:"Middegkeet"},
  en: {title:"Migraine Diary",start:"Start",end:"End",premonition:"Premonition",pain:"Pain intensity",zones:"Pain locations",symptoms:"Symptoms",medications:"Medications",record:"Update state",noEpisode:"No active episode",active:"Episode active",error:"Error",nausea:"Nausea",vomiting:"Vomiting",light:"Light sensitivity",noise:"Sound sensitivity",neck:"Neck pain",dizzy:"Dizziness",blur:"Blurred vision",fatigue:"Fatigue"},
  ru: {title:"Дневник мигрени",start:"Начало",end:"Конец",premonition:"Предчувствие",pain:"Интенсивность боли",zones:"Зоны боли",symptoms:"Симптомы",medications:"Лекарства",record:"Обновить состояние",noEpisode:"Нет активного приступа",active:"Приступ активен",error:"Ошибка",nausea:"Тошнота",vomiting:"Рвота",light:"Светочувствительность",noise:"Чувствительность к шуму",neck:"Боль в шее",dizzy:"Головокружение",blur:"Нечёткое зрение",fatigue:"Усталость"},
  fr: {title:"Journal de migraine",start:"Début",end:"Fin",premonition:"Signes précurseurs",pain:"Intensité de la douleur",zones:"Zones douloureuses",symptoms:"Symptômes",medications:"Médicaments",record:"Enregistrer la douleur",noEpisode:"Aucune crise active",active:"Crise en cours",error:"Erreur",nausea:"Nausée",vomiting:"Vomissements",light:"Sensibilité à la lumière",noise:"Sensibilité au bruit",neck:"Douleur cervicale",dizzy:"Vertiges",blur:"Vision floue",fatigue:"Fatigue"},
  de: {title:"Migränetagebuch",start:"Beginn",end:"Ende",premonition:"Vorboten",pain:"Schmerzstärke",zones:"Schmerzzonen",symptoms:"Symptome",medications:"Medikamente",record:"Schmerz speichern",noEpisode:"Kein aktiver Anfall",active:"Anfall läuft",error:"Fehler",nausea:"Übelkeit",vomiting:"Erbrechen",light:"Lichtempfindlichkeit",noise:"Geräuschempfindlichkeit",neck:"Nackenschmerzen",dizzy:"Schwindel",blur:"Verschwommenes Sehen",fatigue:"Müdigkeit"},
  it: {title:"Diario dell'emicrania",start:"Inizio",end:"Fine",premonition:"Sintomi premonitori",pain:"Intensità del dolore",zones:"Zone dolorose",symptoms:"Sintomi",medications:"Farmaci",record:"Registra dolore",noEpisode:"Nessun attacco attivo",active:"Attacco in corso",error:"Errore",nausea:"Nausea",vomiting:"Vomito",light:"Sensibilità alla luce",noise:"Sensibilità ai suoni",neck:"Dolore al collo",dizzy:"Vertigini",blur:"Vista offuscata",fatigue:"Stanchezza"}
};
const SECTION_IDS=["actions","zones","intensity","symptoms","medications"];
const DEFAULT_SECTION_ORDER=[...SECTION_IDS];
const DEFAULT_LABELS={title:true,zones:true,intensity:true,symptoms:true,medications:true};
const SYMPTOMS=["Сильная ударная боль","Пульсирующая боль","Пульсирующая периодическая боль","Усиливается при движении","Тошнота","Рвота","Светочувствительность","Чувствительность к шуму","Боль в шее","Головокружение","Насморк","Бессонница","Подавленное настроение","Тревожность","Чувствительность к запахам","Жар / ощущение жара","Звон в ушах","Усталость","Расплывчатое зрение","Перепады настроения"];
class MigraineDiaryCard extends HTMLElement {
  setConfig(config) {
    this._config = {button_font_size:10, button_icon_size:20, action_font_size:14, action_icon_size:20, use_ha_helpers:true, profile_id:"patient", svg_url:"/local/migraine-diary/head.svg", medications:["Migreaout","Maxalt","Exedryn","Nurofen"], show_labels:true, section_order:DEFAULT_SECTION_ORDER, section_gap:16, action_columns:4, symptom_columns:5, medication_columns:5, action_display:"both", symptom_display:"both", medication_display:"both", action_button_color:"", action_icon_color:"", medication_button_color:"", medication_icon_color:"", ...config};
    for(const key of ["button_font_size","button_icon_size","action_font_size","action_icon_size"]){
      const value=Number(this._config[key]);
      if(!Number.isFinite(value)||value<6||value>64)throw new Error(key+" must be 6–64 pixels");
      this._config[key]=value;
    }
    if (!Array.isArray(this._config.medications)) throw new Error("medications must be an array");
    if(!Array.isArray(this._config.section_order) || this._config.section_order.length!==SECTION_IDS.length || new Set(this._config.section_order).size!==SECTION_IDS.length || this._config.section_order.some(id=>!SECTION_IDS.includes(id)))throw Error("section_order must contain actions, zones, intensity, symptoms, medications exactly once");
    if(typeof this._config.show_labels==="object" && (this._config.show_labels===null || Array.isArray(this._config.show_labels)))throw Error("show_labels must be a boolean or an object");
    for(const key of ["action_columns","symptom_columns","medication_columns"]){const n=Number(this._config[key]);if(!Number.isInteger(n)||n<1||n>12)throw Error(key+" must be an integer from 1 to 12");this._config[key]=n;}
    const gap=Number(this._config.section_gap);if(!Number.isFinite(gap)||gap<0||gap>100)throw Error("section_gap must be 0–100");this._config.section_gap=gap;
    for(const key of ["action_display","symptom_display","medication_display"]){if(!["both","icon","label"].includes(this._config[key]))throw Error(key+" must be both, icon or label");}
    for(const key of ["action_button_color","action_icon_color","medication_button_color","medication_icon_color"]){const color=this._config[key];if(typeof color!=="string" || (color && !CSS.supports("color",color)))throw Error("Invalid CSS color: "+key);}
    this._zones = new Set(); this._symptoms = new Set(); this._intensity = 5;
    this._loadedAssessmentKey = null;
    this._draftRestoredKey = null;
    this._busy = false; this._svgLoaded = false;
    if(!this.shadowRoot)this.attachShadow({mode:"open"});
    this._loadSvg();
    this._render();
  }
  set hass(hass) {
    this._hass=hass;
    const entity=hass?.states?.[this._config?.active_entity || "binary_sensor.migren"];
    if(this._config?.use_ha_helpers){
      this._zones=new Set(Array.from({length:19},(_,i)=>i+1).filter(i=>hass?.states?.["switch.migraine_zone_"+i]?.state==="on"));
      this._symptoms=new Set(SYMPTOMS.filter((_,i)=>hass?.states?.["switch.migrene_sypptome"+(i+1)]?.state==="on"));
      const level=Number(hass?.states?.["number.migraine_level"]?.state);
      if(Number.isInteger(level)&&level>=1&&level<=9)this._intensity=level;
    }else{
      const assessment=entity?.attributes?.latest_pain;
      const key=entity?.state==="on" ? entity?.attributes?.episode_id + ":" + (assessment?.occurred_at || "none") : "off";
      if(key !== this._loadedAssessmentKey){
        this._loadedAssessmentKey=key;
        if(assessment && entity?.state==="on"){
          this._zones=new Set(Array.isArray(assessment.zones)?assessment.zones:[]);
          this._symptoms=new Set(Array.isArray(assessment.symptoms)?assessment.symptoms:[]);
          this._intensity=assessment.intensity>=1 && assessment.intensity<=9 ? assessment.intensity : 5;
        }
      }
    }
    if(this._pendingActive !== undefined && this._entityActive() === this._pendingActive) this._pendingActive=undefined;
    if(this.shadowRoot)this._render();
  }
  getCardSize(){return 9;}
  async _toggleZone(i){
    if(!this._config.use_ha_helpers){this._zones.has(i)?this._zones.delete(i):this._zones.add(i);this._render();return;}
    const entity_id="switch.migraine_zone_"+i;
    await this._hass.callService("switch","toggle",{entity_id});
  }
  async _toggleSymptom(i){
    if(!this._config.use_ha_helpers){const name=SYMPTOMS[i-1];this._symptoms.has(name)?this._symptoms.delete(name):this._symptoms.add(name);this._render();return;}
    await this._hass.callService("switch","toggle",{entity_id:"switch.migrene_sypptome"+i});
  }
  async _setLevel(i){
    if(!this._config.use_ha_helpers){this._intensity=i;this._render();return;}
    await this._hass.callService("number","set_value",{entity_id:"number.migraine_level",value:i});
  }
  _draftKey(){
    return "migraine-diary:draft:"+this._config.profile_id+":"+(this._config.active_entity || "binary_sensor.migren");
  }
  _saveDraft(){
    try {
      const entity=this._hass?.states?.[this._config.active_entity || "binary_sensor.migren"];
      const episodeId=entity?.attributes?.episode_id;
      if(entity?.state!=="on" || !episodeId)return;
      localStorage.setItem(this._draftKey(),JSON.stringify({
        episode_id:episodeId,zones:[...this._zones],symptoms:[...this._symptoms],intensity:this._intensity
      }));
    } catch(_error){}
  }
  _restoreDraft(key){
    if(this._draftRestoredKey===key)return;
    this._draftRestoredKey=key;
    try {
      const entity=this._hass?.states?.[this._config.active_entity || "binary_sensor.migren"];
      if(entity?.state==="off"){localStorage.removeItem(this._draftKey());return;}
      if(entity?.state!=="on" || !entity?.attributes?.episode_id)return;
      const draft=JSON.parse(localStorage.getItem(this._draftKey()) || "null");
      if(!draft || draft.episode_id!==entity.attributes.episode_id)return;
      this._zones=new Set((draft.zones || []).filter(n=>Number.isInteger(n)&&n>=1&&n<=19));
      this._symptoms=new Set((draft.symptoms || []).filter(s=>SYMPTOMS.includes(s)));
      if(Number.isInteger(draft.intensity)&&draft.intensity>=1&&draft.intensity<=9)this._intensity=draft.intensity;
    }catch(_error){}
  }

  _language() {
    const lang=(this._config.language || this._hass?.locale?.language || this._hass?.language || "en").toLowerCase().split("-")[0];
    return WORDS[lang] ? lang : "en";
  }
  _t(key){return WORDS[this._language()][key] || key;}
  _entityActive() {
    const entity=this._config.active_entity || "binary_sensor.migren";
    const state=this._hass?.states?.[entity];
    return !!state && state.state === "on";
  }
  _active(){return this._pendingActive !== undefined ? this._pendingActive : this._entityActive();}
  async _loadSvg(){
    try {
      const response=await fetch(this._config.svg_url,{credentials:"same-origin"});
      if(!response.ok) throw new Error("SVG HTTP "+response.status);
      const raw=await response.text();
      const doc=new DOMParser().parseFromString(raw,"image/svg+xml");
      if(doc.querySelector("parsererror")) throw new Error("Invalid SVG");
      const root=doc.documentElement;
      if(root.localName !== "svg") throw new Error("Not an SVG");
      // SVG is bundled by the project/user, never accept arbitrary remote SVG.
      if(/^https?:\/\//i.test(this._config.svg_url)) throw new Error("Only local SVG paths allowed");
      root.querySelectorAll("script,foreignObject,iframe,object,embed").forEach(n=>n.remove());
      root.querySelectorAll("*").forEach(node=>{
        [...node.attributes].forEach(attr=>{
          if(/^on/i.test(attr.name) || (/^(href|xlink:href)$/i.test(attr.name) && !attr.value.startsWith("#"))) node.removeAttribute(attr.name);
        });
      });
      this._svgMarkup=new XMLSerializer().serializeToString(root);
      this._svgLoaded=true;
    } catch(error) {this._svgLoaded=false; this._svgError=String(error);}
    this._render();
  }
  _button(label, action, disabled=false, active=false) {
    const btn=document.createElement("button");btn.textContent=label;
    btn.disabled=disabled || this._busy; if(active)btn.classList.add("selected");
    btn.addEventListener("click",action);return btn;
  }
  _tile(label,iconName,display,action,disabled=false,className=""){
    const btn=document.createElement("button");btn.type="button";btn.className="tile-btn "+className;
    btn.disabled=disabled||this._busy;btn.setAttribute("aria-label",label);btn.title=label;
    const category=className==="action-btn"?"action":"medication";
    if(["action-btn","medication-btn"].includes(className)){
      const background=this._config[category+"_button_color"];
      const iconColor=this._config[category+"_icon_color"];
      if(background)btn.style.backgroundColor=background;
      if(iconColor)btn.style.setProperty("--tile-icon-color",iconColor);
    }
    if(display!=="label"){const icon=document.createElement("ha-icon");icon.setAttribute("icon",iconName);btn.append(icon);}
    if(display!=="icon"){const span=document.createElement("span");span.textContent=label;btn.append(span);}
    btn.addEventListener("click",action);return btn;
  }
  async _call(service,data) {
    if(this._busy || !this._hass) return;
    this._busy=true;this._message="";this._render();
    try {
      await this._hass.callService("migraine_diary",service,{profile_id:this._config.profile_id,...data});
      // Update controls as soon as HA confirms the action; do not wait for
      // the state_changed websocket event (which may arrive seconds later).
      if(service==="start_episode" || service==="end_episode"){
        this._pendingActive=service==="start_episode";
        if(this._entityActive()===this._pendingActive)this._pendingActive=undefined;
      }
    }
    catch(e){
      this._pendingActive=undefined;
      this._message=this._t("error")+": "+(e?.message || String(e));
    }
    finally {this._busy=false;this._render();}
  }
  _showLabel(key){
    const value=this._config.show_labels;
    return typeof value==="boolean"?value:(value[key]??DEFAULT_LABELS[key]);
  }
  async _exportCsv(){
    if(this._busy||!this._hass)return;
    this._busy=true;this._message="";this._render();
    try{
      const params=new URLSearchParams({profile_id:this._config.profile_id,limit:"1000",format:"csv"});
      const token=this._hass.auth?.data?.access_token;
      if(!token)throw Error("Home Assistant access token unavailable");
      const response=await fetch("/api/migraine_diary/history?"+params.toString(),{headers:{Authorization:"Bearer "+token}});
      if(!response.ok)throw Error("CSV export HTTP "+response.status);
      const blob=await response.blob();const url=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=url;link.download="migraine-diary.csv";this.shadowRoot.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(error){this._message=this._t("error")+": "+(error?.message||String(error));}
    finally{this._busy=false;this._render();}
  }
  _render(){
    if(!this.shadowRoot || !this._config)return;
    const root=this.shadowRoot;root.replaceChildren();
    const style=document.createElement("style");style.textContent=`
      :host{display:block;color:var(--primary-text-color);--diary-section-gap:${this._config.section_gap}px;--diary-action-columns:${this._config.action_columns};--diary-symptom-columns:${this._config.symptom_columns};--diary-medication-columns:${this._config.medication_columns};--diary-button-font:${this._config.button_font_size}px;--diary-button-icon:${this._config.button_icon_size}px;--diary-action-font:${this._config.action_font_size}px;--diary-action-icon:${this._config.action_icon_size}px}
      ha-card{display:block;padding:16px}
      h2{font-size:1.2rem;margin:0 0 12px}
      h3{font-size:1rem;margin:14px 0 8px}
      .row{display:flex;gap:6px;flex-wrap:wrap}
      .section{margin:0 0 var(--diary-section-gap);min-width:0}
      .section:last-of-type{margin-bottom:0}
      .action-grid,.symptom-grid,.medication-grid{display:grid;gap:6px;min-width:0}
      .action-grid{grid-template-columns:repeat(var(--diary-action-columns),minmax(0,1fr))}
      .symptom-grid{grid-template-columns:repeat(var(--diary-symptom-columns),minmax(0,1fr))}
      .medication-grid{grid-template-columns:repeat(var(--diary-medication-columns),minmax(0,1fr))}
      button{font-size:var(--diary-action-font);background:var(--secondary-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:8px;padding:9px;cursor:pointer}
      button.selected{background:var(--primary-color);color:var(--text-primary-color,#fff)}
      button:disabled{opacity:.4;cursor:not-allowed}
      .map{max-width:480px;margin:auto}
      .map svg{width:100%;height:auto;max-height:370px}
      .map [id^="zone"]{cursor:pointer}
      .map .selected-zone{fill:rgba(220,65,65,.55)!important;stroke:#d33!important;stroke-width:1.4!important}
      .message{color:var(--error-color);margin-top:8px}
      .status{opacity:.8;margin:8px 0}

      .medication-btn{background:var(--secondary-background-color);color:var(--primary-text-color)}
      .medication-btn ha-icon{--mdc-icon-size:var(--diary-button-icon);width:var(--diary-button-icon);height:var(--diary-button-icon)}

      .tile-btn{height:60px;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;padding:6px 3px;border-radius:8px}
      .action-btn{background:var(--secondary-background-color)}
      .symptom-btn{background:rgb(0,255,0);color:#111;border:1px solid rgba(0,0,0,.16)}
      .symptom-btn.selected{background:rgb(255,0,0);color:#fff}
      .symptom-btn ha-icon,.action-btn ha-icon{--mdc-icon-size:var(--diary-button-icon);width:var(--diary-button-icon);height:var(--diary-button-icon);flex:none}
      .tile-btn ha-icon{color:var(--tile-icon-color,inherit)}
      .tile-btn span{font-size:var(--diary-button-font);line-height:1.12;white-space:normal;text-align:center;overflow-wrap:anywhere}
      .action-btn span{font-size:var(--diary-action-font)}
      `;
    root.append(style);
    const card=document.createElement("ha-card");root.append(card);
    const h=document.createElement("h2");h.textContent=this._t("title");if(this._showLabel("title"))card.append(h);
    const active=this._active();
    const status=document.createElement("div");status.className="status";status.textContent=this._t(active?"active":"noEpisode");card.append(status);
    const actions=document.createElement("div");actions.className="action-grid";
    actions.append(this._tile(this._t("start"),"mdi:play-circle-outline",this._config.action_display,()=>this._call("start_episode",{}),active,"action-btn"));
    actions.append(this._tile(this._t("end"),"mdi:stop-circle-outline",this._config.action_display,()=>this._call("end_episode",{episode_id:this._hass?.states?.[this._config.active_entity || "binary_sensor.migren"]?.attributes?.episode_id}),!active,"action-btn"));
    actions.append(this._tile(this._t("premonition"),"mdi:weather-lightning",this._config.action_display,()=>this._call("record_premonition",{symptoms:[...this._symptoms]}),active,"action-btn"));
    actions.append(this._tile(this._t("record"),"mdi:content-save-outline",this._config.action_display,()=>this._call("record_pain",{
      intensity:this._intensity,
      zones:[...this._zones].sort((a,b)=>a-b),
      symptoms:[...this._symptoms]
    }),!active,"action-btn"));
    const zonesHeading=document.createElement("h3");zonesHeading.textContent=this._t("zones");if(this._showLabel("zones"))card.append(zonesHeading);
    if(this._svgLoaded){
      const holder=document.createElement("div");holder.className="map";
      // The SVG comes from a local file; sanitized before DOM insertion.
      holder.innerHTML=this._svgMarkup;
      for(let i=1;i<=19;i++){
        const node=holder.querySelector("#zone"+i);
        if(!node)continue;
        if(this._zones.has(i))node.classList.add("selected-zone");
        node.addEventListener("click",event=>{
          event.preventDefault();event.stopPropagation();
          this._toggleZone(i);
        });
      }
      for(let i=1;i<=9;i++){
        const node=holder.querySelector("#b"+i);
        if(!node)continue;
        node.style.cursor="pointer";
        if(this._intensity===i){
          // Fill the selected intensity shape red; do not outline it.
          node.style.setProperty("fill","#ff0000","important");
          node.querySelectorAll("*").forEach(child=>{
            if(child instanceof SVGElement && !["defs","clipPath","mask"].includes(child.localName)){
              child.style.setProperty("fill","#ff0000","important");
            }
          });
        }
        node.addEventListener("click",event=>{
          event.preventDefault();event.stopPropagation();
          this._setLevel(i);
        });
      }
      card.append(holder);
    }else{
      const fallback=document.createElement("div");fallback.className="row";card.append(fallback);
      for(let i=1;i<=19;i++)fallback.append(this._button(String(i),()=>this._toggleZone(i),false,this._zones.has(i)));
    }
    const intensity=document.createElement("h3");intensity.textContent=this._t("pain")+" (1–9): "+this._intensity;if(this._showLabel("intensity"))card.append(intensity);
    const levels=document.createElement("div");levels.className="row";card.append(levels);
    if(!this._svgLoaded) for(let i=1;i<=9;i++)levels.append(this._button(String(i),()=>this._setLevel(i),false,this._intensity===i));
    const symptomHeading=document.createElement("h3");symptomHeading.textContent=this._t("symptoms");if(this._showLabel("symptoms"))card.append(symptomHeading);
    const symptoms=document.createElement("div");symptoms.className="symptom-grid";card.append(symptoms);
    for(let i=0;i<SYMPTOMS.length;i++){
      const enabled=this._symptoms.has(SYMPTOMS[i]);
      const btn=this._tile(SYMPTOMS[i],"mdi:head-flash",this._config.symptom_display,async()=>{
        btn.disabled=true;
        try{await this._toggleSymptom(i+1);}
        catch(error){this._message=this._t("error")+": "+(error?.message || String(error));this._render();}
        finally{btn.disabled=false;}
      },false,"symptom-btn");
      if(enabled)btn.classList.add("selected");
      btn.setAttribute("aria-pressed",String(enabled));
      symptoms.append(btn);
    }
    const medications=document.createElement("h3");medications.textContent=this._t("medications");if(this._showLabel("medications"))card.append(medications);
    const pills=document.createElement("div");pills.className="medication-grid";card.append(pills);
    for(const med of this._config.medications){
      const name=typeof med==="string"?med:med.name;
      const dose=typeof med==="string"?{}:{dose:med.dose,unit:med.unit};
      const payload={name};
      if(dose.dose!==undefined)payload.dose=dose.dose;
      if(dose.unit!==undefined)payload.unit=dose.unit;
      const btn=this._tile(name,"mdi:pill",this._config.medication_display,()=>this._call("record_medication",payload),false,"medication-btn");
      pills.append(btn);
    }
    // Assemble each logical section in its own wrapper, preserving spacing
    // even when all headings are hidden.
    const mapNode=Array.from(card.children).find(el=>el.classList?.contains("map"));
    const fallbackNode=!mapNode?Array.from(card.children).find(el=>el.classList?.contains("row")&&el!==levels):null;
    const sectionContents={
      actions:[actions],zones:[zonesHeading,mapNode||fallbackNode],
      intensity:[intensity,levels],symptoms:[symptomHeading,symptoms],
      medications:[medications,pills]
    };
    for(const key of this._config.section_order){
      const section=document.createElement("section");section.className="section";
      for(const node of sectionContents[key]){
        if(!node)continue;
        if(node===zonesHeading&&!this._showLabel("zones"))continue;
        if(node===intensity&&!this._showLabel("intensity"))continue;
        if(node===symptomHeading&&!this._showLabel("symptoms"))continue;
        if(node===medications&&!this._showLabel("medications"))continue;
        if(node===levels&&this._svgLoaded)continue;
        section.append(node);
      }
      card.append(section);
    }
    const exportButton=this._button("Экспорт CSV",()=>this._exportCsv());
    exportButton.style.marginTop="14px";card.append(exportButton);
    if(this._message){const msg=document.createElement("div");msg.className="message";msg.textContent=this._message;card.append(msg);}
  }
}
if(!customElements.get("migraine-diary-card"))customElements.define("migraine-diary-card",MigraineDiaryCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==="migraine-diary-card"))window.customCards.push({type:"migraine-diary-card",name:"Migraine Diary",description:"Headache diary with interactive pain map"});
