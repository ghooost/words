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


function Setup() {
  const root = mkDiv('setup-content');
  storage.data.forEach(({name, data}, index) => {
    if (index === storage.curSection) {
      const item = mkDiv('setup-form', root);
      const no = mkNode('input', 'setup-name', item);
      no.value = name;
      const to = mkNode('textarea', 'setup-textarea', item);
      to.value = data.map(([ele1, ele2]) => `${ele1}: ${ele2}`).join('\n');
      const save = mkNode('a', 'setup-button', item);
      save.innerHTML = "Save"; 
      save.addEventListener('click', onSave);
      if (storage.data.length > 1) {
        const remove = mkNode('a', 'setup-button', item);
        remove.innerHTML = "Remove"; 
        remove.addEventListener('click', onRemove);
      }
    } else {
      const item = mkDiv('setup-section', root);
      item.addEventListener('click', onChangeSection(index));
      item.innerHTML = name;
    }
  })
  const add = mkDiv('setup-section', root);
  add.innerHTML = "New section"; 
  add.addEventListener('click', onAdd);
  return root;
}

onChangeSection = (index) => (ev) => {
  ev.preventDefault();
  storage.curSection = index;
  storage.indexes = [];
  saveData();
  Page();
}

function onAdd(ev) {
  ev.preventDefault();
  storage.data.push({
    name: 'New section',
    data: [['term', 'translation']],
  });
  
  storage.curSection = storage.data.length - 1;
  storage.indexes = [];
  saveData();
  Page();
}

function onSave(ev){
  ev.preventDefault();
  const name = document.querySelector('.setup-name').value;
  const data = document.querySelector('.setup-textarea').value;
  const splitReg = /\s*:\s*/;
  const arr = data.split('\n').map((item) => item.split(splitReg));
  const ready = arr.filter(([e1, e2]) => e1 && e2).map(([e1, e2]) => [e1.trim(), e2.trim()]);
  const section = storage.data[storage.curSection];
  section.name = name;
  section.data = ready;
  saveData();
  Page();
}

function onRemove(ev){
  ev.preventDefault();
  storage.data.splice(storage.curSection, 1);
  if (storage.curSection >= storage.data.length) {
    storage.curSection = storage.data.length - 1;
  }
  saveData();
  Page();
}

function Main() {
  storage.root.innerHTML = '';
  const root = mkDiv('root', storage.root);
  root.appendChild(Menu());
  const content = mkDiv('content', root);
  return content;
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
    //let's setup some default values
    data = [
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
    ];
  }
  let curSection = parseInt(localStorage.getItem('section'));
  if (!curSection || !data[curSection]) {
    curSection = 0;
  }
  storage.data = data;
  storage.curSection = curSection;
}

function saveData() {
  localStorage.setItem('words', JSON.stringify(storage.data));
  localStorage.setItem('section', storage.curSection);
}