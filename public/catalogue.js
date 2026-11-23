'use strict';
/* Static catalogue: program names only (no fees, deadlines or scores). Facts come from the live official-page check. */

var CATS = {
  cs: { label: 'MS in Computer Science', pitch: 'Builds depth in software, systems and computing. Suits engineers and anyone with strong programming.' },
  ds: { label: 'MS in Data Science or AI', pitch: 'Turns maths and programming into data and machine learning skills. Roles exist in every industry.' },
  mba: { label: 'MBA', pitch: 'Moves you into management and leadership. Most programs expect a few years of work experience.' },
  llm: { label: 'Master of Laws (LLM)', pitch: 'A one year specialisation after a law degree, often useful to practise or teach abroad.' },
  fin: { label: 'MSc in Finance', pitch: 'Prepares you for banking, investing and corporate finance roles.' },
  bio: { label: 'MS in Biotechnology', pitch: 'Applies biology to medicine, food and industry. Lab and research heavy.' },
  ph: { label: 'MS in Public Health', pitch: 'Focuses on health systems, policy and research across populations.' },
  des: { label: 'Master of Design', pitch: 'Advances design practice in product, service, interaction or communication.' },
  ba: { label: 'MS in Business Analytics', pitch: 'Combines business and data skills for analyst and consulting roles.' },
  mgt: { label: 'MSc in Management', pitch: 'A business degree for graduates with little or no work experience.' },
  eco: { label: 'MA in Economics', pitch: 'Strengthens economic theory and data skills for policy, research or a PhD.' },
  arch: { label: 'Master of Architecture', pitch: 'The professional degree route in architecture, with studio based learning.' }
};

var FIELD_CATS = {
  'Engineering or Technology': ['cs', 'ds', 'ba', 'mba', 'mgt'],
  'Law': ['llm', 'mba', 'mgt'],
  'Commerce, CA or Finance': ['fin', 'mba', 'eco', 'ba', 'mgt'],
  'Biotech or Life Sciences': ['bio', 'ph', 'ds'],
  'Medicine or Pharmacy': ['ph', 'bio', 'mba'],
  'Management or Business': ['mba', 'mgt', 'ba', 'fin'],
  'Arts, Humanities or Social Science': ['mgt', 'eco', 'des', 'ph'],
  'Design or Architecture': ['des', 'arch', 'mba'],
  'Science (Physics, Maths, Chemistry)': ['ds', 'cs', 'bio', 'eco']
};
var FIELD_SHORT = { 'Engineering or Technology': 'engineering', 'Law': 'law', 'Commerce, CA or Finance': 'commerce', 'Biotech or Life Sciences': 'biotech', 'Medicine or Pharmacy': 'medicine', 'Management or Business': 'management', 'Arts, Humanities or Social Science': 'arts and humanities', 'Design or Architecture': 'design', 'Science (Physics, Maths, Chemistry)': 'science' };

// cost: 1 lower, 2 middle, 3 higher (a general ordering of countries, not a price)
var CN = {
  USA: { cost: 3, note: 'The USA has the widest choice of programs and strong industry links.' },
  UK: { cost: 3, note: 'Most masters in the UK take one year.' },
  Canada: { cost: 2, note: 'Canada is known for welcoming international students and post-study work options.' },
  Germany: { cost: 1, note: 'Public universities in Germany are known for low tuition.' },
  Ireland: { cost: 2, note: 'Ireland is English speaking and a one year masters is common.' },
  Australia: { cost: 3, note: 'Australia has strong demand for graduates and flexible degree lengths.' },
  Netherlands: { cost: 2, note: 'Many programs in the Netherlands are taught in English.' },
  Singapore: { cost: 2, note: 'Singapore is a leading hub close to Asian markets.' },
  France: { cost: 2, note: 'France is well known for its business and design schools.' }
};

var RAW = [
  'cs|Carnegie Mellon University|MS in Computer Science|USA|Pittsburgh|1',
  'cs|Stanford University|MS in Computer Science|USA|Stanford|1',
  'cs|University of Illinois Urbana-Champaign|MS in Computer Science|USA|Urbana-Champaign|2',
  'cs|Northeastern University|MS in Computer Science|USA|Boston|3',
  'cs|Arizona State University|MS in Computer Science|USA|Tempe|3',
  'cs|University of Oxford|MSc in Computer Science|UK|Oxford|1',
  'cs|Imperial College London|MSc in Computing|UK|London|1',
  'cs|University of Edinburgh|MSc in Computer Science|UK|Edinburgh|2',
  'cs|University of Toronto|Master of Science in Applied Computing|Canada|Toronto|1',
  'cs|University of Waterloo|Master of Mathematics in Computer Science|Canada|Waterloo|1',
  'cs|University of British Columbia|MSc in Computer Science|Canada|Vancouver|1',
  'cs|Technical University of Munich|MSc in Informatics|Germany|Munich|1',
  'cs|RWTH Aachen University|MSc in Computer Science|Germany|Aachen|2',
  'cs|Trinity College Dublin|MSc in Computer Science|Ireland|Dublin|2',
  'cs|University College Dublin|MSc in Computer Science|Ireland|Dublin|2',
  'cs|University of Melbourne|Master of Science (Computer Science)|Australia|Melbourne|1',
  'cs|University of New South Wales|Master of Information Technology|Australia|Sydney|2',
  'cs|National University of Singapore|MComp in Computer Science|Singapore|Singapore|1',
  'cs|Delft University of Technology|MSc in Computer Science|Netherlands|Delft|1',
  'cs|Université Paris-Saclay|Master in Computer Science|France|Paris|2',

  'ds|Columbia University|MS in Data Science|USA|New York|1',
  'ds|University of California, Berkeley|Master of Information and Data Science|USA|Berkeley|1',
  'ds|University of Washington|MS in Data Science|USA|Seattle|2',
  'ds|Northeastern University|MS in Data Science|USA|Boston|3',
  'ds|University College London|MSc in Data Science and Machine Learning|UK|London|1',
  'ds|University of Edinburgh|MSc in Data Science, Technology and Innovation|UK|Edinburgh|2',
  'ds|University of Warwick|MSc in Data Analytics|UK|Coventry|3',
  'ds|Simon Fraser University|Professional Master\'s in Computer Science (Big Data)|Canada|Burnaby|2',
  'ds|University of Alberta|MSc in Statistical Machine Learning|Canada|Edmonton|1',
  'ds|Technical University of Munich|MSc in Data Engineering and Analytics|Germany|Munich|1',
  'ds|University of Mannheim|MSc in Data Science|Germany|Mannheim|2',
  'ds|University of Limerick|MSc in Artificial Intelligence|Ireland|Limerick|2',
  'ds|University of Sydney|Master of Data Science|Australia|Sydney|1',
  'ds|Monash University|Master of Data Science|Australia|Melbourne|2',
  'ds|National University of Singapore|MSc in Data Science and Machine Learning|Singapore|Singapore|1',
  'ds|University of Amsterdam|MSc in Artificial Intelligence|Netherlands|Amsterdam|1',
  'ds|Institut Polytechnique de Paris|Master in Data Science|France|Paris|1',

  'mba|Harvard Business School|MBA|USA|Boston|1',
  'mba|Stanford Graduate School of Business|MBA|USA|Stanford|1',
  'mba|Kellogg School of Management|MBA|USA|Evanston|1',
  'mba|McCombs School of Business, UT Austin|MBA|USA|Austin|2',
  'mba|W. P. Carey School of Business, Arizona State University|Full-time MBA|USA|Tempe|3',
  'mba|London Business School|MBA|UK|London|1',
  'mba|Saïd Business School, University of Oxford|MBA|UK|Oxford|1',
  'mba|Imperial College Business School|MBA|UK|London|2',
  'mba|Rotman School of Management, University of Toronto|MBA|Canada|Toronto|1',
  'mba|Smith School of Business, Queen\'s University|MBA|Canada|Kingston|2',
  'mba|Schulich School of Business, York University|MBA|Canada|Toronto|2',
  'mba|ESMT Berlin|MBA|Germany|Berlin|2',
  'mba|Mannheim Business School|Full-time MBA|Germany|Mannheim|2',
  'mba|UCD Michael Smurfit Graduate Business School|MBA|Ireland|Dublin|2',
  'mba|Melbourne Business School|MBA|Australia|Melbourne|1',
  'mba|AGSM, UNSW Business School|MBA|Australia|Sydney|2',
  'mba|INSEAD|MBA|France|Fontainebleau|1',
  'mba|HEC Paris|MBA|France|Jouy-en-Josas|1',
  'mba|NUS Business School|MBA|Singapore|Singapore|1',
  'mba|Nanyang Business School, NTU|MBA|Singapore|Singapore|1',
  'mba|Rotterdam School of Management, Erasmus University|MBA|Netherlands|Rotterdam|2',

  'llm|Harvard Law School|LLM|USA|Cambridge|1',
  'llm|Columbia Law School|LLM|USA|New York|1',
  'llm|NYU School of Law|LLM|USA|New York|1',
  'llm|University of Pennsylvania Carey Law School|LLM|USA|Philadelphia|1',
  'llm|University of Michigan Law School|LLM|USA|Ann Arbor|1',
  'llm|University of Cambridge|LLM|UK|Cambridge|1',
  'llm|London School of Economics and Political Science|LLM|UK|London|1',
  'llm|University College London|LLM|UK|London|1',
  'llm|King\'s College London|LLM|UK|London|2',
  'llm|University of Edinburgh|LLM|UK|Edinburgh|2',
  'llm|University of Toronto|LLM|Canada|Toronto|1',
  'llm|McGill University|LLM|Canada|Montreal|1',
  'llm|University of British Columbia|LLM|Canada|Vancouver|1',
  'llm|Osgoode Hall Law School, York University|LLM|Canada|Toronto|2',
  'llm|Bucerius Law School|LLM in Law and Business|Germany|Hamburg|2',
  'llm|Trinity College Dublin|LLM|Ireland|Dublin|2',
  'llm|University of Melbourne|Master of Laws|Australia|Melbourne|1',
  'llm|University of Sydney|Master of Laws|Australia|Sydney|2',
  'llm|National University of Singapore|LLM|Singapore|Singapore|1',
  'llm|Leiden University|LLM Advanced Studies|Netherlands|Leiden|1',
  'llm|Maastricht University|LLM|Netherlands|Maastricht|2',

  'fin|MIT Sloan School of Management|Master of Finance|USA|Cambridge|1',
  'fin|Carnegie Mellon University Tepper|MS in Computational Finance|USA|Pittsburgh|1',
  'fin|NYU Stern School of Business|MS in Quantitative Finance|USA|New York|1',
  'fin|Baruch College|MS in Financial Engineering|USA|New York|2',
  'fin|Boston College Carroll School of Management|MS in Finance|USA|Chestnut Hill|2',
  'fin|London School of Economics and Political Science|MSc Finance|UK|London|1',
  'fin|Imperial College Business School|MSc Finance|UK|London|1',
  'fin|Warwick Business School|MSc Finance|UK|Coventry|2',
  'fin|Bayes Business School (formerly Cass)|MSc Finance|UK|London|2',
  'fin|University of Manchester|MSc Finance|UK|Manchester|3',
  'fin|Rotman School of Management, University of Toronto|Master of Finance|Canada|Toronto|1',
  'fin|Smith School of Business, Queen\'s University|Master of Finance|Canada|Kingston|2',
  'fin|Frankfurt School of Finance and Management|MSc in Finance|Germany|Frankfurt|1',
  'fin|UCD Michael Smurfit Graduate Business School|MSc in Finance|Ireland|Dublin|2',
  'fin|University of Melbourne|Master of Finance|Australia|Melbourne|1',
  'fin|UNSW Business School|Master of Finance|Australia|Sydney|2',
  'fin|Nanyang Technological University|MSc in Financial Engineering|Singapore|Singapore|1',
  'fin|HEC Paris|MSc in International Finance|France|Paris|1',
  'fin|ESSEC Business School|MSc in Finance|France|Cergy|2',
  'fin|Erasmus University Rotterdam|MSc in Finance and Investments|Netherlands|Rotterdam|1',

  'bio|Johns Hopkins University|MS in Biotechnology|USA|Baltimore|1',
  'bio|University of Pennsylvania|Master of Biotechnology|USA|Philadelphia|1',
  'bio|Northeastern University|MS in Biotechnology|USA|Boston|3',
  'bio|University of Manchester|MSc in Biotechnology|UK|Manchester|2',
  'bio|University of Toronto|Master of Biotechnology|Canada|Toronto|1',
  'bio|Technical University of Munich|MSc in Molecular Biotechnology|Germany|Munich|1',
  'bio|Technische Universität Dresden|MSc in Molecular Bioengineering|Germany|Dresden|2',
  'bio|Dublin City University|MSc in Biotechnology|Ireland|Dublin|2',
  'bio|University of Melbourne|Master of Biotechnology|Australia|Melbourne|1',
  'bio|Monash University|Master of Biotechnology and Bioinformatics|Australia|Melbourne|2',
  'bio|Wageningen University|MSc in Biotechnology|Netherlands|Wageningen|1',

  'ph|Johns Hopkins Bloomberg School of Public Health|MPH|USA|Baltimore|1',
  'ph|Harvard T.H. Chan School of Public Health|MPH|USA|Boston|1',
  'ph|Columbia Mailman School of Public Health|MPH|USA|New York|1',
  'ph|University of Michigan School of Public Health|MPH|USA|Ann Arbor|1',
  'ph|Boston University School of Public Health|MPH|USA|Boston|2',
  'ph|George Washington University|MPH|USA|Washington DC|3',
  'ph|London School of Hygiene and Tropical Medicine|MSc in Public Health|UK|London|1',
  'ph|University of Edinburgh|MSc in Public Health|UK|Edinburgh|2',
  'ph|University of Glasgow|MPH|UK|Glasgow|2',
  'ph|University of Toronto Dalla Lana School of Public Health|MPH|Canada|Toronto|1',
  'ph|University of British Columbia|MPH|Canada|Vancouver|1',
  'ph|University of Alberta|MPH|Canada|Edmonton|2',
  'ph|Berlin School of Public Health|MPH|Germany|Berlin|1',
  'ph|University College Dublin|MPH|Ireland|Dublin|2',
  'ph|Trinity College Dublin|MPH|Ireland|Dublin|2',
  'ph|University of Melbourne|Master of Public Health|Australia|Melbourne|1',
  'ph|University of Sydney|Master of Public Health|Australia|Sydney|1',
  'ph|National University of Singapore|Master of Public Health|Singapore|Singapore|1',
  'ph|Maastricht University|MSc in Global Health|Netherlands|Maastricht|2',
  'ph|EHESP School of Public Health|Master of Public Health|France|Rennes|2',

  'des|Carnegie Mellon University|Master of Design|USA|Pittsburgh|1',
  'des|Rhode Island School of Design|Master of Industrial Design|USA|Providence|1',
  'des|Parsons School of Design|MFA in Design and Technology|USA|New York|1',
  'des|Pratt Institute|Master of Industrial Design|USA|New York|2',
  'des|Royal College of Art|MA in Innovation Design Engineering|UK|London|1',
  'des|Central Saint Martins, University of the Arts London|MA in Industrial Design|UK|London|1',
  'des|Glasgow School of Art|MDes in Innovation and Design|UK|Glasgow|2',
  'des|OCAD University|Master of Design in Strategic Foresight and Innovation|Canada|Toronto|2',
  'des|Emily Carr University of Art and Design|Master of Design|Canada|Vancouver|2',
  'des|Köln International School of Design|MA in Integrated Design|Germany|Cologne|1',
  'des|RMIT University|Master of Design Futures|Australia|Melbourne|2',
  'des|UNSW Art and Design|Master of Design|Australia|Sydney|2',
  'des|LASALLE College of the Arts|MA in Design Communication|Singapore|Singapore|2',
  'des|Design Academy Eindhoven|Master in Information Design|Netherlands|Eindhoven|1',
  'des|Delft University of Technology|MSc in Design for Interaction|Netherlands|Delft|1',
  'des|Strate School of Design|MSc in Design|France|Paris|2',

  'ba|MIT Sloan School of Management|Master of Business Analytics|USA|Cambridge|1',
  'ba|Carnegie Mellon University Tepper|MS in Business Analytics|USA|Pittsburgh|1',
  'ba|McCombs School of Business, UT Austin|MS in Business Analytics|USA|Austin|1',
  'ba|USC Marshall School of Business|MS in Business Analytics|USA|Los Angeles|1',
  'ba|Carlson School of Management, University of Minnesota|MS in Business Analytics|USA|Minneapolis|2',
  'ba|Imperial College Business School|MSc in Business Analytics|UK|London|1',
  'ba|University College London|MSc in Business Analytics|UK|London|1',
  'ba|Warwick Business School|MSc in Business Analytics|UK|Coventry|2',
  'ba|University of Edinburgh|MSc in Business Analytics|UK|Edinburgh|2',
  'ba|University of Manchester|MSc in Business Analytics|UK|Manchester|3',
  'ba|Desautels Faculty of Management, McGill University|Master of Management in Analytics|Canada|Montreal|1',
  'ba|Rotman School of Management, University of Toronto|Master of Business Analytics|Canada|Toronto|1',
  'ba|Schulich School of Business, York University|Master of Business Analytics|Canada|Toronto|2',
  'ba|UCD Michael Smurfit Graduate Business School|MSc in Business Analytics|Ireland|Dublin|1',
  'ba|Trinity Business School|MSc in Business Analytics|Ireland|Dublin|1',
  'ba|University of Sydney|Master of Business Analytics|Australia|Sydney|1',
  'ba|University of Melbourne|Master of Business Analytics|Australia|Melbourne|1',
  'ba|Monash Business School|Master of Business Analytics|Australia|Melbourne|2',
  'ba|NUS Business School|MSc in Business Analytics|Singapore|Singapore|1',
  'ba|Nanyang Business School, NTU|MSc in Business Analytics|Singapore|Singapore|1',
  'ba|Rotterdam School of Management, Erasmus University|MSc in Business Information Management|Netherlands|Rotterdam|1',
  'ba|ESSEC Business School|MSc in Data Science and Business Analytics|France|Cergy|1',
  'ba|HEC Paris|MSc in Data Science for Business|France|Paris|1',

  'mgt|London School of Economics and Political Science|MSc Management|UK|London|1',
  'mgt|Imperial College Business School|MSc Management|UK|London|1',
  'mgt|University College London|MSc Management|UK|London|1',
  'mgt|Warwick Business School|MSc Management|UK|Coventry|2',
  'mgt|University of Edinburgh|MSc Management|UK|Edinburgh|2',
  'mgt|University of Manchester|MSc Management|UK|Manchester|3',
  'mgt|Trinity Business School|MSc Management|Ireland|Dublin|1',
  'mgt|UCD Michael Smurfit Graduate Business School|MSc International Management|Ireland|Dublin|2',
  'mgt|ESSEC Business School|Master in Management|France|Cergy|1',
  'mgt|EDHEC Business School|MSc in Management|France|Lille|2',
  'mgt|Mannheim Business School|MSc Management|Germany|Mannheim|1',
  'mgt|WHU Otto Beisheim School of Management|MSc in Management|Germany|Vallendar|1',
  'mgt|ESMT Berlin|MSc in Management|Germany|Berlin|1',
  'mgt|Frankfurt School of Finance and Management|MSc in Management|Germany|Frankfurt|2',
  'mgt|University of Amsterdam|MSc in Business Administration|Netherlands|Amsterdam|1',
  'mgt|Maastricht University|MSc in International Business|Netherlands|Maastricht|2',
  'mgt|Tilburg University|MSc in Strategic Management|Netherlands|Tilburg|2',
  'mgt|Ivey Business School|MSc in Management|Canada|London|1',
  'mgt|Smith School of Business, Queen\'s University|Master of Management|Canada|Kingston|2',
  'mgt|HEC Montréal|MSc in Business Administration|Canada|Montreal|2',
  'mgt|Duke University Fuqua School of Business|Master of Management Studies|USA|Durham|1',
  'mgt|Gies College of Business, University of Illinois|MS in Management|USA|Champaign|2',
  'mgt|University of Sydney|Master of Management|Australia|Sydney|2',
  'mgt|NUS Business School|MSc in Management|Singapore|Singapore|1',

  'eco|Duke University|MA in Economics|USA|Durham|1',
  'eco|University of Rochester|MA in Economics|USA|Rochester|1',
  'eco|Johns Hopkins University|MA in Applied Economics|USA|Baltimore|2',
  'eco|Boston University|MA in Economics|USA|Boston|2',
  'eco|London School of Economics and Political Science|MSc Economics|UK|London|1',
  'eco|University of Oxford|MSc in Economics for Development|UK|Oxford|1',
  'eco|University of Warwick|MSc Economics|UK|Coventry|1',
  'eco|University College London|MSc Economics|UK|London|1',
  'eco|University of Edinburgh|MSc Economics|UK|Edinburgh|2',
  'eco|University of Manchester|MSc Economics|UK|Manchester|3',
  'eco|University of Toronto|MA in Economics|Canada|Toronto|1',
  'eco|University of British Columbia|MA in Economics|Canada|Vancouver|1',
  'eco|Queen\'s University|MA in Economics|Canada|Kingston|2',
  'eco|McMaster University|MA in Economics|Canada|Hamilton|2',
  'eco|University of Bonn|MSc in Economics|Germany|Bonn|1',
  'eco|University of Mannheim|MSc in Economics|Germany|Mannheim|1',
  'eco|Ludwig Maximilian University of Munich|MSc in Economics|Germany|Munich|1',
  'eco|University College Dublin|MSc in Economics|Ireland|Dublin|2',
  'eco|Trinity College Dublin|MSc in Economics|Ireland|Dublin|2',
  'eco|Australian National University|Master of Economics|Australia|Canberra|1',
  'eco|University of Melbourne|Master of Economics|Australia|Melbourne|1',
  'eco|National University of Singapore|Master of Social Sciences in Economics|Singapore|Singapore|1',
  'eco|Erasmus University Rotterdam|MSc in Economics and Business|Netherlands|Rotterdam|1',
  'eco|University of Amsterdam|MSc in Economics|Netherlands|Amsterdam|1',
  'eco|Tilburg University|MSc in Economics|Netherlands|Tilburg|2',
  'eco|Paris School of Economics|Master in Analysis and Policy in Economics|France|Paris|1',
  'eco|Toulouse School of Economics|MSc in Economics|France|Toulouse|1',

  'arch|Columbia GSAPP|MS in Advanced Architectural Design|USA|New York|1',
  'arch|Harvard Graduate School of Design|Master of Architecture|USA|Cambridge|1',
  'arch|Massachusetts Institute of Technology|Master of Architecture|USA|Cambridge|1',
  'arch|University of Michigan Taubman College|Master of Architecture|USA|Ann Arbor|2',
  'arch|Illinois Institute of Technology|Master of Architecture|USA|Chicago|2',
  'arch|The Bartlett, University College London|MArch Architecture|UK|London|1',
  'arch|University of Manchester|MArch Architecture|UK|Manchester|2',
  'arch|University of Sheffield|MArch Architecture|UK|Sheffield|2',
  'arch|University of Toronto|Master of Architecture|Canada|Toronto|1',
  'arch|McGill University|Master of Architecture|Canada|Montreal|1',
  'arch|University of British Columbia|Master of Architecture|Canada|Vancouver|1',
  'arch|University of Waterloo|Master of Architecture|Canada|Cambridge|2',
  'arch|Technical University of Munich|MSc in Architecture|Germany|Munich|1',
  'arch|RWTH Aachen University|MSc in Architecture|Germany|Aachen|2',
  'arch|Technische Universität Berlin|MSc in Architecture|Germany|Berlin|2',
  'arch|University College Dublin|Master of Architecture|Ireland|Dublin|1',
  'arch|Technological University Dublin|Master of Architecture|Ireland|Dublin|2',
  'arch|University of Melbourne|Master of Architecture|Australia|Melbourne|1',
  'arch|UNSW Built Environment|Master of Architecture|Australia|Sydney|2',
  'arch|RMIT University|Master of Architecture|Australia|Melbourne|2',
  'arch|National University of Singapore|Master of Architecture|Singapore|Singapore|1',
  'arch|Delft University of Technology|MSc in Architecture, Urbanism and Building Sciences|Netherlands|Delft|1',
  'arch|Eindhoven University of Technology|MSc in Architecture, Building and Planning|Netherlands|Eindhoven|2'
];

function slugOf(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''); }
var PLIST = [], PROGS = {};
RAW.forEach(function (line, i) {
  var a = line.split('|');
  var o = { id: a[0] + '-' + slugOf(a[1]), cat: a[0], university: a[1], program: a[2], country: a[3], city: a[4], tier: +a[5], order: i };
  PLIST.push(o); PROGS[o.id] = o;
});

function fieldKey(f) {
  if (FIELD_CATS[f]) return f;
  var t = String(f || '').toLowerCase();
  if (/\blaw|legal|llb/.test(t)) return 'Law';
  if (/commerce|account|financ|\bca\b|bcom|chartered/.test(t)) return 'Commerce, CA or Finance';
  if (/bio|life sci|genetic|microbio|zoology|botany/.test(t)) return 'Biotech or Life Sciences';
  if (/medic|pharm|nurs|dental|mbbs|health/.test(t)) return 'Medicine or Pharmacy';
  if (/design|architect/.test(t)) return 'Design or Architecture';
  if (/manage|business|bba|marketing/.test(t)) return 'Management or Business';
  if (/\bart|human|social|psych|english|histor|journal|media|politic/.test(t)) return 'Arts, Humanities or Social Science';
  if (/phys|math|chem|statist|science/.test(t)) return 'Science (Physics, Maths, Chemistry)';
  if (/engineer|tech|comput|software|electr|mechan|civil|\bit\b/.test(t)) return 'Engineering or Technology';
  return 'Management or Business';
}
function catOfCourse(text) {
  var t = String(text || '').toLowerCase();
  for (var k in CATS) if (CATS[k].label.toLowerCase() === t) return k;
  if (/\bmba\b/.test(t)) return 'mba';
  if (/\bllm\b|\blaw/.test(t)) return 'llm';
  if (/public health|\bmph\b/.test(t)) return 'ph';
  if (/analytic/.test(t)) return 'ba';
  if (/data|machine|artificial|\bai\b/.test(t)) return 'ds';
  if (/comput|software|informatic/.test(t)) return 'cs';
  if (/financ/.test(t)) return 'fin';
  if (/biotech|bioinf/.test(t)) return 'bio';
  if (/design/.test(t)) return 'des';
  if (/economic/.test(t)) return 'eco';
  if (/architect/.test(t)) return 'arch';
  if (/manage/.test(t)) return 'mgt';
  return null;
}
function normCountry(t) {
  var s = String(t || '').trim().toLowerCase();
  if (/^(usa|us|u\.s\.a?\.?|united states.*|america)$/.test(s)) return 'USA';
  if (/^(uk|u\.k\.|united kingdom|england|britain|great britain|scotland)$/.test(s)) return 'UK';
  for (var k in CN) if (k.toLowerCase() === s) return k;
  return String(t || '').trim();
}

function scoreProg(pr, p) {
  var s = 0, cn = CN[pr.country] || { cost: 2 }, m = p.marks || '', b = p.budget || '', pri = p.priority || '', w = p.workYears || '';
  if (/Above 80/.test(m)) s += pr.tier === 1 ? 3 : pr.tier === 2 ? 1 : 0;
  else if (/65 to 80/.test(m)) s += pr.tier === 2 ? 3 : 1;
  else if (/Below 65/.test(m)) s += pr.tier === 3 ? 3 : pr.tier === 2 ? 2 : 0;
  else s += pr.tier === 2 ? 1 : 0;
  if (/job|name/i.test(pri)) s += pr.tier === 1 ? 2 : 0;
  if (/cost/i.test(pri)) s += cn.cost === 1 ? 3 : cn.cost === 2 ? 1 : 0;
  if (/short/i.test(pri)) s += (pr.country === 'UK' || pr.country === 'Ireland') ? 2 : 0;
  if (/Under 15/.test(b)) s += cn.cost === 1 ? 4 : cn.cost === 2 ? 1 : -2;
  else if (/15 to 30/.test(b)) s += cn.cost === 3 ? -1 : 1;
  if (pr.cat === 'mba') { if (/None/.test(w)) s -= 3; else if (/2 years or more/.test(w)) s += 2; }
  return s;
}
function rankProgs(list, p) {
  return list.map(function (x) { return { x: x, s: scoreProg(x, p) }; }).sort(function (a, b) { return b.s - a.s || a.x.order - b.x.order; }).map(function (o) { return o.x; });
}
function reasonOf(pr, p) {
  var fk = fieldKey(p.field), cn = CN[pr.country] || {};
  var lead = (p.courseDecided === 'yes' && catOfCourse(p.course) === pr.cat) ? 'Matches the course you chose.' : 'A common path for ' + (FIELD_SHORT[fk] || 'your') + ' graduates.';
  var extra = cn.note || '';
  if (pr.cat === 'mba' && /None/.test(p.workYears || '')) extra = 'Most MBA programs expect some work experience, so check this one early.';
  return lead + ' ' + extra;
}

// Build the home rows from the student's answers. No network calls.
function buildRows(p, not, customIds) {
  not = not || [];
  var fk = fieldKey(p.field), mapped = FIELD_CATS[fk].slice();
  var cat = p.courseDecided === 'yes' ? catOfCourse(p.course) : null;
  var custom = p.courseDecided === 'yes' && !cat;
  var country = p.countryDecided === 'yes' ? normCountry(p.country) : '';
  var avail = PLIST.filter(function (x) { return not.indexOf(x.id) < 0; });
  function ofCat(c) { return avail.filter(function (x) { return x.cat === c; }); }
  function ids(l) { return l.map(function (x) { return x.id; }); }
  var rows = [];

  function relatedRow(exclude) {
    var cats = mapped.filter(function (c) { return c !== exclude; }), pool = [];
    var lists = cats.map(function (c) { var l = rankProgs(ofCat(c).filter(function (x) { return !country || x.country === country; }), p); return l.length ? l : rankProgs(ofCat(c), p); });
    for (var i = 0; i < 3; i++) lists.forEach(function (l) { if (l[i]) pool.push(l[i]); });
    return { id: 'related', title: 'Related courses for your background', sub: 'Other degrees that suit ' + (FIELD_SHORT[fk] || 'your') + ' graduates', ids: ids(pool).slice(0, 14) };
  }

  if (cat) {
    var a = rankProgs(ofCat(cat).filter(function (x) { return !country || x.country === country; }), p), sub = CATS[cat].label + (country ? ' in ' + country : ' around the world');
    if (country && a.length < 4) {
      var more = rankProgs(ofCat(cat).filter(function (x) { return x.country !== country; }), p);
      a = a.concat(more).slice(0, 14); sub = 'Few ' + CATS[cat].label + ' programs matched ' + country + ', so Buddy added nearby options';
    }
    rows.push({ id: 'fit', title: 'Picked for you', sub: sub, ids: ids(a).slice(0, 14) });
    if (country) rows.push({ id: 'other', title: 'The same course in other countries', sub: CATS[cat].label, ids: ids(rankProgs(ofCat(cat).filter(function (x) { return x.country !== country; }), p)).slice(0, 14) });
    else rows.push({ id: 'cheap', title: 'Lower cost places to study this course', sub: 'Countries that usually cost less overall', ids: ids(rankProgs(ofCat(cat).filter(function (x) { return (CN[x.country] || {}).cost <= 2; }), p)).slice(0, 14) });
    rows.push(relatedRow(cat));
  } else if (custom) {
    rows.push({ id: 'custom', llm: true, title: 'Picked for you', sub: 'Programs for ' + p.course, ids: customIds || [] });
    rows.push(relatedRow(null));
  } else {
    mapped.slice(0, 3).forEach(function (c) {
      var l = rankProgs(ofCat(c).filter(function (x) { return !country || x.country === country; }), p);
      if (l.length < 4) l = l.concat(rankProgs(ofCat(c).filter(function (x) { return country && x.country !== country; }), p));
      rows.push({ id: 'cat-' + c, title: CATS[c].label, sub: CATS[c].pitch, ids: ids(l).slice(0, 14) });
    });
  }
  return rows;
}

/* ---- static answers and checklists ---- */
var DEFAULT_CHECK = [
  { title: 'Statement of purpose', kind: 'sop', note: 'Written with Buddy, using your own story' },
  { title: 'Resume', kind: 'resume', note: null },
  { title: 'Transcripts and degree certificates', kind: 'transcripts', note: null },
  { title: 'Recommendation letters', kind: 'lor', note: 'Usually two. Ask your referees early.' },
  { title: 'Entrance and English tests', kind: 'tests', note: 'Check the college page for the tests it accepts.' },
  { title: 'Online application form', kind: 'form', note: null },
  { title: 'Application fee', kind: 'fee', note: null }
];
var INTERVIEW_BASE = [
  'Tell us about yourself and why you chose this course.',
  'Why {university}, and why this program?',
  'Describe your strongest project or piece of work. What was your own part?',
  'Tell us about a time something went wrong and what you did next.',
  'Where do you see yourself in five years?',
  'Why study in {country} and not at home?',
  'What will you bring to the class?',
  'Do you have any questions for us?'
];
var INTERVIEW_CAT = {
  cs: ['Explain a technical project you built, step by step.', 'How do you approach a bug you have never seen before?'],
  ds: ['How would you explain a model you built to someone who is not technical?', 'Give an example of data that can be misleading.'],
  mba: ['Describe a time you led a team through a disagreement.', 'What did your work experience teach you that changed how you work?'],
  llm: ['Pick a legal issue you care about and explain both sides.', 'Why do you want to specialise in this area of law?'],
  fin: ['Explain a recent market event and what it means for investors.', 'What does cash flow tell you that profit does not?'],
  bio: ['Describe a lab technique you know well and where it can fail.', 'Which problem in biotechnology would you like to work on, and why?'],
  ph: ['Pick a health problem in India. How would you measure it?', 'How would you convince a community to adopt a new health practice?'],
  des: ['Walk us through one design from problem to final result.', 'How do you handle feedback you disagree with?'],
  ba: ['How would you use data to improve a business decision?', 'Describe a time you found a pattern in data. What did you do with it?'],
  mgt: ['Describe a team situation where you took the initiative.', 'What kind of manager do you want to become?'],
  eco: ['Explain a recent policy and its likely effects using economic reasoning.', 'Which economic question would you like to research?'],
  arch: ['Walk us through a project in your portfolio.', 'What does good architecture mean to you?']
};
function interviewQs(pr) {
  var q = INTERVIEW_BASE.slice(0, 6).concat(INTERVIEW_CAT[pr.cat] || []).concat(INTERVIEW_BASE.slice(6));
  return q.map(function (t) { return t.replace('{university}', pr.university).replace('{country}', pr.country || 'another country'); });
}
