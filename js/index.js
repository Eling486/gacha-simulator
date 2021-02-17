let Application = PIXI.Application,
  Container = PIXI.Container,
  loader = new PIXI.Loader(),
  resources = loader.resources,
  TextureCache = PIXI.utils.TextureCache,
  Sprite = PIXI.Sprite,
  Text = PIXI.Text,
  TextStyle = PIXI.TextStyle,
  state = PIXI.state

PIXI.settings.SORTABLE_CHILDREN = true

let c = new Charm(PIXI);
let d = new Dust(PIXI);

let app, bg, grid_w, grid_h, basic_ui_data, pool_ui_data, basic_pool_ui_data, single_ui_data, starContainer
let sprites_on_stage = [],
  single_effect_sprites = []
let UI_single, UI_pool_basic, UI_pool
let show_process

let poolPage = new Container(),
  singlePage = new Container()

function loadJson(path) {
  return new Promise(resolve => {
    var request = new XMLHttpRequest();
    request.open("get", path);
    request.send(null);
    request.onload = function () {
      if (request.status == 200) {
        resolve(JSON.parse(request.responseText))
      }
    }
  })
}

// 清空所有数据
function resetStatistics() {
  window.gacha_times = 0
  window.real_gacha_times = 0
  window.gacha_results = []
  window.last_gacha_result = []
  window.last_six_star = 0
  window.six_num = 0
  window.five_num = 0
  window.four_num = 0
  window.three_num = 0
}

function gameLoop() {
  requestAnimationFrame(gameLoop);
  c.update();
  d.update();
}

window.onload = async function () {
  window.first_load = true
  window.resources_json = await loadJson('./asstes/json/resources.json')
  window.pools_json = await loadJson('./asstes/json/pools.json')
  window.pool_id = window.pools_json.default
  resetStatistics()
  window.chars_json = await loadJson('./asstes/json/characters.json')
  loadGachaPage()
  gameLoop()
}

// 屏幕自适应 - 待完善
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

// 一般精灵加载
function addSprite(ui_data, index, UI_res, container = 'app.stage') {
  let _position = ui_data[index] // 下行用'0'分割字符串是用来进行相同纹理的元素区分的
  sprites_on_stage.push(index)
  let _add = `${index} = new Sprite(${UI_res}["${index.split('0')[0]}.png"]);
        ${container}.addChild(${index});
        ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
        ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
  window.eval(_add)
}

// 带动画等效果的精灵加载
function addSpriteWithAni(ui_data, index, UI_res, container = 'app.stage', type = 'normal') {
  addSprite(ui_data, index, UI_res, container)
  // 改数组用于储存需循环播放的粒子效果，功能待添加
  if (type == 'effect') {
    single_effect_sprites.push(index)
  }
  // 旋转效果
  if (ui_data[index].rotation) {
    eval(`${index}.rotation = ${ui_data[index].rotation}`)
  }
  // 重新着色
  if (ui_data[index].tint) {
    eval(`${index}.tint = ${ui_data[index].tint}`)
  }
  // 设置alpha（不透明度）
  if (ui_data[index].alpha) {
    eval(`${index}.alpha = ${ui_data[index].alpha}`)
  }
  // 各动画效果
  if (ui_data[index].ani_type) {
    // 一般滑动
    if (ui_data[index].ani_type.indexOf('slide') >= 0) {
      eval(`c.slide(${index}, grid_w * ${ui_data[index].end_x} - ${index}.width / 2, grid_h * ${ui_data[index].end_y} - ${index}.height / 2, 60 * ${ui_data[index].time})`)
    }
    // 缩放，before_scale_time：缩放前等待的时间
    if (ui_data[index].ani_type.indexOf('scale') >= 0) {
      setTimeout(function () {
        eval(`c.scale(${index}, ${ui_data[index].end_scale_x}, ${ui_data[index].end_scale_y}, 60 * ${ui_data[index].time - ui_data[index].before_scale_time})`)
      }, ui_data[index].before_scale_time * 1000)
    }
    if (ui_data[index].ani_type.indexOf('fadeOut') >= 0) {
      setTimeout(function () {
        eval(`c.fadeOut(${index}, 60 * ${ui_data[index].time - ui_data[index].before_fade_time})`)
      }, ui_data[index].before_fade_time * 1000)
    }
    // 闪烁
    if (ui_data[index].ani_type.indexOf('fadeLoop') >= 0) {
      setTimeout(function () {
        eval(`c.pulse(${index}, ${ui_data[index].time / 2} * 60, 0)`)
      }, (ui_data[index].delay_time + ui_data[index].time / 2) * 1000)
    }
  }
}

// 一般文字加载
function addText(text_data, index, container = 'app.stage') {
  let _position = text_data[index].position
  sprites_on_stage.push(index)
  let _add = `let ${index}_style = new TextStyle(${JSON.stringify(text_data[index].style)});
        ${index} = new Text(${JSON.stringify(text_data[index].content)}, ${index}_style);
        ${container}.addChild(${index});
        ${index}.scale.set(${_position.scale_x}, ${_position.scale_y});
        ${index}.position.set(grid_w * ${_position.x} - ${index}.width / 2, grid_h * ${_position.y} - ${index}.height / 2)`;
  window.eval(_add)
}

// 加载寻访页面
async function loadGachaPage() {
  basic_ui_data = await loadJson('./asstes/json/ui/basic.json')
  basic_pool_ui_data = await loadJson('./asstes/json/ui/pools/basic.json')
  pool_ui_data = await loadJson(`./asstes/json/ui/pools/${window.pool_id}.json`)
  updatePageSize()
  // 只在首次加载时创建app
  if (window.first_load == true) {
    app = new Application({
      width: window.app_w,
      height: window.app_h,
      antialias: true,
      transparent: false,
      resolution: 1
    });
    document.querySelector('.app').appendChild(app.view);
  }
  app.stage.interactive = true;
  // 字体预加载 - 改功能待改进
  let font_load_style_1 = new TextStyle({
    "fontFamily": "TeYaSong",
    "fontSize": 10,
    "lineHeight": 10,
    "fill": "white"
  });
  let font_load_style_2 = new TextStyle({
    "fontFamily": "NovecentoWide",
    "fontSize": 10,
    "lineHeight": 10,
    "fill": "white"
  });
  let font_load_style_3 = new TextStyle({
    "fontFamily": "Notosanshans",
    "fontSize": 10,
    "lineHeight": 10,
    "fill": "white"
  });
  load_font_1 = new Text('Load Font', font_load_style_1);
  load_font_2 = new Text('Load Font', font_load_style_2);
  load_font_3 = new Text('Load Font', font_load_style_3);
  load_font_1.alpha = 0.01
  load_font_2.alpha = 0.01
  load_font_3.alpha = 0.01
  app.stage.addChild(load_font_1);
  app.stage.addChild(load_font_2);
  app.stage.addChild(load_font_3);
  loadGachaPageRes();
}

// 加载寻访页资源
function loadGachaPageRes() {
  // 首次加载下载基本资源位置文件
  if (window.first_load == true) {
    loader
      //.add(resources_json.online_resources)
      .add(resources_json.resources)
      .load(loadPoolRes);
  } else {
    loadPoolRes()
  }

  // 加载当期寻访页图像资源
  function loadPoolRes() {
    if (!loader.resources[`${window.pool_id}`]) {
      loader
        //.add(`${window.pool_id}`, `https://evanchen486.gitee.io/gacha-simulator/asstes/img/pools/${window.pool_id}.json`)
        .add(`${window.pool_id}`, `./asstes/img/pools/${window.pool_id}.json`)
        .load(gachaResLoaded);
    } else {
      gachaResLoaded()
    }
  }

  function gachaResLoaded() {
    window.first_load = false
    UI_basic = loader.resources['basic_ui'].textures;
    UI_pool = loader.resources[`${window.pool_id}`].textures;
    UI_pool_basic = loader.resources['basic_pool_ui'].textures;

    // return showGachaResult() // 调试用，直接显示结果页

    // 背景元素提前加载
    for (index in basic_pool_ui_data.preload) {
      addSprite(basic_pool_ui_data.preload, index, 'UI_pool_basic', 'poolPage')
    }

    for (index in pool_ui_data.position) {
      addSprite(pool_ui_data.position, index, 'UI_pool', 'poolPage')
    }

    for (index in basic_pool_ui_data.position) {
      addSprite(basic_pool_ui_data.position, index, 'UI_pool_basic', 'poolPage')
    }

    details_box.alpha = 0.5 // 为详情框设置不透明度

    if (pool_ui_data.add_from_basic) {
      for (index in pool_ui_data.add_from_basic) {
        addSprite(pool_ui_data.add_from_basic, index, 'UI_pool_basic', 'poolPage')
      }
    }

    for (index in basic_pool_ui_data.text) {
      addText(basic_pool_ui_data.text, index, 'poolPage')
    }

    if (pool_ui_data.text) {
      for (index in pool_ui_data.text) {
        addText(pool_ui_data.text, index, 'poolPage')
      }
    }
    if (window.gacha_times >= 10 || window.six_num > 0 || window.five_num > 0) {
      tentimes_up.alpha = 0
      tentimes_up_text.alpha = 0
    }

    let pools_index
    for (let i = 0; i < window.pools_json.pools.length; i++) {
      if (window.pools_json.pools[i].id == window.pool_id) {
        pools_index = i
        break;
      }
    }

    // 在up提示显示时才显示数字
    if (tentimes_up.alpha > 0) {
      let num_style = new TextStyle({
        fontFamily: "Notosanshans-Medium",
        fontSize: 30,
        lineHeight: 30,
        fill: "#ffeb00",
        stroke: '#000000',
        strokeThickness: 2,
        dropShadow: false,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: 0,
        dropShadowDistance: 0
      });
      up_num = new Text(`${10 - window.real_gacha_times}`, num_style);
      up_num.anchor.set(0.5, 0.5)
      up_num.position.set(grid_w * 67, grid_h * 79.7);
      poolPage.addChild(up_num);
    }

    // 淡入动画效果
    poolPage.alpha = 0
    app.stage.addChild(poolPage)
    app.ticker.add(() => {
      if (poolPage.alpha + 0.08 >= 1) {
        poolPage.alpha = 1
      } else {
        poolPage.alpha += 0.08
      }
    });

    // 根据卡池资源显示左右切换箭头
    if (window.pools_json.pools[pools_index - 1]) {
      addSpriteWithAni(basic_ui_data.arrows, 'arrow_white01', 'UI_basic', 'app.stage')
      arrow_white01.interactive = true;
      arrow_white01.buttonMode = true;
      arrow_white01.on('pointertap', function () {
        switchPool(pools_index - 1)
      })
    }

    if (window.pools_json.pools[pools_index + 1]) {
      addSpriteWithAni(basic_ui_data.arrows, 'arrow_white02', 'UI_basic', 'app.stage')
      arrow_white02.interactive = true;
      arrow_white02.buttonMode = true;
      arrow_white02.on('pointertap', function () {
        switchPool(pools_index + 1)
      })
    }

    // 设置按钮点击事件
    btn_once.interactive = true;
    btn_once.buttonMode = true
    btn_once.on('pointerdown', function () {
      btn_once.tint = 0xBBBBBB
    })
    btn_once.on('pointertap', function () {
      btn_once.tint = 0xFFFFFF
      gachaConfirm('once')
    })
    btn_once.on('pointerout', function () {
      btn_once.tint = 0xFFFFFF
    })

    btn_ten_times.interactive = true;
    btn_ten_times.buttonMode = true
    btn_ten_times.on('pointerdown', function () {
      btn_ten_times.tint = 0xBBBBBB
    })
    btn_ten_times.on('pointertap', function () {
      btn_ten_times.tint = 0xFFFFFF
      gachaConfirm('tentimes')
    })
    btn_ten_times.on('pointerout', function () {
      btn_ten_times.tint = 0xFFFFFF
    })
  }
}

// 切换卡池
function switchPool(index) {
  resetStatistics()
  window.pool_id = window.pools_json.pools[index].id
  console.log(window.pool_id)
  app.stage.children = []
  loadGachaPage()
}

// 寻访确认 - 待完成
function gachaConfirm(type) {
  if (type == 'once') {
    result = gachaOnce()
    app.stage.children = []
    sprites_on_stage = []
    show_process = 0
    /*
    let char_id = '136_hoshiguma' // 调试用，直接寻访到某干员
    let gacha_result = []
    let char_obj = window.chars_json.characters[char_id]
    gacha_result.push(char_obj)
    result = gacha_result
    */
    console.log(result)
    showFolder()
  }
  if (type == 'tentimes') {
    result = gachaTenTimes()
    show_process = 0
    showFolder()
  }
}

function showFolder() {
  let result = window.last_gacha_result
  UI_folders = loader.resources['folders_ui'].textures;
  app.stage.children = []
  addSprite(basic_pool_ui_data.preload, 'basic_bg', 'UI_pool_basic', 'app.stage')
  let folder_bg = new Sprite(UI_folders["folder_bg.png"]);
  app.stage.addChild(folder_bg);
  folder_bg.scale.set(0.7, 0.7);
  folder_bg.position.set(0, 0);
  folder_bg.anchor.set(0, 0);
  let folder = new Sprite(UI_folders["folder.png"]);
  app.stage.addChild(folder);
  folder.scale.set(0.75, 0.75);
  folder.position.set(grid_w * 64 - folder.width / 2, grid_h * 82 - folder.height / 2);
  folder.anchor.set(0.5, 0.5);
  folder.zIndex = 100
  folder.rotation = -0.3
  let folder_breathe = c.breathe(
    folder, // 精灵
    0.76,   // x轴缩放的比例
    0.76,   // y轴缩放的比例
    60,     // 持续时间，以帧为单位
    true,   // 轮流反向播放 
    -60,    // yoyo之间的延迟时间
  );
  folder.interactive = true;
  folder.buttonMode = true
  folder.on('pointertap', function () {
    folder_breathe.pause()
    showPapers()
  })

  function showPapers() {
    folder._events = {}
    c.fadeOut(folder_bg, 30)
    c.scale(folder, 0.85, 0.85, 30)
    c.slide(folder, folder.x - 100, folder.y, 30, 'smoothstep')
    c.rotate(folder, 0, 30)
    c.wait(550).then(() => {
      for (var i = 0; i < result.length; i++) {
        let _add = `paper_${i} = new Sprite(UI_folders["paper_${result[i].stars}.png"]);
                    app.stage.addChild(paper_${i});
                    paper_${i}.scale.set(0.82, 0.82);
                    paper_${i}.position.set(folder.x - 10, folder.y);
                    paper_${i}.anchor.set(0.5, 0.5);
                    paper_${i}.zIndex = ${50 - i}`
        eval(_add)
      }
    })
    c.wait(1000).then(() => {
      c.scale(folder, 0.85, 0.85, 10)
      c.slide(folder, folder.x - 30, folder.y + 10, 20, 'smoothstep')
      c.rotate(folder, -0.1, 20)
      c.wait(200).then(() => {
        c.slide(paper_0, paper_0.x + 70, paper_0.y + 10, 15, 'smoothstep')
        c.rotate(paper_0, 0.05, 10)
        if (typeof paper_1 == 'object') {
          c.slide(paper_1, paper_1.x + 110, paper_1.y + 10, 15, 'smoothstep')
          c.rotate(paper_1, -0.03, 10)

          c.slide(paper_2, paper_2.x + 150, paper_2.y + 10, 15, 'smoothstep')
          c.rotate(paper_2, -0.01, 10)

          c.slide(paper_3, paper_3.x + 175, paper_3.y + 10, 15, 'smoothstep')
          c.rotate(paper_3, 0.05, 10)

          c.slide(paper_4, paper_4.x + 215, paper_4.y + 5, 15, 'smoothstep')
          c.rotate(paper_4, -0.08, 10)

          c.slide(paper_5, paper_5.x + 255, paper_5.y + 5, 15, 'smoothstep')
          c.rotate(paper_5, 0.05, 10)

          c.slide(paper_6, paper_6.x + 284, paper_6.y + 4, 15, 'smoothstep')
          c.rotate(paper_6, 0.05, 10)

          c.slide(paper_7, paper_7.x + 310, paper_7.y + 5, 15, 'smoothstep')
          c.rotate(paper_7, 0.07, 10)

          c.slide(paper_8, paper_8.x + 340, paper_8.y + 5, 15, 'smoothstep')
          c.rotate(paper_8, 0.2, 10)

          c.slide(paper_9, paper_9.x + 390, paper_9.y + 5, 15, 'smoothstep')
          c.rotate(paper_9, 0.05, 10)
        }
        
        c.wait(500).then(() => {
          c.slide(folder, folder.x - 700, folder.y, 20, 'smoothstep')
          c.rotate(paper_0, 0, 10)
        })

        c.wait(700).then(() => {
          c.slide(paper_0, paper_0.x + 50, paper_0.y + 260, 20, 'smoothstep')
          c.scale(paper_0, 2.5, 2.5, 30)
        })
        c.wait(1400).then(() => {
          app.stage.children = []
          c.wait(100).then(() => {
            loadCharRes()
          })
        })
      })
    })
  }
}

// 加载干员立绘
function loadCharRes() {
  let index = show_process
  if (!loader.resources[result[index].id.split('_')[1]]) {
    console.log('need load')
    loader
      //.add(result[index].id.split('_')[1], `https://evanchen486.gitee.io/gacha-simulator/asstes/characters/standing/${result[index].id}.png`)
      .add(result[index].id.split('_')[1], `./asstes/characters/standing/${result[index].id}.png`)
      .load(loadOrganization);
  } else {
    console.log('exist')
    showGachaResult()
  }
}

// 加载标志
function loadOrganization() {
  let result = window.last_gacha_result
  let index = show_process
  if (!loader.resources[window.chars_json.organizations[result[index].organization].icon_name]) {
    loader
      //.add(window.chars_json.organizations[result[index].organization].icon_name, `https://evanchen486.gitee.io/gacha-simulator/asstes/img/organizations/${window.chars_json.organizations[result[0].organization].icon_name}.png`)
      .add(window.chars_json.organizations[result[index].organization].icon_name, `./asstes/img/organizations/${window.chars_json.organizations[result[index].organization].icon_name}.png`)
      .load(showGachaResult);
  } else {
    console.log('exist')
    showGachaResult()
  }
}

// 全部资源加载完成后，显示干员干员寻访展示页
async function showGachaResult() {
  let result = window.last_gacha_result
  app.stage.children = []
  single_ui_data = await loadJson(`./asstes/json/ui/single.json`)
  UI_single = loader.resources['single_ui'].textures;

  for (index in single_ui_data.preload) {
    addSpriteWithAni(single_ui_data.preload, index, 'UI_single')
  }
  mg.alpha = 0 // 预加载背景，显隐藏备用（叠放次序的原因）
  for (index in single_ui_data.effect1) {
    addSpriteWithAni(single_ui_data.effect1, index, 'UI_single')
  }
  addSpriteWithAni(single_ui_data.char_any, 'char_any', 'UI_single')

  for (index in single_ui_data.effect2) {
    addSpriteWithAni(single_ui_data.effect2, index, 'UI_single')
    eval(`${index}.blendMode = PIXI.BLEND_MODES.HARD_LIGHT;`)
  }

  // 显示星星前的喷射粒子效果
  starContainer = new PIXI.ParticleContainer(1500, { alpha: true, scale: true, rotation: true, uvs: true });
  app.stage.addChild(starContainer);

  function showStars(i) {
    let _position = single_ui_data.effect_stars
    i -= 1
    d.create(grid_w * _position[i].x, grid_h * _position[i].y, () => new Sprite(UI_single["s_2.png"]), starContainer, 12, 0, false, 0, 6.28, 30, 40, 3, 8, 0.01, 0.05, 0.02, 0.08);
  }

  // 顺次显示粒子效果及星星
  let one_star_time = 70
  console.log(show_process)
  let num = result[show_process].stars
  // num = 6 // 调试用
  let star_order = [4, 3, 2, 1, 5, 6]
  for (i = 0; i < 6; i++) {
    if (star_order[i] <= num) {
      let n = i
      c.wait(600 + one_star_time * n).then(() => {
        showStars(star_order[n])
        c.wait(50).then(() => {
          addSpriteWithAni(single_ui_data.stars, `star0${star_order[n]}`, 'UI_single')
          window.eval(`star0${star_order[n]}.anchor.set(0.5, 0.5);
            c.scale(star0${star_order[n]}, 0.58, 0.58, 60 * 0.1);
            c.wait(105).then(() => {
              c.scale(star0${star_order[n]}, 0.5, 0.5, 60 * 0.1);
            });`)
        })
      })
    }
  }

  // 等待星星显示完毕后执行后续动画
  c.wait(1500).then(() => {
    addSpriteWithAni(single_ui_data.mask, `mask_r_1`, 'UI_single')
    mask_r_1.anchor.set(0.5, 0.5)
    mask_r_1.alpha = 0
    c.scale(mask_r_1, 10, 10, 60 * 0.8)
    c.fadeIn(mask_r_1, 60 * 0.5)
    mask_r_1.zIndex = 999
    // 此处存在当动画执行时，切换标签或窗口时会造成动画错乱的bug
    c.wait(800).then(() => {
      c.fadeOut(mask_r_1, 60 * 0.4)
      // 故障闪烁效果 - 待完成
      /*
      c.wait(200).then(() => {
        addSpriteWithAni(single_ui_data.mask, `shanshuo_1`, 'UI_single')
        c.wait(100).then(() => {
          shanshuo_1.position.set(grid_w * single_ui_data.mask['shanshuo_1'].x_2, grid_h * single_ui_data.mask['shanshuo_1'].y_2)
        })
      })*/

      // 隐藏干员剪影，显示背景
      char_any.alpha = 0
      mg.alpha = 1

      let organization = window.chars_json.organizations[result[show_process].organization].icon_name
      let name = result[show_process].id.split('_')[1]
      let _add = `${organization} = new Sprite(loader.resources['${organization}'].texture);
          app.stage.addChild(${organization});
          ${organization}.scale.set(0.7, 0.7);
          ${organization}.position.set(grid_w * 38 - ${organization}.width / 2, grid_h * 40 - ${organization}.height / 2);
          c.slide(${organization}, grid_w * (38 + 10) - ${organization}.width / 2, grid_h * 40 - ${organization}.height / 2, 60 * 30, 'linear');
          ${name} = new Sprite(loader.resources['${name}'].texture);
          app.stage.addChild(${name});
          ${name}.scale.set(0.8, 0.8);
          ${name}.position.set(grid_w * 56 - ${name}.width / 2, grid_h * 70 - ${name}.height / 2);
          c.slide(${name}, grid_w * (56 + 10) - ${name}.width / 2, grid_h * 70 - ${name}.height / 2, 60 * 30, 'linear');`;
      window.eval(_add)

      // 根据星数，重新设置星星位置
      for (var i = 1; i < num + 1; i++) {
        let _position = single_ui_data.stars_2
        eval(`if(star0${i}){
            star0${i}.anchor.set(0.5, 0.5)
            star0${i}.position.set(grid_w * ${_position[`star0${i}`].x} - star0${i}.width / 2, grid_h * ${_position[`star0${i}`].y} - star0${i}.height / 2);
            star0${i}.zIndex = 100;
            c.slide(star0${i}, grid_w * ${_position[`star0${i}`].x + 25} - star0${i}.width / 2, grid_h * ${_position[`star0${i}`].y} - star0${i}.height / 2, 60 * 20, 'linear');
          }`)
      }

      let occupation = window.chars_json.occupation[result[show_process].occupation].icon_name
      occupation_img = new Sprite(UI_single[`${occupation}_b.png`])
      app.stage.addChild(occupation_img);
      occupation_img.anchor.set(1, 0.5)
      occupation_img.position.set(grid_w * 48, grid_h * 81.5);
      c.slide(occupation_img, grid_w * (48 + 20), grid_h * 81.5, 60 * 30, 'linear');

      let name_zh_style = new TextStyle({
        fontFamily: "TeYaSong",
        fontSize: 70,
        lineHeight: 30,
        fill: "white",
        stroke: '#000000',
        strokeThickness: 1,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 4,
        dropShadowAngle: 0,
        dropShadowDistance: 0
      });
      let name_en_style = new TextStyle({
        fontFamily: "NovecentoWide",
        fontSize: 30,
        lineHeight: 30,
        fill: "white",
        stroke: '#000000',
        strokeThickness: 1,
        dropShadow: true,
        dropShadowColor: "#000000",
        dropShadowBlur: 2,
        dropShadowAngle: 0,
        dropShadowDistance: 0
      });
      name_en = new Text(result[show_process].name.en.toUpperCase(), name_en_style);
      name_zh = new Text(result[show_process].name.zh, name_zh_style);
      name_zh.anchor.set(0, 0.5)
      name_en.anchor.set(0, 0.5)
      name_zh.position.set(grid_w * 48, grid_h * 81);
      name_en.position.set(grid_w * 48.5, grid_h * 88);
      app.stage.addChild(name_zh);
      app.stage.addChild(name_en);
      c.slide(name_zh, grid_w * (48 + 20), grid_h * 81, 60 * 30, 'linear');
      c.slide(name_en, grid_w * (48.5 + 20), grid_h * 88, 60 * 30, 'linear');

      // 顶层离子效果加载
      if (single_ui_data.effect3) {
        for (index in single_ui_data.effect3) {
          addSpriteWithAni(single_ui_data.effect3, index, 'UI_single')
          eval(`${index}.blendMode = PIXI.BLEND_MODES.HARD_LIGHT;`)
        }
      }

      // 单抽直接返回寻访页，十连在十个干员全部展示完毕后再返回下一步
      c.wait(800).then(() => {
        if (result.length == 1) {
          app.stage.on('pointertap', function () {
            app.stage.children = []
            app.stage._events = {}
            loadGachaPage()
          })
        }
        if (result.length == 10) {
          if (show_process < 9) {
            app.stage.on('pointertap', function () {
              show_process++
              app.stage.children = []
              app.stage._events = {}
              // 显示下一个干员（从加载资源开始）
              loadCharRes()
            })
          }
          if (show_process == 9) {
            app.stage.on('pointertap', function () {
              app.stage.children = []
              app.stage._events = {}
              loadGachaPage()
            })
          }
        }
      })
    })
  })
}