document.addEventListener("DOMContentLoaded", install);

const storage = {
  data: [],
  curPage: '',
  root: null,
  indexes: [],
};


function install() {
  storage.root = document.querySelector('#app');
  if (storage.root) {
    loadData();
    if (storage.data.length) {
      Test();
    } else {
      Setup();
    }
  }
}

function Test() {
  storage.curPage = 'test';
  storage.indexes = [];
  Main();
  Card();
}

function Card() {
  const content = storage.root.querySelector('.content');
  content.innerHTML = '';
  if (!storage.data.length) {
    const root = mkDiv('card-note', content);
    root.innerHTML = 'Setup words first';
    return;
  }
  if (storage.indexes.length === 0) {
    storage.indexes = storage.data.map((i, index) => index);
  }
  const i = Math.floor(Math.random() * 10000) % storage.indexes.length;
  const index = storage.indexes[i];
  storage.indexes.splice(i,1);
  const card = Math.random() > 0.5 
    ? CardFirst(index)
    : CardSecond(index);

  content.appendChild(card);
  return root;  
}

function CardFirst(index) {
  const [w1, w2] = storage.data[index];
  const indexes = storage.data.map((_, index) => index);
  indexes.splice(index, 1);
  const variants = [w2];
  while(variants.length < 5 && indexes.length > 0) {
    const i = Math.floor(Math.random() * 10000) % indexes.length;
    variants.push(storage.data[indexes[i]][1]);
  }
  variants.forEach((item, index) => {
    const i = Math.floor(Math.random() * 10000) % variants.length;
    variants[index] = variants[i];
    variants[i] = item;
  });
  return CardVariant(w1, w2, variants);
}

function CardSecond(index) {
  const [w2, w1] = storage.data[index];
  const indexes = storage.data.map((_, index) => index);
  indexes.splice(index, 1);
  const variants = [w2];
  while(variants.length < 5 && indexes.length > 0) {
    const i = Math.floor(Math.random() * 10000) % indexes.length;
    variants.push(storage.data[indexes[i]][0]);
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
  const wrap = mkDiv('card-content-variants', root);
  variants.forEach((item) => {
    const a = mkNode('a', 'card-content-variants-item', wrap);
    a.innerHTML = item;
  });
  wrap.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (ev.target.className === 'card-content-variants-item'){
      if (ev.target.innerHTML === answer) {
        Card();
      } else {
        ev.target.classList.add('card-content-variants-item-wrong');
      }
    }
  })
  return root;
}


function Setup() {
  storage.curPage = 'setup';
  const content = Main();
  const root = mkDiv('setup-content', content);
  const form = mkNode('form', '', root);
  const ta = mkNode('textarea', 'setup-text', form);
  ta.value = storage.data.map(([ele1, ele2]) => `${ele1}: ${ele2}`).join('\n');
  const btn = mkNode('button', 'setup-button', form);
  btn.innerHTML = "Save"; 
  form.addEventListener('submit', onSave)
}


function onSave(ev){
  ev.preventDefault();
  const data = this.querySelector('textarea').value;
  const splitReg = /\s*:\s*/;
  const arr = data.split('\n').map((item) => item.split(splitReg));
  const ready = arr.filter(([e1, e2]) => e1 && e2).map(([e1, e2]) => [e1.trim(), e2.trim()]);
  storage.data = ready;
  saveData();
}

function Main() {
  storage.root.innerHTML = '';
  const root = mkDiv('root', storage.root);
  root.appendChild(Menu());
  const content = mkDiv('content', root);
  return content;
}

function Menu(){
  const root = mkDiv('menu');
  root.appendChild(MenuItem(
    'setup',
    storage.curPage === 'setup',
    Setup,
  ));
  root.appendChild(MenuItem(
    'test',
    storage.curPage === 'test',
    Test,
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
  const data = JSON.parse(localStorage.getItem('words'));
  if (Array.isArray(data)) {
    storage.data = data;
  }
}

function saveData() {
  localStorage.setItem('words', JSON.stringify(storage.data));
}