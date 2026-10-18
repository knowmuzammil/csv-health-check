'use strict';
const $ = id => document.getElementById(id);
let source = null, cleaned = null, fileName = '', reading = 0;
const sample = 'Order ID,Customer,Region,Order Date,Revenue,Status\r\n1001, Northstar Ltd ,North,2026-01-05,1250,Paid\r\n1002,Meadow Studio,South,2026-01-06,850,Paid\r\n1002,Meadow Studio,South,2026-01-06,850,Paid\r\n1003,,West,2026-01-07,620,Pending\r\n1004,Bluebird Co,East,07/01/2026,unknown,Pending\r\n1005, Alder Works,North,2026-01-08,1400 ,Paid\r\n,,,,,\r\n1006,"Harbour, Partners",South,2026-01-09,980,Paid\r\n1007,Oak & Co,,2026-01-10,450,Pending\r\n1008,Elm Studio,West,2026-01-11,720,Paid';
function message(text,error=false){$('notice').textContent=text;$('notice').className=error?'error':'';}
function node(tag,text){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;}
function showTable(data,mode){
  const table=$('table');table.replaceChildren();const head=node('thead'),hr=node('tr');hr.append(node('th','#'));data.headers.forEach((v,i)=>{const th=node('th',v||`Column ${i+1} (unnamed)`);th.scope='col';hr.append(th);});head.append(hr);table.append(head);
  const body=node('tbody');data.rows.slice(0,50).forEach((row,i)=>{const tr=node('tr');tr.append(node('td',String(i+1)));row.forEach(value=>{const td=node('td',value.trim()?value.slice(0,250):'—');if(!value.trim())td.className='missing';if(value.length>250)td.append(node('span','…'));tr.append(td);});body.append(tr);});table.append(body);
  $('preview-caption').textContent=`${mode} data · showing ${Math.min(data.rows.length,50)} of ${data.rows.length.toLocaleString()} rows`;
  $('original').setAttribute('aria-pressed',String(mode==='Original'));$('cleaned').setAttribute('aria-pressed',String(mode==='Cleaned'));
}
function load(text,name){
  try{
    const parsed=CSVHealth.parse(text);source=parsed;fileName=name;cleaned=null;
    $('results').hidden=false;$('filename').textContent=name;$('dimensions').textContent=`${source.rows.length.toLocaleString()} data rows · ${source.headers.length} columns · first record used as header`;
    const a=CSVHealth.analyse(source);['missing','duplicates','spaces'].forEach(key=>$(key).textContent=a[key].toLocaleString());$('mixed').textContent=a.mixed.length;
    const findings=$('findings');findings.replaceChildren();const add=text=>findings.append(node('li',text));
    if(a.blank)add(`${a.blank} completely empty row(s). These contribute to the missing-cell count.`);
    a.columns.filter(c=>c.missing).forEach(c=>add(`${c.name}: ${c.missing} missing value(s). Fill these using a reliable source; this tool leaves them blank.`));
    a.mixed.forEach(c=>add(`${c.name}: contains ${[...c.types].join(' and ')} values. This may be intentional. Dates are recognised only in YYYY-MM-DD format; no format conversion is applied.`));
    if(a.duplicates)add(`${a.duplicates} extra duplicate row(s) after trimming surrounding spaces. Identical transactions may be legitimate—review before removing.`);
    if(a.spaces)add(`${a.spaces} cell(s) contain leading or trailing whitespace.`);
    const headers=source.headers.map(v=>v.trim());if(headers.some(v=>!v)||new Set(headers).size!==headers.length)add('Some headers are empty or repeated. Original headers are preserved; review them in your spreadsheet.');
    if(!findings.children.length)add('No issues found by these checks. This does not verify that the data is factually correct.');
    invalidate();showTable(source,'Original');message(`Loaded ${name}. Review the report, then preview your clean-up.`);
  }catch(error){message(error.message,true);}
}
function invalidate(){cleaned=null;$('download').disabled=true;$('cleaned').disabled=true;$('change-summary').hidden=true;$('remaining').textContent='Preview your selected changes to enable download.';if(source)showTable(source,'Original');}
$('file').addEventListener('change',async event=>{const file=event.target.files[0];if(!file)return;const ticket=++reading;if(file.size>5*1024*1024){message('File is too large. Please choose a CSV under 5 MB.',true);return;}try{const text=await file.text();if(ticket===reading)load(text,file.name);}catch{message('Could not read the file. Please try again.',true);}finally{event.target.value='';}});
$('sample').onclick=()=>{reading++;load(sample,'sample-sales.csv');};
['trim','dedupe','blank'].forEach(id=>$(id).addEventListener('change',invalidate));
$('preview').onclick=()=>{if(!source)return;cleaned=CSVHealth.clean(source,{trim:$('trim').checked,dedupe:$('dedupe').checked,blank:$('blank').checked});const c=cleaned.changes;$('change-summary').textContent=`${c.trimmed} cell(s) trimmed · ${c.removedDuplicates} duplicate row(s) removed · ${c.removedEmpty} empty row(s) removed. Original: ${source.rows.length} rows → Cleaned: ${cleaned.rows.length} rows.`;$('change-summary').hidden=false;$('download').disabled=false;$('cleaned').disabled=false;$('remaining').textContent=`${CSVHealth.analyse(cleaned).missing} missing cells remain. No values were invented.`;showTable(cleaned,'Cleaned');message('Clean-up preview ready. Review the data before downloading.');};
$('original').onclick=()=>source&&showTable(source,'Original');$('cleaned').onclick=()=>cleaned&&showTable(cleaned,'Cleaned');
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type}));const a=node('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
$('download').onclick=()=>{if(cleaned){download(CSVHealth.stringify(cleaned,$('protect').checked),fileName.replace(/\.csv$/i,'')+'-cleaned.csv','text/csv;charset=utf-8');message('Cleaned CSV downloaded. Your original file was not modified.');}};
$('report-download').onclick=()=>{if(!source)return;const a=CSVHealth.analyse(source);const lines=['ClearRow CSV Health Check',`File: ${fileName}`,`Data rows: ${source.rows.length}`,`Columns: ${source.headers.length}`,`Missing cells: ${a.missing}`,`Extra duplicates (after trim): ${a.duplicates}`,`Whitespace cells: ${a.spaces}`,`Empty rows: ${a.blank}`,`Mixed-format columns: ${a.mixed.map(c=>c.name).join(', ')||'None'}`,'','Observations:',...Array.from($('findings').children,e=>'- '+e.textContent)];if(cleaned)lines.push('','Cleaning preview:',$('change-summary').textContent);lines.push('','Heuristic checks only. Review before use.');download(lines.join('\r\n'),'csv-health-report.txt','text/plain;charset=utf-8');};
