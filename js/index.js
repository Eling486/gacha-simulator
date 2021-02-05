let Application = PIXI.Application,
  Container = PIXI.Container,
  loader = new PIXI.Loader(),
  resources = loader.resources,
  TextureCache = PIXI.utils.TextureCache,
  Sprite = PIXI.Sprite,
  Text = PIXI.Text,
  TextStyle = PIXI.TextStyle,
  Rectangle = PIXI.Rectangle;

let app, bg, grid_w, grid_h, pool_ui_data, basic_ui_data

// window.onresize = updatePageSize()

function updatePageSize() {
  window.app_h = 650
  window.app_w = window.app_h * 16 / 9
  grid_w = parseInt(window.app_w / 100)
  grid_h = parseInt(window.app_h / 100)
  /*
  const w = window.innerWidth
  const h = window.innerHeight
  console.log(Math.min(w, h * 16 / 9) == w)
  if(Math.min(w, h * 9 / 16) == w){
    window.app_w = w
    window.app_h = w * 9 / 16
    grid_w = parseInt(window.app_w / 100)
    grid_h = parseInt(window.app_h / 100)
  }else{
    window.app_h = h
    window.app_w = h * 16 / 9
    grid_w = parseInt(window.app_w / 100)
    grid_h = parseInt(window.app_h / 100)
  }*/
}

async function loadGachaPage() {
  basic_ui_data = await loadJson('./asstes/json/ui/pools/basic.json')
  pool_ui_data = await loadJson(`./asstes/json/ui/pools/${window.pool_id}.json`)
  updatePageSize()
  loadGachaPageRes();
}

function loadGachaPageRes() {
  app = new Application({
    width: window.app_w,
    height: window.app_h,
    antialias: true,
    transparent: false,
    resolution: 1
  });

  document.body.appendChild(app.view);

  loader
    .add(pool_ui_data.resources)
    .load(setup);

  function addSprite(ui_data, index, UI_res) {
    let _position = ui_data[index] // 下行用'0'分割字符串是用来进行相同纹理的元素区分的
    let _add = `${index} = new Sprite(${UI_res}["${index.split('0')[0]}.png"]);
          app.stage.addChild(${index});
          ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
          ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
    window.eval(_add)
  }

  function addText(text_data, index) {
    let _position = text_data[index].position
    let _add = `let ${index}_style = new TextStyle(${JSON.stringify(text_data[index].style)});
          ${index} = new Text(${JSON.stringify(text_data[index].content)}, ${index}_style);
          app.stage.addChild(${index});
          ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
          ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
    window.eval(_add)
  }

  function setup() {
    UI_pools = loader.resources['pool_ui'].textures;
    UI_basic = loader.resources['basic_ui'].textures;

    // 背景元素提前加载
    for (index in basic_ui_data.preload) {
      addSprite(basic_ui_data.preload, index, 'UI_basic')
    }

    for (index in pool_ui_data.position) {
      addSprite(pool_ui_data.position, index, 'UI_pools')
    }

    for (index in basic_ui_data.position) {
      addSprite(basic_ui_data.position, index, 'UI_basic')
    }

    let alphaFilter = new PIXI.filters.AlphaFilter(); // 为详情框设置不透明度
    alphaFilter.alpha = 0.5
    details_box.filters = [alphaFilter]

    if (pool_ui_data.add_from_basic) {
      for (index in pool_ui_data.add_from_basic) {
        addSprite(pool_ui_data.add_from_basic, index, 'UI_basic')
      }
    }

    for (index in basic_ui_data.text) {
      addText(basic_ui_data.text, index)
    }

    if (pool_ui_data.text) {
      for (index in pool_ui_data.text) {
        addText(pool_ui_data.text, index)
      }
    }

    btn_once.interactive = true;
    btn_once.buttonMode = true
    btn_once.on('pointerdown', function(){
      btn_once.tint = 0xBBBBBB
    })
    btn_once.on('pointerup', function(){
      btn_once.tint = 0xFFFFFF
      gachaConfirm('once')
    })
    btn_once.on('pointerout', function(){
      btn_once.tint = 0xFFFFFF
    })

    btn_ten_times.interactive = true;
    btn_ten_times.buttonMode = true
    btn_ten_times.on('pointerdown', function(){
      btn_ten_times.tint = 0xBBBBBB
    })
    btn_ten_times.on('pointerup', function(){
      btn_ten_times.tint = 0xFFFFFF
      gachaConfirm('tentimes')
    })
    btn_ten_times.on('pointerout', function(){
      btn_ten_times.tint = 0xFFFFFF
    })
  }
}

function gachaConfirm(type){
  if(type == 'once'){
    
  }
  if(type == 'tentimes'){
    
  }
}
