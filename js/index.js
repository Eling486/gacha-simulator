let Application = PIXI.Application,
  Container = PIXI.Container,
  loader = new PIXI.Loader(),
  resources = loader.resources,
  TextureCache = PIXI.utils.TextureCache,
  Sprite = PIXI.Sprite,
  Rectangle = PIXI.Rectangle;

let app, bg, grid_w, grid_h, page_data

window.onresize = updatePageSize()

function updatePageSize() {
  const w = window.innerWidth
  const h = window.innerHeight
  grid_w = parseInt(w / 100)
  grid_h = parseInt(h / 100)
  /*
  if(Math.min(w, h) == w){
    window.app_w = w
    window.app_h = w * 9 / 16
  }else{
    window.app_h = h - 50
    window.app_w = (h - 50) * 16 / 9
  }*/
}

async function loadGachaPage() {
  //const ui_data = await loadJson('./asstes/json/ui/pools/SP_035.json')
  page_data = await loadJson(`./asstes/json/ui/pools/${window.pool_id}.json`)
  updatePageSize()
  loadGachaPageRes();
}

function loadGachaPageRes() {
  app = new Application({
    width: window.innerWidth,
    height: window.innerHeight,
    antialias: true,
    transparent: false,
    resolution: 1
  });

  document.body.appendChild(app.view);

  loader
    .add(page_data.resources)
    .load(setup);

  function setup() {
    UI_pools = loader.resources['pool_ui'].textures;
    for(index in page_data.position){
      let _position = page_data.position[index]
      let _add = `${index} = new Sprite(UI_pools["${index}.png"]);
        app.stage.addChild(${index});
        ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
        ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
      eval(_add)
    }
    
    /*
    //Make the treasure box using the alias
    bg = new Sprite(UI_pools["bg.png"]);
    app.stage.addChild(bg);
    bg.scale.set(1.7, 1.3);
    bg.position.set(grid_w * 50 - bg.width / 2, grid_h * 70 - bg.height / 2)*/
  }
}

