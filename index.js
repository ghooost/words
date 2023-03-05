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

// elements
function Loading() {
  storage.root.innerHTML = '';
}

function Page() {
  storage.root.innerHTML = '';
  storage.root.appendChild(f(`
  <div id="page" class="root">
    <hr data-ele="Menu()">
    <hr data-ele="Content()">
  </div>
  `));
}

function Menu(){
  return f(`
    <div id="menu" class="menu">
      <hr data-ele="MenuItem('setup','Setup')">
      <hr data-ele="MenuItem('test','${storage.data[storage.curSection].name}')">
      ${storage.curPage === 'test' ? `<hr data-ele="Score()">` : ''}
    </div>
  `);
}

function MenuItem(id, name){
  const ele = f(`
    <a id="menu-${id}" class="menu-item">${name}</a>
  `);
  if (storage.curPage === id) {
    ele.classList.add('menu-item-current');
  }
  ele.addEventListener('click', (ev) => {
    ev.preventDefault();
    storage.curPage = id;
    Page();
  });
  return ele;
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
  return f(`
    <div id="score" class="menu-item menu-item-score">Score: ${score}%</div>
  `);
}

function Content() {
  return f(`
    <div id="content" class="content">
      ${
        storage.curPage === 'test'
          ? `<hr data-ele="Card()">`
          : `<hr data-ele="Setup()">`
      }
    </div>
  `);
}


function Card() {
  const section = storage.data[storage.curSection];
  if (!section.data.length) {
    return f(`
      <div id="card" class="class-node">
        There is no words, something bad happend
      </div>
    `);
  }
  if (storage.indexes.length === 0) {
    storage.indexes = section.data.map((_, i) => i);
  }
  const i = Math.floor(Math.random() * 10000) % storage.indexes.length;
  const index = storage.indexes[i];
  storage.indexes.splice(i, 1);
  const [w1, w2, variants] = Math.random() > 0.5 
    ? CardFirst(index, section)
    : CardSecond(index, section);
  
  return CardVariant(w1, w2, variants);
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
  return [w1, w2, variants];
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
  return [w1, w2, variants];
}


function CardVariant(quest, answer, variants) {
  const shortClass = quest.length < 7
    ? 'card-content-word-short'
    : '';
  
  const ele = f(`
    <div id="card" class="card">
      <div class="card-content">
        <div class="card-content-word ${shortClass}">${quest}</div>
      </div>
      <div class="card-content-variants">
      ${
        variants
          .map(
            (variant) => `<a class="card-content-variants-item">${variant}</a>`
          )
          .join('')
      }
      </div>
  </div>
  `);

  ele.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (ev.target.className === 'card-content-variants-item'){
      if (ev.target.innerHTML === answer) {
        changeScore(1);
        Card();
      } else {
        changeScore(-1);
        ev.target.classList.add('card-content-variants-item-wrong');
      }
    }
  })
  return ele;
}

function CollectionsMenu() {
  const mapCollection = ({name}, index) => {
    const currentClass = (index === storage.curSection) ? 'setup-button-current' : '';
    return `<a class="setup-button ${currentClass}" data-index="${index}">${name}</a>`;
  };
  
  const ele = f(`
    <div id="CollectionsMenu" class="setup-section-content">
      ${storage.data.map(mapCollection).join('')}
    </div>
  `);
  
  ele.addEventListener('click', (ev) => {
    ev.preventDefault();
    if (ev.target.dataset.index) {
      onChangeSection(ev.target.dataset.index);
    }
  })
  return ele;
}

function SaveButton() {
  const ele = f(`<a id='saveButton' class="setup-button">Save</a>`);
  ele.addEventListener('click', onSave);
  return ele;
}

function Setup() {
  return f(`
    <div id="setup" class="setup-content">
      <div class="setup-section">
        <h2 class="setup-section-title">
          Choose active collection
        </h2>
        <hr data-ele="CollectionsMenu()">
      </div>
      <div class="setup-section">
        <h2 class="setup-section-title">
          You need to allow access to the sheet for everybody
        </h2>
        <input
          type="text"
          class="setup-link"
          placeholder="Link to your Google sheet with collections"
          value="${
            storage.spreadsheetId
              ? `https://docs.google.com/spreadsheets/d/${storage.spreadsheetId}/edit?usp=sharing`
              : ''
          }">
          <div class="setup-section-content">
            <hr data-ele="SaveButton()">
          </div>
      </div>
    </div>
  `);
}

// stuff and callbacks
function changeScore(value){
  storage.score.push(value);
  const maxLen = storage.data[storage.curSection].data.length * 2;
  if (storage.score.length > maxLen) {
    storage.score.splice(maxLen, maxLen - storage.score.length);
  }
  Score();
}

function onChangeSection(index) {
  storage.curSection = parseInt(index);
  storage.indexes = [];
  storage.score = [];
  saveData();
  Menu();
  CollectionsMenu();
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

function loadSection() {
  let curSection = parseInt(localStorage.getItem('section'));
  if (!curSection || storage.data.length <= curSection) {
    curSection = 0;
  }
  storage.curSection = curSection;
}

function saveData() {
  localStorage.setItem('section', storage.curSection || 0);
  localStorage.setItem('spreadsheetId', storage.spreadsheetId || '');
}

// google sheets stuff
const google = {
  visualization: {
    Query: {
      setResponse: (data) => {
        try {
          storage.data = jsonToData(data);
        } catch (err) {
          storage.data = getDefaultData();
        }
        loadSection();
        Page();
      }
    }
  }
};

function extractJsonCell(row, index) {
  if (!row || !row.c || row.c.length <= index) {
    return '';
  }
  if (!row.c[index] || !row.c[index].v) {
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

// tiny magic to allow
// 1. write html templates in HTML-like style
// 2. but be able to additionally setup added nodes
// 3. repaint a random node only - f.e. Menu() call will
// repaint Menu and it's child nodes
function f(str) {
  const df = document.createElement('div');
  df.innerHTML = str;
  const tags = [...df.querySelectorAll('[data-ele]')];
  tags.forEach((node) => {
    try {
      const newNode = eval(node.dataset.ele);
      node.parentNode.replaceChild(newNode, node);
    } catch (err) {
      console.log('Error:', err, node.dataset.ele);
    }
  })
  const root = df.firstElementChild;
  const id = root.id;
  let node = document.querySelector(`#${id}`);
  if (node) {
    node.parentNode.replaceChild(root, node);
  };
  return root;
};

