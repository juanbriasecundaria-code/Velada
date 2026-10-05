/* Los nombres son etiquetas visibles. RTDB necesita claves sin . # $ / [ ]. */
(function(root){
  const mapFields=new Set(['scores','byTeam','byGroup','byMember']);
  const key=name=>encodeURIComponent(name).replace(/\./g,'%2E');
  const unkey=name=>{try{return decodeURIComponent(name);}catch(e){return name;}};
  function walk(value,encode){
    if(!value||typeof value!=='object')return value;
    if(Array.isArray(value))return value.map(v=>walk(v,encode));
    const out={};
    Object.entries(value).forEach(([name,item])=>{
      if(mapFields.has(name)&&item&&typeof item==='object'&&!Array.isArray(item)){
        out[name]=Object.fromEntries(Object.entries(item).map(([label,v])=>[encode?key(label):unkey(label),walk(v,encode)]));
      }else out[name]=walk(item,encode);
    });return out;
  }
  root.FirebaseTeamMaps={
    toWire:value=>Object.assign(walk(value,true),{teamMapEncoding:'uri-v1'}),
    fromWire:value=>{if(value?.teamMapEncoding!=='uri-v1')return value;const decoded=walk(value,false);delete decoded.teamMapEncoding;return decoded;}
  };
})(typeof window==='undefined'?globalThis:window);
