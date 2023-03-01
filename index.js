document.addEventListener("DOMContentLoaded", install);

const storage = {
  data: [],
  curSection: 0,
  curPage: '',
  root: null,
  contentRoot: null,
  indexes: [],
};

function install() {
  storage.root = document.querySelector('#app');
  if (storage.root) {
    loadData();
    storage.curPage = 'test';
    Page();
  }
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

function Content() {
  const root = mkDiv('content');
  storage.contentRoot = root;
  if (storage.curPage === 'test') {
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
        storage.contentRoot.innerHTML='';
        storage.contentRoot.appendChild(Card());
      } else {
        ev.target.classList.add('card-content-variants-item-wrong');
      }
    }
  })
  return root;
}

function dataToText(data) {
  let ret = '';
  data.forEach(({name, data}) => {
    ret += name + '\n';
    ret += data.map(([w1, w2]) => `${w1}: ${w2}`).join('\n') + '\n';
  })
  return ret;
}

function textToData(text) {
  const strs = text.split('\n');
  const data = [];
  let pairs = [];
  let name = '';
  strs.forEach((str) => {
    const parts = str.trim().split(/\s*:\s*/);
    if (parts.length === 1 && parts[0].length) {
      if (name && pairs.length) {
        data.push({
          name,
          data: pairs,
        });
      };
      name = parts[0];
      pairs = [];
  } else if(parts.length === 2) {
      pairs.push([...parts]);
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
  gs.innerHTML = 'Edit collections';
  const to = mkNode('textarea', 'setup-textarea', service);
  to.value = dataToText(storage.data);
  const sr = mkDiv('setup-section-content', service);
  const save = mkNode('a', 'setup-button', sr);
  save.innerHTML = "Save"; 
  save.addEventListener('click', onSave);
  const download = mkDiv('setup-button', sr);
  download.innerHTML = "Download"; 
  download.addEventListener('click', onDownload);
  const reset = mkDiv('setup-button', sr);
  reset.innerHTML = "Reset to default"; 
  reset.addEventListener('click', onReset);
  return root;
}

function onDownload(ev) {
  ev.preventDefault();
  const link = document.createElement("a");
  const file = new Blob([dataToText(storage.data)], { type: 'text/plain' });
  link.href = URL.createObjectURL(file);
  link.download = "words.txt";
  link.click();
  URL.revokeObjectURL(link.href);
}

function onReset(ev) {
  ev.preventDefault();
  if (!confirm("All custom collections will be removed. Proceed?")) {
    return;
  }
  storage.data = getDefaultData();
  storage.curSection = 0;
  saveData();
  Page();
}

onChangeSection = (index) => (ev) => {
  ev.preventDefault();
  storage.curSection = index;
  storage.indexes = [];
  saveData();
  Page();
}

function onSave(ev) {
  ev.preventDefault();
  const str = document.querySelector('.setup-textarea').value;
  const data = textToData(str);
  if (storage.curSection >= data.length) {
    storage.curSection = 0;
  }
  storage.data = data;
  storage.indexes = [];
  saveData();
  Page();
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

function loadData() {
  let data = null;
  try {
    data = JSON.parse(localStorage.getItem('words'));
  } catch (e) {};

  if (!data || !Array.isArray(data) || data.length === 0 || !data[0].name) {
    data = getDefaultData();
  };
  let curSection = parseInt(localStorage.getItem('section'));
  if (!curSection || !data[curSection]) {
    curSection = 0;
  }
  storage.data = data;
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
  localStorage.setItem('words', JSON.stringify(storage.data));
  localStorage.setItem('section', storage.curSection);
}