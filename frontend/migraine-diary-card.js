/* Migraine Diary Lovelace card — initial prototype.
 * Resource: /local/migraine-diary/migraine-diary-card.js
 * SVG: /local/migraine-diary/head.svg (bundled in frontend/head.svg).
 */
const WORDS = {
  lb: {title:"Migränendagbuch",start:"Ufank",end:"Enn",premonition:"Virzeechen",pain:"Schmäerzintensitéit",zones:"Schmäerzberäicher",symptoms:"Symptomer",medications:"Medikamenter",record:"Schmäerz späicheren",noEpisode:"Keen aktiven Ufall",active:"Ufall ass aktiv",error:"Feeler",nausea:"Iwwelzegkeet",vomiting:"Erbriechen",light:"Liichtempfindlechkeet",noise:"Kaméidiempfindlechkeet",neck:"Halswéi",dizzy:"Schwindel",blur:"Onschaarf Siicht",fatigue:"Middegkeet"},
  en: {title:"Migraine Diary",start:"Start",end:"End",premonition:"Premonition",pain:"Pain intensity",zones:"Pain locations",symptoms:"Symptoms",medications:"Medications",record:"Save pain",noEpisode:"No active episode",active:"Episode active",error:"Error",nausea:"Nausea",vomiting:"Vomiting",light:"Light sensitivity",noise:"Sound sensitivity",neck:"Neck pain",dizzy:"Dizziness",blur:"Blurred vision",fatigue:"Fatigue"},
  ru: {title:"Дневник мигрени",start:"Начало",end:"Конец",premonition:"Предчувствие",pain:"Интенсивность боли",zones:"Зоны боли",symptoms:"Симптомы",medications:"Лекарства",record:"Записать боль",noEpisode:"Нет активного приступа",active:"Приступ активен",error:"Ошибка",nausea:"Тошнота",vomiting:"Рвота",light:"Светочувствительность",noise:"Чувствительность к шуму",neck:"Боль в шее",dizzy:"Головокружение",blur:"Нечёткое зрение",fatigue:"Усталость"},
  fr: {title:"Journal de migraine",start:"Début",end:"Fin",premonition:"Signes précurseurs",pain:"Intensité de la douleur",zones:"Zones douloureuses",symptoms:"Symptômes",medications:"Médicaments",record:"Enregistrer la douleur",noEpisode:"Aucune crise active",active:"Crise en cours",error:"Erreur",nausea:"Nausée",vomiting:"Vomissements",light:"Sensibilité à la lumière",noise:"Sensibilité au bruit",neck:"Douleur cervicale",dizzy:"Vertiges",blur:"Vision floue",fatigue:"Fatigue"},
  de: {title:"Migränetagebuch",start:"Beginn",end:"Ende",premonition:"Vorboten",pain:"Schmerzstärke",zones:"Schmerzzonen",symptoms:"Symptome",medications:"Medikamente",record:"Schmerz speichern",noEpisode:"Kein aktiver Anfall",active:"Anfall läuft",error:"Fehler",nausea:"Übelkeit",vomiting:"Erbrechen",light:"Lichtempfindlichkeit",noise:"Geräuschempfindlichkeit",neck:"Nackenschmerzen",dizzy:"Schwindel",blur:"Verschwommenes Sehen",fatigue:"Müdigkeit"},
  it: {title:"Diario dell'emicrania",start:"Inizio",end:"Fine",premonition:"Sintomi premonitori",pain:"Intensità del dolore",zones:"Zone dolorose",symptoms:"Sintomi",medications:"Farmaci",record:"Registra dolore",noEpisode:"Nessun attacco attivo",active:"Attacco in corso",error:"Errore",nausea:"Nausea",vomiting:"Vomito",light:"Sensibilità alla luce",noise:"Sensibilità ai suoni",neck:"Dolore al collo",dizzy:"Vertigini",blur:"Vista offuscata",fatigue:"Stanchezza"}
};
const SYMPTOMS=["nausea","vomiting","light","noise","neck","dizzy","blur","fatigue"];
class MigraineDiaryCard extends HTMLElement {
  setConfig(config) {
    this._config = {profile_id:"patient", svg_url:"/local/migraine-diary/head.svg", medications:["Migreaout","Maxalt","Exedryn","Nurofen"], ...config};
    if (!Array.isArray(this._config.medications)) throw new Error("medications must be an array");
    this._zones = new Set(); this._symptoms = new Set(); this._intensity = 5;
    this._busy = false; this._svgLoaded = false;
    if(!this.shadowRoot)this.attachShadow({mode:"open"});
    this._loadSvg();
    this._render();
  }
  set hass(hass) {
    this._hass=hass;
    if(this._pendingActive !== undefined && this._entityActive() === this._pendingActive) this._pendingActive=undefined;
    if(this.shadowRoot)this._render();
  }
  getCardSize(){return 9;}
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
  _render(){
    if(!this.shadowRoot || !this._config)return;
    const root=this.shadowRoot;root.replaceChildren();
    const style=document.createElement("style");style.textContent=`
      :host{display:block;color:var(--primary-text-color)}
      ha-card{display:block;padding:16px}
      h2{font-size:1.2rem;margin:0 0 12px}
      h3{font-size:1rem;margin:14px 0 8px}
      .row{display:flex;gap:6px;flex-wrap:wrap}
      button{background:var(--secondary-background-color);color:var(--primary-text-color);border:1px solid var(--divider-color);border-radius:8px;padding:9px;cursor:pointer}
      button.selected{background:var(--primary-color);color:var(--text-primary-color,#fff)}
      button:disabled{opacity:.4;cursor:not-allowed}
      .map{max-width:480px;margin:auto}
      .map svg{width:100%;height:auto;max-height:370px}
      .map [id^="zone"]{cursor:pointer}
      .map .selected-zone{fill:rgba(220,65,65,.55)!important;stroke:#d33!important;stroke-width:1.4!important}
      .message{color:var(--error-color);margin-top:8px}
      .status{opacity:.8;margin:8px 0}
      `;
    root.append(style);
    const card=document.createElement("ha-card");root.append(card);
    const h=document.createElement("h2");h.textContent=this._t("title");card.append(h);
    const active=this._active();
    const status=document.createElement("div");status.className="status";status.textContent=this._t(active?"active":"noEpisode");card.append(status);
    const actions=document.createElement("div");actions.className="row";card.append(actions);
    actions.append(this._button(this._t("start"),()=>this._call("start_episode",{}),active));
    actions.append(this._button(this._t("end"),()=>this._call("end_episode",{episode_id:this._hass?.states?.[this._config.active_entity || "binary_sensor.migren"]?.attributes?.episode_id}),!active));
    actions.append(this._button(this._t("premonition"),()=>this._call("record_premonition",{symptoms:[...this._symptoms]})));
    const zonesHeading=document.createElement("h3");zonesHeading.textContent=this._t("zones");card.append(zonesHeading);
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
          if(this._zones.has(i))this._zones.delete(i);else this._zones.add(i);
          this._render();
        });
      }
      for(let i=1;i<=9;i++){
        const node=holder.querySelector("#b"+i);
        if(!node)continue;
        node.style.cursor="pointer";
        if(this._intensity===i){node.style.stroke="var(--primary-color, #f44336)";node.style.strokeWidth="2.8px";}
        node.addEventListener("click",event=>{
          event.preventDefault();event.stopPropagation();
          this._intensity=i;this._render();
        });
      }
      card.append(holder);
    }else{
      const fallback=document.createElement("div");fallback.className="row";card.append(fallback);
      for(let i=1;i<=19;i++)fallback.append(this._button(String(i),()=>{this._zones.has(i)?this._zones.delete(i):this._zones.add(i);this._render();},false,this._zones.has(i)));
    }
    const intensity=document.createElement("h3");intensity.textContent=this._t("pain")+" (1–9): "+this._intensity;card.append(intensity);
    const levels=document.createElement("div");levels.className="row";card.append(levels);
    if(!this._svgLoaded) for(let i=1;i<=9;i++)levels.append(this._button(String(i),()=>{this._intensity=i;this._render();},false,this._intensity===i));
    const symptomHeading=document.createElement("h3");symptomHeading.textContent=this._t("symptoms");card.append(symptomHeading);
    const symptoms=document.createElement("div");symptoms.className="row";card.append(symptoms);
    for(const key of SYMPTOMS) symptoms.append(this._button(this._t(key),()=>{this._symptoms.has(key)?this._symptoms.delete(key):this._symptoms.add(key);this._render();},false,this._symptoms.has(key)));
    const save=document.createElement("div");save.className="row";save.style.marginTop="12px";card.append(save);
    save.append(this._button(this._t("record"),async()=>{
      await this._call("record_pain",{intensity:this._intensity,zones:[...this._zones].sort((a,b)=>a-b)});
      // Symptom persistence requires a dedicated service in the next milestone.
    },!active));
    const medications=document.createElement("h3");medications.textContent=this._t("medications");card.append(medications);
    const pills=document.createElement("div");pills.className="row";card.append(pills);
    for(const med of this._config.medications){
      const name=typeof med==="string"?med:med.name;
      const dose=typeof med==="string"?{}:{dose:med.dose,unit:med.unit};
      const payload={name};
      if(dose.dose!==undefined)payload.dose=dose.dose;
      if(dose.unit!==undefined)payload.unit=dose.unit;
      pills.append(this._button(name,()=>this._call("record_medication",payload)));
    }
    if(this._message){const msg=document.createElement("div");msg.className="message";msg.textContent=this._message;card.append(msg);}
  }
}
if(!customElements.get("migraine-diary-card"))customElements.define("migraine-diary-card",MigraineDiaryCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==="migraine-diary-card"))window.customCards.push({type:"migraine-diary-card",name:"Migraine Diary",description:"Headache diary with interactive pain map"});
