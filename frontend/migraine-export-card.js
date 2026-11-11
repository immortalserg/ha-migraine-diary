/* Migraine Diary CSV export button for Home Assistant Lovelace. */
class MigraineExportCard extends HTMLElement {
  setConfig(config) {
    this.config={profile_id:"patient",limit:1000,title:"Экспорт дневника мигрени",...config};
    if(!Number.isInteger(this.config.limit)||this.config.limit<1||this.config.limit>1000)throw Error("limit must be 1–1000");
    if(!this.shadowRoot)this.attachShadow({mode:"open"});
    this._render();
  }
  set hass(value){this._hass=value;}
  getCardSize(){return 1;}
  _render(){
    if(!this.shadowRoot||!this.config)return;
    this.shadowRoot.replaceChildren();
    const style=document.createElement("style");
    style.textContent="ha-card{padding:16px}button{background:var(--primary-color);color:var(--text-primary-color,#fff);border:0;border-radius:8px;padding:12px 18px;cursor:pointer}button:disabled{opacity:.6}p{color:var(--error-color)}";
    const card=document.createElement("ha-card");
    const title=document.createElement("div");title.textContent=this.config.title;title.style.marginBottom="12px";
    const button=document.createElement("button");button.textContent="Скачать CSV";button.onclick=()=>this._download(button);
    card.append(title,button);this.shadowRoot.append(style,card);
  }
  async _download(button){
    if(!this._hass)return;
    button.disabled=true;
    try{
      const params=new URLSearchParams({profile_id:this.config.profile_id,limit:String(this.config.limit),format:"csv"});
      const token=this._hass.auth?.data?.access_token;
      if(!token)throw Error("Токен авторизации недоступен");
      const response=await fetch("/api/migraine_diary/history?"+params.toString(),{
        headers:{Authorization:"Bearer "+token}
      });
      if(!response.ok)throw Error("Ошибка HTTP "+response.status);
      const blob=await response.blob(),url=URL.createObjectURL(blob);
      const anchor=document.createElement("a");anchor.href=url;anchor.download="migraine-diary.csv";
      this.shadowRoot.append(anchor);anchor.click();anchor.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
    }catch(error){
      const message=document.createElement("p");message.textContent=String(error.message||error);
      this.shadowRoot.querySelector("ha-card")?.append(message);
    }finally{button.disabled=false;}
  }
}
customElements.define("migraine-export-card",MigraineExportCard);
window.customCards=window.customCards||[];
window.customCards.push({type:"migraine-export-card",name:"Migraine Diary CSV Export",description:"Download diary records as CSV"});
