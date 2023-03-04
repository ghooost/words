document.addEventListener("DOMContentLoaded", install);

const storage = {
  data: [],
  curSection: 0,
  curPage: '',
  root: null,
  contentRoot: null,
  indexes: [],
  score:[],
  spreadsheetId: '',
};

function install() {
  storage.root = document.querySelector('#app');
  if (storage.root) {
    storage.curPage = 'test';
    Loading();
    loadDataFromGSheet();
  }
}

function Loading() {
  storage.root.innerHTML = '';
}

function Page() {
  storage.root.innerHTML = '';
  const root = mkDiv('root', storage.root);
  root.appendChild(Menu());
  root.appendChild(Content());
}

function Menu(){
  const root = mkDiv('menu');
  root.appendChild(MenuItem(
    'Setup',
    storage.curPage === 'setup',
    () => {storage.curPage = 'setup'; Page();},
  ));
  root.appendChild(MenuItem(
    storage.data[storage.curSection].name,
    storage.curPage === 'test',
    () => {storage.curPage = 'test'; Page();},
  ));
  if (storage.curPage === 'test') {
    root.appendChild(Score());
  }
  return root;
}

function MenuItem(name, isActive, callback){
  const root = mkDiv('menu-item');
  root.innerHTML = name;
  if (isActive) {
    root.classList.add('menu-item-selected');
  }
  root.addEventListener('click', (ev) => {
    ev.preventDefault();
    callback();
  });
  return root;
}

function Score() {
  let score = 0;
  if (storage.score.length > 1) {
    const {pos, neg} = storage.score.reduce((acc, i) => {
      acc.pos += (i > 0);
      acc.neg += (i < 0);
      return acc;
    }, {pos: 0, neg: 0});
    score = (pos / storage.score.length * 100).toFixed(1);
  }
  let root = storage.root.querySelector('.menu-item-score');
  if (!root) {
    root = mkDiv('menu-item');
    root.classList.add('menu-item-score');
  };
  if (storage.score.length < storage.data[storage.curSection].data.length) {
    root.classList.add('menu-item-score-low-statistic');
  };
  root.innerHTML = `Score: ${score}%`;
  return root;
}

function Content() {
  const root = mkDiv('content');
  storage.contentRoot = root;
  if (storage.curPage === 'test') {
    storage.score = [];
    root.appendChild(Card());
  } else {
    root.appendChild(Setup());
  }
  return root;
}


function Card() {
  const section = storage.data[storage.curSection];
  if (!section.data.length) {
    const root = mkDiv('card-note', content);
    root.innerHTML = 'Setup words first';
    return;
  }
  if (storage.indexes.length === 0) {
    storage.indexes = section.data.map((_, i) => i);
  }
  const i = Math.floor(Math.random() * 10000) % storage.indexes.length;
  const index = storage.indexes[i];
  storage.indexes.splice(i, 1);
  const card = Math.random() > 0.5 
    ? CardFirst(index, section)
    : CardSecond(index, section);

  return card;
}

function CardFirst(index, section) {
  const [w1, w2] = section.data[index];
  const indexes = section.data.map((_, i) => i).filter((i) => i!==index);
  const variants = [w2];
  while(variants.length < 5 && indexes.length > 0) {
    const i = Math.floor(Math.random() * 10000) % indexes.length;
    variants.push(section.data[indexes[i]][1]);
    indexes.splice(i, 1);
  }
  variants.forEach((item, index) => {
    const i = Math.floor(Math.random() * 10000) % variants.length;
    variants[index] = variants[i];
    variants[i] = item;
  });
  return CardVariant(w1, w2, variants);
}

function CardSecond(index, section) {
  const [w2, w1] = section.data[index];
  const indexes = section.data.map((_, i) => i).filter((i) => i!==index);
  const variants = [w2];
  while(variants.length < 5 && indexes.length > 0) {
    const i = Math.floor(Math.random() * 10000) % indexes.length;
    variants.push(section.data[indexes[i]][0]);
    indexes.splice(i, 1);
  }
  variants.forEach((item, index) => {
    const i = Math.floor(Math.random() * 10000) % variants.length;
    variants[index] = variants[i];
    variants[i] = item;
  });
  return CardVariant(w1, w2, variants);
}


function CardVariant(quest, answer, variants) {
  const root = mkDiv('card');
  const content = mkDiv('card-content', root);
  const w = mkDiv('card-content-word', content);
  w.innerHTML = quest;
  if (quest.length < 7) {
    w.classList.add('card-content-word-short');
  }
  const wrap = mkDiv('card-content-variants', root);
  variants.forEach((item) => {
    const a = mkNode('a', 'card-content-variants-item', wrap);
    a.innerHTML = item;
  });
  wrap.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (ev.target.className === 'card-content-variants-item'){
      if (ev.target.innerHTML === answer) {
        changeScore(1);
        storage.contentRoot.innerHTML='';
        storage.contentRoot.appendChild(Card());
      } else {
        changeScore(-1);
        ev.target.classList.add('card-content-variants-item-wrong');
      }
    }
  })
  return root;
}

function changeScore(value){
  storage.score.push(value);
  const maxLen = storage.data[storage.curSection].data.length * 2;
  if (storage.score.length > maxLen) {
    storage.score.splice(maxLen, maxLen - storage.score.length);
  }
  Score();
}

function extractJsonCell(row, index) {
  if (!row || !row.c) {
    return '';
  }
  if (row.c.length <= index) {
    return '';
  }
  if (!row.c[index].v) {
    return '';
  }
  return row.c[index].v;
}

function jsonToData(inData) {
  const rows = inData.table.rows;
  const data = [];
  let pairs = [];
  let name = '';
  rows.forEach((row) => {
    const l1 = extractJsonCell(row, 0);
    const l2 = extractJsonCell(row, 1);
    if (l1 && !l2) {
      if (name && pairs.length) {
        data.push({
          name,
          data: pairs,
        });
      };
      name = l1;
      pairs = [];
  } else if(l1 && l2) {
      pairs.push([l1, l2]);
    }
  });
  if (name && pairs.length) {
    data.push({
      name,
      data: pairs,
    });
  }
  return data;
}


function Setup() {
  const root = mkDiv('setup-content');
  const groups = mkDiv('setup-section', root);
  const gt = mkNode('h2', 'setup-section-title', groups);
  gt.innerHTML = 'Choose active collection';
  const gr = mkDiv('setup-section-content', groups);
  storage.data.forEach(({name}, index) => {
    const a = mkNode('a', 'setup-button', gr);
    if (index === storage.curSection) {
      a.classList.add('setup-button-active');
    }
    a.innerHTML = name;
    a.addEventListener('click', onChangeSection(index));
  })
  const service = mkDiv('setup-section', root);
  const gs = mkNode('h2', 'setup-section-title', service);
  gs.innerHTML = 'You need to allow access to the sheet for everybody';
  const to = mkNode('input', 'setup-link', service);
  to.placeholder = 'Link to your Google sheet with collections'
  if (storage.spreadsheetId) {
    to.value = `https://docs.google.com/spreadsheets/d/${storage.spreadsheetId}/edit?usp=sharing`;
  }
  const sr = mkDiv('setup-section-content', service);
  const save = mkNode('a', 'setup-button', sr);
  save.innerHTML = "Save"; 
  save.addEventListener('click', onSave);
  return root;
}

onChangeSection = (index) => (ev) => {
  ev.preventDefault();
  storage.curSection = index;
  storage.indexes = [];
  storage.score = [];
  saveData();
  Page();
}

function onSave(ev) {
  ev.preventDefault();
  const str = document.querySelector('.setup-link').value;
  const match = str.match(/https:\/\/docs.google.com\/spreadsheets\/d\/([^\/]+)\//i);
  if (match && match.length > 1 && match[1]) {
    storage.spreadsheetId = match[1];
  } else {
    storage.data = getDefaultData();
    storage.curSection = 0;
  }
  storage.indexes = [];
  Loading();  
  saveData();
  loadDataFromGSheet();
}

function mkDiv(className, parentNode) {
  return mkNode('div', className, parentNode);
}

function mkNode(nodeType, className, parentNode) {
  const node = document.createElement(nodeType);
  if (className) {
    node.className = className;
  }
  if (parentNode) {
    parentNode.appendChild(node);
  }
  return node;
}

function loadSection() {
  let curSection = parseInt(localStorage.getItem('section'));
  if (!curSection || storage.data.length >= curSection) {
    curSection = 0;
  }
  storage.curSection = curSection;
}

function getDefaultData() {
  return [
    {
      name: 'Finnish numbers',
      data: [
        ['yksi', 'one'],
        ['kaksi', 'two'],
        ['kolme', 'three'],
        ['neljä', 'four'],
        ['viisi', 'five'],
        ['kuusi', 'six'],
        ['seitsemän', 'seven'],
        ['kahdeksan', 'eight'],
        ['yhdeksän', 'nine'],
        ['kymmenen', 'ten'],
      ],
    },
    {
      name: 'Finnish weekdays',
      data: [
        ['maanantai', 'Monday'],
        ['tiistai', 'Tuesday'],
        ['keskiviikko', 'Wednesday'],
        ['torstai', 'Thursday'],
        ['perjantai', 'Friday'],
        ['lauantai', 'Saturday'],
        ['sunnuntai', 'Sunday'],
      ],
    },
  ];
}

function saveData() {
  localStorage.setItem('section', storage.curSection);
  localStorage.setItem('spreadsheetId', storage.spreadsheetId);
}

const google = {
  visualization: {
    Query: {
      setResponse: (data) => {
        try {
          storage.data = jsonToData(data);
          console.log(storage.data);
        } catch (err) {
          console.log(err);
          storage.data = getDefaultData();
        }
        loadSection();
        Page();
      }
    }
  }
};

function loadDataFromGSheet() {
  storage.spreadsheetId = localStorage.getItem('spreadsheetId');
  if (!storage.spreadsheetId) {
    storage.data = getDefaultData();
    loadSection();
    Page();
    return;
  }
  const url = `https://docs.google.com/spreadsheets/d/${storage.spreadsheetId}/gviz/tq?tqx=out:json&sheet=&tq=select%20*`;
  const node = document.createElement('script');
  node.src = url;
  document.head.appendChild(node);
}
