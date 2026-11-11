/* Read-only Migraine Diary history card. Resource: /local/migraine-diary/migraine-history-card.js */
class MigraineHistoryCard extends HTMLElement {
  setConfig(config) {
    this.config = {profile_id:"patient",limit:100,title:"История мигрени",...config};
    if (!Number.isInteger(this.config.limit)||this.config.limit<1||this.config.limit>1000) throw Error("limit must be 1–1000");
    if(!this.shadowRoot)this.attachShadow({mode:"open"});
    this._render();
  }
  set hass(value) { this._hass=value; if(!this._loaded){this._loaded=true;this._load();} }
  getCardSize(){return 5;}
  async _load(){
    if(!this._hass)return;
    this._loading=true;this._error=null;this._render();
    const params=new URLSearchParams({profile_id:this.config.profile_id,limit:String(this.config.limit)});
    try {
      const response=await this._hass.callApi("GET","migraine_diary/history?"+params.toString());
      this._records=response.records||[];
    } catch(err){this._error=String(err.message||err);}
    finally {this._loading=false;this._render();}
  }
  _render(){
    if(!this.shadowRoot||!this.config)return;
    this.shadowRoot.replaceChildren();
    const style=document.createElement("style");
    style.textContent=`
      ha-card{padding:16px;color:var(--primary-text-color)}
      header{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px}
      h2{font-size:1.1rem;margin:0}button{border:1px solid var(--divider-color);background:var(--secondary-background-color);color:inherit;border-radius:8px;padding:8px;cursor:pointer}
      .scroll{overflow-x:auto;max-height:550px;overflow-y:auto}
      table{border-collapse:collapse;width:100%;font-size:13px;min-width:750px}
      th,td{text-align:left;padding:8px;border-bottom:1px solid var(--divider-color);vertical-align:top}
      th{position:sticky;top:0;background:var(--card-background-color);z-index:1}
      .muted{opacity:.7}.error{color:var(--error-color)}
    `;
    const card=document.createElement("ha-card"),head=document.createElement("header");
    const title=document.createElement("h2");title.textContent=this.config.title;
    const reload=document.createElement("button");reload.textContent="Обновить";reload.disabled=this._loading;reload.onclick=()=>this._load();
    const exportBtn=document.createElement("button");exportBtn.textContent="CSV / Excel";exportBtn.onclick=()=>this._export();
    head.append(title,reload,exportBtn);card.append(head);
    if(this._error){const error=document.createElement("p");error.className="error";error.textContent=this._error;card.append(error);}
    if(this._loading){const msg=document.createElement("p");msg.textContent="Загрузка…";card.append(msg);}
    const wrap=document.createElement("div");wrap.className="scroll";
    const table=document.createElement("table"),thead=document.createElement("thead"),tr=document.createElement("tr");
    const cols=[["date","Дата"],["event","Событие"],["level","Уровень"],["zones","Зоны"],["symptoms","Симптомы"],["medication","Лекарство"]];
    cols.forEach(([,label])=>{const th=document.createElement("th");th.textContent=label;tr.append(th);});thead.append(tr);table.append(thead);
    const tbody=document.createElement("tbody");
    const labels={start:"Начало мигрени",end:"Конец мигрени",pain:"Изменилось состояние",medication:"Приём лекарства",premonition:"Предчувствие"};
    for(const record of this._records||[]){
      const row=document.createElement("tr");
      cols.forEach(([key])=>{
        const cell=document.createElement("td");let value=record[key];
        if(key==="event")value=labels[value]||value;
        if(key==="date"&&value){const dt=new Date(value);value=Number.isNaN(dt.getTime())?value:dt.toLocaleString(this._hass?.locale?.language||"ru-RU");}
        if(key==="medication"&&value&&record.dose!=null)value+=` ${record.dose} ${record.unit||""}`;
        cell.textContent=value==null||value===""?"—":String(value);row.append(cell);
      });tbody.append(row);
    }
    table.append(tbody);wrap.append(table);card.append(wrap);
    if(!this._loading&&!(this._records||[]).length){const empty=document.createElement("p");empty.className="muted";empty.textContent="Записей нет";card.append(empty);}
    this.shadowRoot.append(style,card);
  }
  async _export(){
    if(!this._hass)return;
    const params=new URLSearchParams({profile_id:this.config.profile_id,limit:String(this.config.limit),format:"csv"});
    try{
      const auth=this._hass.auth;
      const token=auth?.data?.access_token;
      if(!token)throw Error("Токен авторизации недоступен");
      const response=await fetch("/api/migraine_diary/history?"+params,{headers:{Authorization:"Bearer "+token}});
      if(!response.ok)throw Error("HTTP "+response.status);
      const blob=await response.blob(),url=URL.createObjectURL(blob);
      const a=document.createElement("a");a.href=url;a.download="migraine-diary.csv";this.shadowRoot.append(a);a.click();a.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(err){this._error=String(err.message||err);this._render();}
  }
}
customElements.define("migraine-history-card",MigraineHistoryCard);
window.customCards=window.customCards||[];
window.customCards.push({type:"migraine-history-card",name:"Migraine Diary History",description:"SQLite diary history and CSV export"});
