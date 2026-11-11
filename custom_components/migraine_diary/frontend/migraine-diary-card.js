/* Migraine Diary Lovelace card — initial prototype.
 * Resource: /local/migraine-diary/migraine-diary-card.js
 * SVG: /migraine_diary/frontend/head.svg (bundled in frontend/head.svg).
 */
const WORDS = {
  lu: {title:"Migränendagbuch",start:"Ufank",end:"Enn",premonition:"Virzeechen",pain:"Schmäerzintensitéit",zones:"Schmäerzberäicher",symptoms:"Symptomer",medications:"Medikamenter",record:"Schmäerz späicheren",noEpisode:"Keen aktiven Ufall",active:"Ufall ass aktiv",error:"Feeler",nausea:"Iwwelzegkeet",vomiting:"Erbriechen",light:"Liichtempfindlechkeet",noise:"Kaméidiempfindlechkeet",neck:"Halswéi",dizzy:"Schwindel",blur:"Onschaarf Siicht",fatigue:"Middegkeet"},
  en: {title:"Migraine Diary",start:"Start",end:"End",premonition:"Premonition",pain:"Pain intensity",zones:"Pain locations",symptoms:"Symptoms",medications:"Medications",record:"Update state",noEpisode:"No active episode",active:"Episode active",error:"Error",nausea:"Nausea",vomiting:"Vomiting",light:"Light sensitivity",noise:"Sound sensitivity",neck:"Neck pain",dizzy:"Dizziness",blur:"Blurred vision",fatigue:"Fatigue"},
  ru: {title:"Дневник мигрени",start:"Начало",end:"Конец",premonition:"Предчувствие",pain:"Интенсивность боли",zones:"Зоны боли",symptoms:"Симптомы",medications:"Лекарства",record:"Обновить состояние",noEpisode:"Нет активного приступа",active:"Приступ активен",error:"Ошибка",nausea:"Тошнота",vomiting:"Рвота",light:"Светочувствительность",noise:"Чувствительность к шуму",neck:"Боль в шее",dizzy:"Головокружение",blur:"Нечёткое зрение",fatigue:"Усталость"},
  fr: {title:"Journal de migraine",start:"Début",end:"Fin",premonition:"Signes précurseurs",pain:"Intensité de la douleur",zones:"Zones douloureuses",symptoms:"Symptômes",medications:"Médicaments",record:"Enregistrer la douleur",noEpisode:"Aucune crise active",active:"Crise en cours",error:"Erreur",nausea:"Nausée",vomiting:"Vomissements",light:"Sensibilité à la lumière",noise:"Sensibilité au bruit",neck:"Douleur cervicale",dizzy:"Vertiges",blur:"Vision floue",fatigue:"Fatigue"},
  de: {title:"Migränetagebuch",start:"Beginn",end:"Ende",premonition:"Vorboten",pain:"Schmerzstärke",zones:"Schmerzzonen",symptoms:"Symptome",medications:"Medikamente",record:"Schmerz speichern",noEpisode:"Kein aktiver Anfall",active:"Anfall läuft",error:"Fehler",nausea:"Übelkeit",vomiting:"Erbrechen",light:"Lichtempfindlichkeit",noise:"Geräuschempfindlichkeit",neck:"Nackenschmerzen",dizzy:"Schwindel",blur:"Verschwommenes Sehen",fatigue:"Müdigkeit"},
  it: {title:"Diario dell'emicrania",start:"Inizio",end:"Fine",premonition:"Sintomi premonitori",pain:"Intensità del dolore",zones:"Zone dolorose",symptoms:"Sintomi",medications:"Farmaci",record:"Registra dolore",noEpisode:"Nessun attacco attivo",active:"Attacco in corso",error:"Errore",nausea:"Nausea",vomiting:"Vomito",light:"Sensibilità alla luce",noise:"Sensibilità ai suoni",neck:"Dolore al collo",dizzy:"Vertigini",blur:"Vista offuscata",fatigue:"Stanchezza"}
};
const EXTRA_WORDS={
  "ru": {
    "past": "Прошлый приступ",
    "pastTitle": "Запись задним числом",
    "action": "Действие",
    "pastMode": "Прошедший приступ: начало и конец",
    "startMode": "Исправить начало активного приступа",
    "endMode": "Завершить активный приступ задним числом",
    "cancel": "Отмена",
    "save": "Сохранить",
    "export": "Экспорт CSV",
    "occupied": "Занятые интервалы:",
    "loading": "Загрузка занятых интервалов…",
    "none": "Нет записанных приступов",
    "ongoing": "активен",
    "noActive": "Нет активного приступа",
    "futureStart": "Начало не может быть в будущем",
    "futureEnd": "Конец не может быть в будущем",
    "laterStart": "Новое начало должно быть раньше записанного",
    "beforeStart": "Конец раньше начала приступа",
    "beforeEnd": "Конец должен быть позже начала",
    "overlap": "Приступ пересекается с занятым интервалом",
    "overlapStart": "Начало пересекается с предыдущим приступом",
    "missing": "Укажите дату и время",
    "loadError": "Не удалось загрузить интервалы: "
  },
  "en": {
    "past": "Past episode",
    "pastTitle": "Record retrospectively",
    "action": "Action",
    "pastMode": "Past episode: start and end",
    "startMode": "Correct active episode start",
    "endMode": "End active episode retrospectively",
    "cancel": "Cancel",
    "save": "Save",
    "export": "Export CSV",
    "occupied": "Occupied intervals:",
    "loading": "Loading existing intervals…",
    "none": "No recorded episodes",
    "ongoing": "active",
    "noActive": "No active episode",
    "futureStart": "Start cannot be in the future",
    "futureEnd": "End cannot be in the future",
    "laterStart": "New start must precede recorded start",
    "beforeStart": "End precedes episode start",
    "beforeEnd": "End must be after start",
    "overlap": "Episode overlaps an existing interval",
    "overlapStart": "Start overlaps a previous episode",
    "missing": "Enter date and time",
    "loadError": "Unable to load intervals: "
  },
  "fr": {
    "past": "Crise passée",
    "pastTitle": "Saisie rétroactive",
    "action": "Action",
    "pastMode": "Crise passée : début et fin",
    "startMode": "Corriger le début de la crise active",
    "endMode": "Terminer la crise active rétroactivement",
    "cancel": "Annuler",
    "save": "Enregistrer",
    "export": "Exporter CSV",
    "occupied": "Périodes occupées :",
    "loading": "Chargement des périodes…",
    "none": "Aucune crise enregistrée",
    "ongoing": "en cours",
    "noActive": "Aucune crise active",
    "futureStart": "Le début ne peut pas être dans le futur",
    "futureEnd": "La fin ne peut pas être dans le futur",
    "laterStart": "Le nouveau début doit précéder celui enregistré",
    "beforeStart": "La fin précède le début",
    "beforeEnd": "La fin doit suivre le début",
    "overlap": "La crise chevauche une période existante",
    "overlapStart": "Le début chevauche une crise précédente",
    "missing": "Indiquez la date et l’heure",
    "loadError": "Impossible de charger les périodes : "
  },
  "de": {
    "past": "Früherer Anfall",
    "pastTitle": "Nachträglich erfassen",
    "action": "Aktion",
    "pastMode": "Früherer Anfall: Beginn und Ende",
    "startMode": "Beginn des aktiven Anfalls korrigieren",
    "endMode": "Aktiven Anfall nachträglich beenden",
    "cancel": "Abbrechen",
    "save": "Speichern",
    "export": "CSV exportieren",
    "occupied": "Belegte Zeiträume:",
    "loading": "Zeiträume werden geladen…",
    "none": "Keine Anfälle erfasst",
    "ongoing": "aktiv",
    "noActive": "Kein aktiver Anfall",
    "futureStart": "Beginn darf nicht in der Zukunft liegen",
    "futureEnd": "Ende darf nicht in der Zukunft liegen",
    "laterStart": "Neuer Beginn muss vor dem erfassten liegen",
    "beforeStart": "Ende liegt vor dem Beginn",
    "beforeEnd": "Ende muss nach dem Beginn liegen",
    "overlap": "Anfall überschneidet sich mit vorhandenem Zeitraum",
    "overlapStart": "Beginn überschneidet sich mit vorherigem Anfall",
    "missing": "Datum und Uhrzeit eingeben",
    "loadError": "Zeiträume konnten nicht geladen werden: "
  },
  "it": {
    "past": "Attacco passato",
    "pastTitle": "Registrazione retroattiva",
    "action": "Azione",
    "pastMode": "Attacco passato: inizio e fine",
    "startMode": "Correggi inizio attacco attivo",
    "endMode": "Termina retroattivamente attacco attivo",
    "cancel": "Annulla",
    "save": "Salva",
    "export": "Esporta CSV",
    "occupied": "Intervalli occupati:",
    "loading": "Caricamento intervalli…",
    "none": "Nessun attacco registrato",
    "ongoing": "attivo",
    "noActive": "Nessun attacco attivo",
    "futureStart": "L'inizio non può essere nel futuro",
    "futureEnd": "La fine non può essere nel futuro",
    "laterStart": "Il nuovo inizio deve precedere quello registrato",
    "beforeStart": "La fine precede l'inizio",
    "beforeEnd": "La fine deve seguire l'inizio",
    "overlap": "L'attacco si sovrappone a un intervallo esistente",
    "overlapStart": "L'inizio si sovrappone a un attacco precedente",
    "missing": "Inserisci data e ora",
    "loadError": "Impossibile caricare gli intervalli: "
  },
  "lu": {
    "past": "Fréieren Ufall",
    "pastTitle": "Réckwierkend androen",
    "action": "Aktioun",
    "pastMode": "Fréieren Ufall: Ufank an Enn",
    "startMode": "Ufank vum aktiven Ufall korrigéieren",
    "endMode": "Aktiven Ufall réckwierkend ofschléissen",
    "cancel": "Ofbriechen",
    "save": "Späicheren",
    "export": "CSV exportéieren",
    "occupied": "Besate Zäitraim:",
    "loading": "Zäitraim gi gelueden…",
    "none": "Keng Ufäll gespäichert",
    "ongoing": "aktiv",
    "noActive": "Keen aktiven Ufall",
    "futureStart": "Ufank däerf net an der Zukunft leien",
    "futureEnd": "Enn däerf net an der Zukunft leien",
    "laterStart": "Neien Ufank muss virum gespäicherten Ufank leien",
    "beforeStart": "Enn läit virum Ufank",
    "beforeEnd": "Enn muss nom Ufank leien",
    "overlap": "Ufall iwwerschneit sech mat engem existente Zäitraum",
    "overlapStart": "Ufank iwwerschneit sech mat engem fréieren Ufall",
    "missing": "Datum an Auerzäit uginn",
    "loadError": "Zäitraim konnten net geluede ginn: "
  }
};
const BUNDLED_SVG_URL="/migraine_diary/frontend/head.svg";
const SECTION_IDS=["actions","zones","intensity","symptoms","medications","food"];
const DEFAULT_SECTION_ORDER=[...SECTION_IDS];
const DEFAULT_LABELS={title:true,zones:true,intensity:true,symptoms:true,medications:true};
const SYMPTOMS=["Сильная ударная боль","Пульсирующая боль","Пульсирующая периодическая боль","Усиливается при движении","Тошнота","Рвота","Светочувствительность","Чувствительность к шуму","Боль в шее","Головокружение","Насморк","Бессонница","Подавленное настроение","Тревожность","Чувствительность к запахам","Жар / ощущение жара","Звон в ушах","Усталость","Расплывчатое зрение","Перепады настроения"];
const SYMPTOM_TRANSLATIONS={
  "en": [
    "Severe stabbing pain",
    "Throbbing pain",
    "Intermittent throbbing pain",
    "Worse with movement",
    "Nausea",
    "Vomiting",
    "Light sensitivity",
    "Sound sensitivity",
    "Neck pain",
    "Dizziness",
    "Runny nose",
    "Insomnia",
    "Low mood",
    "Anxiety",
    "Sensitivity to smells",
    "Feeling hot",
    "Ringing in ears",
    "Fatigue",
    "Blurred vision",
    "Mood swings"
  ],
  "fr": [
    "Douleur aiguë intense",
    "Douleur pulsatile",
    "Douleur pulsatile intermittente",
    "Aggravée par le mouvement",
    "Nausée",
    "Vomissements",
    "Sensibilité à la lumière",
    "Sensibilité au bruit",
    "Douleur cervicale",
    "Vertiges",
    "Écoulement nasal",
    "Insomnie",
    "Humeur dépressive",
    "Anxiété",
    "Sensibilité aux odeurs",
    "Sensation de chaleur",
    "Acouphènes",
    "Fatigue",
    "Vision floue",
    "Sautes d’humeur"
  ],
  "de": [
    "Starker stechender Schmerz",
    "Pulsierender Schmerz",
    "Zeitweise pulsierender Schmerz",
    "Schlimmer bei Bewegung",
    "Übelkeit",
    "Erbrechen",
    "Lichtempfindlichkeit",
    "Geräuschempfindlichkeit",
    "Nackenschmerzen",
    "Schwindel",
    "Laufende Nase",
    "Schlaflosigkeit",
    "Gedrückte Stimmung",
    "Angst",
    "Geruchsempfindlichkeit",
    "Hitzegefühl",
    "Ohrgeräusche",
    "Müdigkeit",
    "Verschwommenes Sehen",
    "Stimmungsschwankungen"
  ],
  "it": [
    "Dolore lancinante intenso",
    "Dolore pulsante",
    "Dolore pulsante intermittente",
    "Peggiora con il movimento",
    "Nausea",
    "Vomito",
    "Sensibilità alla luce",
    "Sensibilità ai suoni",
    "Dolore al collo",
    "Vertigini",
    "Naso che cola",
    "Insonnia",
    "Umore depresso",
    "Ansia",
    "Sensibilità agli odori",
    "Sensazione di calore",
    "Acufeni",
    "Stanchezza",
    "Vista offuscata",
    "Sbalzi d’umore"
  ],
  "lu": [
    "Staark stiechende Péng",
    "Pulséierende Péng",
    "Zäitweis pulséierend Péng",
    "Méi schlëmm bei Beweegung",
    "Iwwelzegkeet",
    "Erbriechen",
    "Liichtempfindlechkeet",
    "Kaméidiempfindlechkeet",
    "Halswéi",
    "Schwindel",
    "Lafend Nues",
    "Schloflosegkeet",
    "Gedréckte Stëmmung",
    "Angscht",
    "Gerochsempfindlechkeet",
    "Hëtztgefill",
    "Ouergeräischer",
    "Middegkeet",
    "Onschaarf Siicht",
    "Stëmmungsschwankungen"
  ]
};
class MigraineDiaryCard extends HTMLElement {
  setConfig(config) {
    this._config = {button_font_size:10, button_icon_size:20, action_font_size:14, action_icon_size:20, use_ha_helpers:true, profile_id:"patient", medications:["Migreaout","Maxalt","Exedryn","Nurofen"], show_labels:true, section_order:DEFAULT_SECTION_ORDER, section_gap:16, action_columns:4, symptom_columns:5, medication_columns:5, action_display:"both", symptom_display:"both", medication_display:"both", action_button_color:"", action_icon_color:"", medication_button_color:"", medication_icon_color:"", show_food:true, ...config};
    delete this._config.svg_url; // Legacy configuration is ignored: the SVG is bundled.
    for(const key of ["button_font_size","button_icon_size","action_font_size","action_icon_size"]){
      const value=Number(this._config[key]);
      if(!Number.isFinite(value)||value<6||value>64)throw new Error(key+" must be 6–64 pixels");
      this._config[key]=value;
    }
    if (!Array.isArray(this._config.medications)) throw new Error("medications must be an array");
    if(Array.isArray(this._config.section_order) && this._config.section_order.length===SECTION_IDS.length-1 && !this._config.section_order.includes("food"))this._config.section_order=[...this._config.section_order,"food"];
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
    this._foodHistory = null;
    this._foodHistoryLoading = false;
    this._foodHistoryError = "";
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
    // A card-specific language overrides the integration's setting.
    // With "auto", each user's Home Assistant locale takes precedence.
    const configured=String(this._config?.language || "auto").toLowerCase();
    const states=this._hass?.states || {};
    const entityId=this._config?.active_entity || "binary_sensor.migren";
    const integrationLanguage=states["sensor.migraine_diary_last_record"]?.attributes?.language
      || states[entityId]?.attributes?.language
      || "auto";
    const selected=configured!=="auto"
      ? configured
      : integrationLanguage!=="auto"
        ? integrationLanguage
        : this._hass?.locale?.language || this._hass?.language || navigator.language || "en";
    const normalized=String(selected).toLowerCase().split(/[-_]/)[0];
    const lang=normalized==="lb"?"lu":normalized;
    return Object.hasOwn(WORDS,lang) ? lang : "en";
  }
  _t(key){return EXTRA_WORDS[this._language()]?.[key] || WORDS[this._language()][key] || key;}
  _entityActive() {
    const entity=this._config.active_entity || "binary_sensor.migren";
    const state=this._hass?.states?.[entity];
    return !!state && state.state === "on";
  }
  _active(){return this._pendingActive !== undefined ? this._pendingActive : this._entityActive();}
  async _loadSvg(){
    try {
      const response=await fetch(BUNDLED_SVG_URL,{credentials:"same-origin"});
      if(!response.ok) throw new Error("SVG HTTP "+response.status);
      const raw=await response.text();
      const doc=new DOMParser().parseFromString(raw,"image/svg+xml");
      if(doc.querySelector("parsererror")) throw new Error("Invalid SVG");
      const root=doc.documentElement;
      if(root.localName !== "svg") throw new Error("Not an SVG");
      // SVG is bundled by the project/user, never accept arbitrary remote SVG.
      if(/^https?:\/\//i.test(BUNDLED_SVG_URL)) throw new Error("Only local SVG paths allowed");
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
      if(service==="record_food" && this._foodHistory!==null)await this._loadFoodHistory();
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
  async _loadFoodHistory(){
    if(this._foodHistoryLoading || !this._hass)return;
    this._foodHistoryLoading=true;this._foodHistoryError="";
    try{
      const token=this._hass.auth?.data?.access_token;
      if(!token)throw Error("Home Assistant access token unavailable");
      const params=new URLSearchParams({profile_id:this._config.profile_id,limit:"1000"});
      const response=await fetch("/api/migraine_diary/history?"+params.toString(),{
        headers:{Authorization:"Bearer "+token},cache:"no-store"
      });
      if(!response.ok)throw Error("History HTTP "+response.status);
      const data=await response.json();
      this._foodHistory=(Array.isArray(data.records)?data.records:[])
        .filter(record=>record.event==="food").slice(0,20);
    }catch(error){this._foodHistoryError=error?.message||String(error);}
    finally{this._foodHistoryLoading=false;this._render();}
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
  _openPastDialog(){
    const dialog=document.createElement("dialog");
    dialog.style.cssText="border:1px solid var(--divider-color);border-radius:12px;padding:20px;background:var(--card-background-color);color:var(--primary-text-color);max-width:90vw";
    const title=document.createElement("h3");title.textContent=this._t("pastTitle");dialog.append(title);
    const modeLabel=document.createElement("label");modeLabel.textContent=this._t("action");
    const mode=document.createElement("select");mode.style.cssText="display:block;width:100%;padding:8px;margin:6px 0 12px";
    for(const [value,name] of [["past",this._t("pastMode")],["start",this._t("startMode")],["end",this._t("endMode")]]){
      const option=document.createElement("option");option.value=value;option.textContent=name;mode.append(option);
    }
    modeLabel.append(mode);dialog.append(modeLabel);
    const fields={};
    for(const [key,name] of [["start",this._t("start")],["end",this._t("end")]]){
      const label=document.createElement("label");label.style.cssText="display:block;margin:12px 0";label.textContent=name;
      const input=document.createElement("input");input.type="datetime-local";input.required=true;input.style.cssText="display:block;margin-top:5px;padding:8px;max-width:100%";
      label.append(input);dialog.append(label);fields[key]={label,input};
    }
    const occupied=document.createElement("div");occupied.style.cssText="font-size:13px;margin:12px 0;max-height:150px;overflow:auto";occupied.textContent=this._t("loading");dialog.append(occupied);
    const error=document.createElement("p");error.style.color="var(--error-color)";dialog.append(error);
    let episodes=null;
    const activeEpisode=()=>episodes?.find(ep=>ep.ended_at===null);
    const formatDate=value=>new Date(value).toLocaleString(this._language()==="lu"?"lb-LU":this._language());
    const validate=()=>{
      error.textContent="";
      const kind=mode.value,active=activeEpisode();
      const start=fields.start.input.value?new Date(fields.start.input.value).getTime():NaN;
      const end=fields.end.input.value?new Date(fields.end.input.value).getTime():NaN;
      const now=Date.now();
      if(kind==="end"&&episodes&&!active){error.textContent=this._t("noActive");return false;}
      if(kind==="start"){
        if(!Number.isFinite(start))return false;
        if(start>now){error.textContent=this._t("futureStart");return false;}
        if(active&&start>new Date(active.started_at).getTime()){error.textContent=this._t("laterStart");return false;}
        if(episodes?.some(ep=>ep.id!==active?.id&&(!active||new Date(ep.started_at).getTime()<new Date(active.started_at).getTime())&&(ep.ended_at===null||new Date(ep.ended_at).getTime()>start))){
          error.textContent=this._t("overlapStart");return false;
        }
      }else if(kind==="end"){
        if(!Number.isFinite(end))return false;
        if(end>now){error.textContent=this._t("futureEnd");return false;}
        if(active&&end<new Date(active.started_at).getTime()){error.textContent=this._t("beforeStart");return false;}
      }else{
        if(!Number.isFinite(start)||!Number.isFinite(end))return false;
        if(start>=end){error.textContent=this._t("beforeEnd");return false;}
        if(end>now){error.textContent=this._t("futureEnd");return false;}
        if(episodes?.some(ep=>new Date(ep.started_at).getTime()<end&&(ep.ended_at===null||new Date(ep.ended_at).getTime()>start))){
          error.textContent=this._t("overlap");return false;
        }
      }
      return true;
    };
    const refresh=()=>{
      fields.start.label.style.display=mode.value==="end"?"none":"block";
      fields.end.label.style.display=mode.value==="start"?"none":"block";
      validate();
    };
    mode.addEventListener("change",refresh);
    Object.values(fields).forEach(field=>field.input.addEventListener("input",validate));
    const cancel=this._button(this._t("cancel"),()=>dialog.close());
    const save=this._button(this._t("save"),async()=>{
      if(!validate()){if(!error.textContent)error.textContent=this._t("missing");return;}
      const kind=mode.value;
      const data={profile_id:this._config.profile_id};
      if(kind!=="end")data.started_at=new Date(fields.start.input.value).toISOString();
      if(kind!=="start")data.ended_at=new Date(fields.end.input.value).toISOString();
      if(kind==="past"){
        data.intensity=this._intensity;
        data.zones=[...this._zones];
        data.symptoms=[...this._symptoms];
      }
      const service=kind==="past"?"record_past_episode":kind==="start"?(activeEpisode()?"correct_active_start":"start_episode"):"end_episode";
      save.disabled=true;
      try{
        await this._hass.callService("migraine_diary",service,data);
        if(kind==="end"){this._pendingActive=false;}
        if(kind==="start"&&service==="start_episode"){this._pendingActive=true;}
        dialog.close();this._render();
      }catch(e){error.textContent=e?.message||String(e);save.disabled=false;}
    });
    const buttons=document.createElement("div");buttons.style.cssText="display:flex;gap:8px;justify-content:flex-end";buttons.append(cancel,save);dialog.append(buttons);
    dialog.addEventListener("close",()=>dialog.remove());
    this.shadowRoot.append(dialog);dialog.showModal();refresh();
    this._hass.callApi("GET","migraine_diary/history?format=episodes&limit=1000&profile_id="+encodeURIComponent(this._config.profile_id))
      .then(data=>{
        if(!dialog.isConnected)return;
        episodes=data.episodes||[];
        occupied.replaceChildren();
        const heading=document.createElement("strong");heading.textContent=this._t("occupied");occupied.append(heading);
        if(!episodes.length){const empty=document.createElement("div");empty.textContent=this._t("none");occupied.append(empty);}
        for(const ep of episodes){
          const line=document.createElement("div");line.textContent=formatDate(ep.started_at)+" — "+(ep.ended_at?formatDate(ep.ended_at):this._t("ongoing"));line.style.marginTop="5px";occupied.append(line);
        }
        refresh();
      }).catch(err=>{if(dialog.isConnected)occupied.textContent=this._t("loadError")+String(err?.message||err);});
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

    actions.append(this._tile(this._t("past"),"mdi:calendar-clock",this._config.action_display,()=>this._openPastDialog(),false,"action-btn"));
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
      const btn=this._tile((SYMPTOM_TRANSLATIONS[this._language()]||SYMPTOMS)[i],"mdi:head-flash",this._config.symptom_display,async()=>{
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
    const foodHeading=document.createElement("h3");foodHeading.textContent=this._language()==="ru"?"Питание":this._language()==="fr"?"Alimentation":this._language()==="de"?"Ernährung":"Food";
    const foodForm=document.createElement("form");foodForm.style.cssText="display:grid;gap:8px";
    const foodName=document.createElement("input");foodName.required=true;foodName.maxLength=200;foodName.placeholder=this._language()==="ru"?"Продукт или блюдо":"Food or meal";
    const foodQuantity=document.createElement("input");foodQuantity.maxLength=100;foodQuantity.placeholder=this._language()==="ru"?"Количество (необязательно)":"Quantity (optional)";
    const foodNotes=document.createElement("input");foodNotes.maxLength=500;foodNotes.placeholder=this._language()==="ru"?"Примечание (необязательно)":"Notes (optional)";
    const foodSubmit=document.createElement("button");foodSubmit.type="submit";foodSubmit.textContent=this._language()==="ru"?"Записать приём пищи":"Save food";
    const foodTimeLabel=document.createElement("label");
    foodTimeLabel.textContent=this._language()==="ru"?"Дата и время приёма пищи":"Date and time";
    const foodTime=document.createElement("input");foodTime.type="datetime-local";
    const localNow=new Date();
    foodTime.value=new Date(localNow.getTime()-localNow.getTimezoneOffset()*60000).toISOString().slice(0,16);
    foodTimeLabel.append(foodTime);
    foodForm.append(foodName,foodQuantity,foodNotes,foodTimeLabel,foodSubmit);
    foodForm.addEventListener("submit",async event=>{
      event.preventDefault();
      const name=foodName.value.trim();if(!name||this._busy)return;
      const payload={name};
      if(foodQuantity.value.trim())payload.quantity=foodQuantity.value.trim();
      if(foodNotes.value.trim())payload.notes=foodNotes.value.trim();
      if(foodTime.value){
        const date=new Date(foodTime.value);
        if(Number.isNaN(date.getTime())){this._message="Invalid food date/time";this._render();return;}
        if(date.getTime()>Date.now()){this._message=this._language()==="ru"?"Дата приёма пищи не может быть в будущем":"Food date cannot be in the future";this._render();return;}
        payload.occurred_at=date.toISOString();
      }
      await this._call("record_food",payload);
    });
    const foodHistory=document.createElement("div");
    const foodHistoryButton=document.createElement("button");
    foodHistoryButton.textContent=this._foodHistoryLoading?"…":this._language()==="ru"?"Обновить историю питания":"Refresh food history";
    foodHistoryButton.disabled=this._foodHistoryLoading;
    foodHistoryButton.addEventListener("click",()=>this._loadFoodHistory());
    foodHistory.append(foodHistoryButton);
    if(this._foodHistoryError){
      const error=document.createElement("p");error.className="message";error.textContent=this._foodHistoryError;foodHistory.append(error);
    }
    if(this._foodHistory!==null){
      if(!this._foodHistory.length){
        const empty=document.createElement("p");empty.textContent=this._language()==="ru"?"Записей о питании пока нет":"No food records";foodHistory.append(empty);
      }
      for(const item of this._foodHistory){
        const line=document.createElement("div");line.style.cssText="padding:7px 0;border-bottom:1px solid var(--divider-color)";
        const date=new Date(item.date);
        const dateText=Number.isNaN(date.getTime())?item.date:date.toLocaleString(this._language()==="lu"?"lb":this._language());
        line.textContent=dateText+" — "+item.food+(item.quantity?" · "+item.quantity:"")+(item.notes?" · "+item.notes:"");
        foodHistory.append(line);
      }
    }
    // Assemble each logical section in its own wrapper, preserving spacing
    // even when all headings are hidden.
    const mapNode=Array.from(card.children).find(el=>el.classList?.contains("map"));
    const fallbackNode=!mapNode?Array.from(card.children).find(el=>el.classList?.contains("row")&&el!==levels):null;
    const sectionContents={
      actions:[actions],zones:[zonesHeading,mapNode||fallbackNode],
      intensity:[intensity,levels],symptoms:[symptomHeading,symptoms],
      medications:[medications,pills],food:[foodHeading,foodForm,foodHistory]
    };
    for(const key of this._config.section_order){
      const section=document.createElement("section");section.className="section";
      if(key==="food" && this._config.show_food===false)continue;
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
    const exportButton=this._button(this._t("export"),()=>this._exportCsv());
    exportButton.style.marginTop="14px";card.append(exportButton);
    if(this._message){const msg=document.createElement("div");msg.className="message";msg.textContent=this._message;card.append(msg);}
  }
}

class MigraineDiaryCardEditor extends HTMLElement {
  constructor(){super();this.attachShadow({mode:"open"});}
  set hass(value){this._hass=value;this.render();}
  setConfig(config){this._config={...config};this.render();}
  _change(key,value){
    this._config={...this._config,[key]:value};
    this.dispatchEvent(new CustomEvent("config-changed",{detail:{config:this._config},bubbles:true,composed:true}));
  }
  render(){
    if(!this._config)return;
    const root=this.shadowRoot;root.replaceChildren();
    const style=document.createElement("style");style.textContent=":host{display:block}label{display:grid;gap:4px;margin:10px 0}input,select{box-sizing:border-box;width:100%;padding:8px;border:1px solid var(--divider-color);border-radius:6px;background:var(--card-background-color);color:var(--primary-text-color)}h3{margin:16px 0 8px}";
    root.append(style);
    const title=document.createElement("h3");title.textContent="Migraine Diary — настройки карточки";root.append(title);
    const field=(label,key,type="text",options=null)=>{
      const wrapper=document.createElement("label");wrapper.textContent=label;
      const input=options?document.createElement("select"):document.createElement("input");
      if(options){for(const [value,name] of options){const option=document.createElement("option");option.value=value;option.textContent=name;input.append(option);}}
      else input.type=type;
      if(type==="checkbox"){input.checked=this._config[key]??true;}
      else input.value=this._config[key]??"";
      input.addEventListener("change",()=>this._change(key,type==="checkbox"?input.checked:type==="number"?Number(input.value):input.value));
      wrapper.append(input);root.append(wrapper);
    };
    field("Профиль","profile_id");
    field("Язык карточки","language","text",[
      ["auto","Автоматически (Home Assistant)"],
      ["ru","Русский"],
      ["en","English"],
      ["fr","Français"],
      ["de","Deutsch"],
      ["lu","Lëtzebuergesch"]
    ]);
    const entityWrapper=document.createElement("label");entityWrapper.textContent="Сущность активного приступа";
    const entitySelect=document.createElement("select");
    const selectedEntity=this._config.active_entity || "binary_sensor.migren";
    const entityIds=Object.keys(this._hass?.states||{}).filter(id=>id.startsWith("binary_sensor.")||id.startsWith("sensor.")).sort((a,b)=>a.localeCompare(b));
    if(!entityIds.includes(selectedEntity))entityIds.unshift(selectedEntity);
    for(const id of entityIds){
      const option=document.createElement("option");
      option.value=id;
      const friendly=this._hass?.states?.[id]?.attributes?.friendly_name;
      option.textContent=friendly&&friendly!==id?friendly+" ("+id+")":id;
      option.selected=id===selectedEntity;
      entitySelect.append(option);
    }
    entitySelect.addEventListener("change",()=>this._change("active_entity",entitySelect.value));
    entityWrapper.append(entitySelect);root.append(entityWrapper);
    field("Использовать помощники Home Assistant","use_ha_helpers","checkbox");
    field("Показывать заголовки","show_labels","checkbox");
    field("Показывать форму питания","show_food","checkbox");
    field("Отступы между блоками (px)","section_gap","number");
    for(const [key,label] of [["action_columns","Колонки действий"],["symptom_columns","Колонки симптомов"],["medication_columns","Колонки лекарств"]])field(label,key,"number");
    for(const [key,label] of [["action_display","Кнопки действий"],["symptom_display","Кнопки симптомов"],["medication_display","Кнопки лекарств"]])field(label,key,"text",[["both","Иконка и текст"],["icon","Только иконка"],["label","Только текст"]]);
    const order=document.createElement("h3");order.textContent="Порядок блоков";root.append(order);
    const names={actions:"Действия",zones:"Зоны боли",intensity:"Интенсивность",symptoms:"Симптомы",medications:"Лекарства",food:"Питание"};
    const ordered=Array.isArray(this._config.section_order)?[...this._config.section_order]:[...SECTION_IDS];
    for(const id of SECTION_IDS)if(!ordered.includes(id))ordered.push(id);
    for(const [index,id] of ordered.entries()){
      const line=document.createElement("div");line.style.cssText="display:flex;align-items:center;gap:8px;margin:5px 0";
      const name=document.createElement("span");name.style.flex="1";name.textContent=names[id];
      const up=document.createElement("button");up.textContent="↑";up.disabled=index===0;
      const down=document.createElement("button");down.textContent="↓";down.disabled=index===ordered.length-1;
      const move=delta=>{const next=[...ordered];[next[index],next[index+delta]]=[next[index+delta],next[index]];this._change("section_order",next);this.render();};
      up.addEventListener("click",()=>move(-1));down.addEventListener("click",()=>move(1));
      line.append(name,up,down);root.append(line);
    }
  }
}
if(!customElements.get("migraine-diary-card-editor"))customElements.define("migraine-diary-card-editor",MigraineDiaryCardEditor);
MigraineDiaryCard.getConfigElement=()=>document.createElement("migraine-diary-card-editor");
MigraineDiaryCard.getStubConfig=()=>({type:"custom:migraine-diary-card",profile_id:"patient"});

if(!customElements.get("migraine-diary-card"))customElements.define("migraine-diary-card",MigraineDiaryCard);
window.customCards=window.customCards||[];
if(!window.customCards.some(c=>c.type==="migraine-diary-card"))window.customCards.push({type:"migraine-diary-card",name:"Migraine Diary",description:"Headache diary with interactive pain map"});
