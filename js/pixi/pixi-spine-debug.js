((PIXI)=>{
    PIXI = PIXI || window.PIXI;
    if(PIXI && PIXI.spine && PIXI.spine.Spine){
        class SpineDebug{
            constructor(spine){
                this.spine = spine;
                this.skeleton = spine.skeleton;
                this.init();
            }
            init(){
                const _ts = this,
                    spine = _ts.spine;
                let list = _ts.list = [
                    // 'bonesLine','bonesDots',                                            // 骨骼
                    'bones','skeletonXY',
                    'regionAttachmentsShape',                                           // 区块
                    'meshTrianglesLine','meshHullLine',                                 // 蒙皮
                    'clippingPolygon',                                                  // 蒙版
                    'boundingBoxesRect','boundingBoxesCircle','boundingBoxesPolygon',   // 边界框
                    'pathsCurve','pathsLine'                                            // 路径
                ],
                ghs = _ts.ghs = {},
                debugGroup = _ts.debugGroup = new PIXI.Container();

                // 创建图形，并添加到debug容器
                for(let i=0,len=list.length; i<len; i++){
                    let name = list[i];
                    ghs[name] = name === 'bones' ? new PIXI.Container() : new PIXI.Graphics();
                    debugGroup.addChild(ghs[name]);
                };

                spine.addChild(debugGroup);
            }
            update(){
                const _ts = this,
                    spine = _ts.spine,
                    ghs = _ts.ghs;
                
                _ts.scale = spine.scale.x || spine.scale.y || 1;
                _ts.lineWidth = 1 / Math.abs(_ts.scale);

                // 清除绘制
                for(let key in ghs){
                    if(ghs[key] instanceof PIXI.Graphics){
                        ghs[key].clear();
                    }else if(ghs[key] instanceof PIXI.Container){
                        for(let len=ghs[key].children.length; len > 0; len--){
                            ghs[key].children[len - 1].destroy({children:true,texture:true,baseTexture:true});
                        };
                    };
                };
                
                // 绘制骨骼
                if(spine.drawBones){
                    _ts.drawBones();
                };

                // 绘制路径
                if(spine.drawPaths){
                    _ts.drawPaths();
                };

                // 绘制边界框
                if(spine.drawBoundingBoxes){
                    _ts.drawBoundingBoxes();
                };

                // 绘制蒙版区域
                if(spine.drawClipping){
                    _ts.drawClipping();
                };

                // 绘制蒙皮
                if(spine.drawMeshHull || spine.drawMeshTriangles){
                    _ts.drawMeshHullAndMeshTriangles();
                };

                // 绘制区块附件
                if(spine.drawRegionAttachments){
                    _ts.drawRegionAttachments();
                };
            }

            // 绘制区块附件
            drawRegionAttachments(){
                const _ts = this,
                    ghs = _ts.ghs,
                    skeleton = _ts.skeleton,
                    slots = skeleton.slots,
                    lineWidth = _ts.lineWidth;

                ghs.regionAttachmentsShape.lineStyle(lineWidth,0x0078FF,1);

                for(let i=0,len=slots.length; i<len; i++){
                    let slot = slots[i],
                        attachment = slot.getAttachment();
                    if(!(attachment instanceof PIXI.spine.core.RegionAttachment)){continue;};

                    let vertices = new Float32Array(8);
                    attachment.updateOffset();
                    attachment.computeWorldVertices(slot.bone,vertices,0,2);
                    ghs.regionAttachmentsShape.drawPolygon([...vertices.slice(0,8)]);
                    // ghs.regionAttachmentsShape.moveTo(vertices[0],vertices[1]);
                    // ghs.regionAttachmentsShape.lineTo(vertices[2],vertices[3]);
                    // ghs.regionAttachmentsShape.lineTo(vertices[4],vertices[5]);
                    // ghs.regionAttachmentsShape.lineTo(vertices[6],vertices[7]);
                    // ghs.regionAttachmentsShape.lineTo(vertices[0],vertices[1]);
                };
            }

            // 绘制蒙皮
            drawMeshHullAndMeshTriangles(){
                const _ts = this,
                    spine = _ts.spine,
                    ghs = _ts.ghs,
                    skeleton = _ts.skeleton,
                    slots = skeleton.slots,
                    lineWidth = _ts.lineWidth;

                ghs.meshHullLine.lineStyle(lineWidth,0x0078FF,1);
                ghs.meshTrianglesLine.lineStyle(lineWidth,0xFFCC00,1);

                for(let i=0,len=slots.length; i<len; i++){
                    let slot = slots[i];
                    if(!slot.bone.active){continue;};
                    let attachment = slot.getAttachment();
                    if(!(attachment instanceof PIXI.spine.core.MeshAttachment)){continue;};

                    let vertices = new Float32Array(attachment.vertices.length),
                        triangles = attachment.triangles,
                        hullLength = attachment.hullLength;
                    attachment.computeWorldVertices(slot, 0, attachment.worldVerticesLength, vertices, 0, 2);
                    // 画蒙皮网格（三角形）
                    if(spine.drawMeshTriangles){
                        for(let _i=0,_len=triangles.length; _i<_len; _i+=3){
                            let v1 = triangles[_i] * 2,
                                v2 = triangles[_i + 1] * 2,
                                v3 = triangles[_i + 2] * 2;
                            ghs.meshTrianglesLine.moveTo(vertices[v1],vertices[v1 + 1]);
                            ghs.meshTrianglesLine.lineTo(vertices[v2],vertices[v2 + 1]);
                            ghs.meshTrianglesLine.lineTo(vertices[v3],vertices[v3 + 1]);
                        };
                    };

                    // 画蒙皮边框
                    if(spine.drawMeshHull && hullLength > 0){
                        hullLength = (hullLength >> 1) * 2;
                        let lastX = vertices[hullLength - 2],
                            lastY = vertices[hullLength - 1];
                        for(let _i=0,_len=hullLength; _i<_len; _i+=2){
                            let x = vertices[_i],
                                y = vertices[_i + 1];
                            ghs.meshHullLine.moveTo(x,y);
                            ghs.meshHullLine.lineTo(lastX,lastY);
                            lastX = x;
                            lastY = y;
                        };
                    };
                };
            }

            // 蒙版区域
            drawClipping(){
                const _ts = this,
                    ghs = _ts.ghs,
                    skeleton = _ts.skeleton,
                    slots = skeleton.slots,
                    lineWidth = _ts.lineWidth;

                ghs.clippingPolygon.lineStyle(lineWidth,0xFF00FF,1);
                for(let i=0,len=slots.length; i<len; i++){
                    let slot = slots[i];
                    if(!slot.bone.active){continue;};
                    let attachment = slot.getAttachment();
                    if(!(attachment instanceof PIXI.spine.core.ClippingAttachment)){continue;};

                    let nn = attachment.worldVerticesLength,
                        world = new Float32Array(nn);
                    attachment.computeWorldVertices(slot, 0, nn, world, 0, 2);
                    ghs.clippingPolygon.drawPolygon([...world]);
                };
            }

            // 绘制边界框
            drawBoundingBoxes(){
                const _ts = this,
                    ghs = _ts.ghs,
                    lineWidth = _ts.lineWidth;

                // 绘制边界框的总外框
                ghs.boundingBoxesRect.lineStyle(lineWidth,0x00FF00,5);

                let bounds = new PIXI.spine.core.SkeletonBounds();
                bounds.update(this.skeleton, true);
                ghs.boundingBoxesRect.drawRect(bounds.minX, bounds.minY, bounds.getWidth(), bounds.getHeight());

                let polygons = bounds.polygons,
                    drawPolygon = (polygonVertices,offset,count)=>{
                        ghs.boundingBoxesPolygon.lineStyle(lineWidth,0x00FF00,1);
                        ghs.boundingBoxesPolygon.beginFill(0x00FF00,0.1);

                        if(count < 3){
                            throw new Error('Polygon must contain at least 3 vertices');
                        };
                        let paths = [],
                            dotSize = lineWidth * 2;
                        for(let i=0,len=polygonVertices.length; i<len; i+=2){
                            let x1 = polygonVertices[i],
                                y1 = polygonVertices[i+1];
                            
                            // 绘制边界框节点
                            ghs.boundingBoxesCircle.lineStyle(0);
                            ghs.boundingBoxesCircle.beginFill(0x00DD00);
                            ghs.boundingBoxesCircle.drawCircle(x1,y1,dotSize);
                            ghs.boundingBoxesCircle.endFill();
                            
                            paths.push(x1,y1);
                        };

                        // 绘制边界框区域
                        ghs.boundingBoxesPolygon.drawPolygon(paths);
                        ghs.boundingBoxesPolygon.endFill();
                    };
                
                for(let i=0,len=polygons.length; i<len; i++){
                    let polygon = polygons[i]
                    drawPolygon(polygon,0,polygon.length);
                };
            }

            // 绘制路径
            drawPaths(){
                const _ts = this,
                    lineWidth = _ts.lineWidth,
                    skeleton = _ts.skeleton,
                    slots = skeleton.slots,
                    ghs = _ts.ghs;
                
                ghs.pathsCurve.lineStyle(lineWidth,0xFF0000,1);
                ghs.pathsLine.lineStyle(lineWidth,0xFF00FF,1);

                for(let i=0,len=slots.length; i<len; i++){
                    let slot = slots[i];
                    if (!slot.bone.active){continue;};
                    let attachment = slot.getAttachment();
                    if(attachment instanceof PIXI.spine.core.PathAttachment){
                        let nn = attachment.worldVerticesLength,
                            world = new Float32Array(nn);
                        attachment.computeWorldVertices(slot, 0, nn, world, 0, 2);
                        let x1 = world[2],
                            y1 = world[3],
                            x2 = 0,
                            y2 = 0;
                        if(attachment.closed){
                            let cx1 = world[0],
                                cy1 = world[1],
                                cx2 = world[nn - 2],
                                cy2 = world[nn - 1];
                            x2 = world[nn - 4];
                            y2 = world[nn - 3];

                            // 曲线
                            ghs.pathsCurve.moveTo(x1,y1);
                            ghs.pathsCurve.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);

                            // 句柄
                            ghs.pathsLine.moveTo(x1,y1);
                            ghs.pathsLine.lineTo(cx1,cy1);
                            ghs.pathsLine.moveTo(x2,y2);
                            ghs.pathsLine.lineTo(cx2,cy2);
                        };
                        nn -= 4;
                        for (var ii = 4; ii < nn; ii += 6) {
                            var cx1 = world[ii], cy1 = world[ii + 1], cx2 = world[ii + 2], cy2 = world[ii + 3];
                            x2 = world[ii + 4];
                            y2 = world[ii + 5];
                            // 曲线
                            ghs.pathsCurve.moveTo(x1,y1);
                            ghs.pathsCurve.bezierCurveTo(cx1, cy1, cx2, cy2, x2, y2);

                            // 句柄
                            ghs.pathsLine.moveTo(x1,y1);
                            ghs.pathsLine.lineTo(cx1,cy1);
                            ghs.pathsLine.moveTo(x2,y2);
                            ghs.pathsLine.lineTo(cx2,cy2);
                            x1 = x2;
                            y1 = y2;
                        }
                    };        
                };
            }

            // 绘制骨骼
            drawBones(){
                const _ts = this,
                    lineWidth = _ts.lineWidth,
                    skeleton = _ts.skeleton,
                    skeletonX = skeleton.x,
                    skeletonY = skeleton.y,
                    bones = skeleton.bones,
                    ghs = _ts.ghs;

                ghs.skeletonXY.lineStyle(lineWidth, 0xFF0000, 1);

                for(let i=0,len=bones.length; i<len; i++){
                    let bone = bones[i],
                        boneLen = bone.data.length,
                        starX = skeletonX + bone.worldX,
                        starY = skeletonY + bone.worldY,
                        endX = skeletonX + boneLen * bone.matrix.a + bone.worldX,
                        endY = skeletonY + boneLen * bone.matrix.b + bone.worldY;
        
                    if(bone.data.name === 'root' || bone.parent === null){continue;};

                    // 三角形计算公式
                    // 面积 A=sqrt((a+b+c)*(-a+b+c)*(a-b+c)*(a+b-c))/4
                    // 阿尔法 alpha=acos((pow(b, 2)+pow(c, 2)-pow(a, 2))/(2*b*c))
                    // 贝塔 beta=acos((pow(a, 2)+pow(c, 2)-pow(b, 2))/(2*a*c))
                    // 伽马 gamma=acos((pow(a, 2)+pow(b, 2)-pow(c, 2))/(2*a*b))

                    let w = Math.abs(starX - endX),
                        h = Math.abs(starY - endY),
                        // a = w,                                              // 边长a
                        a2 = Math.pow(w,2),                                 // 边长a平方根
                        b = h,                                              // 边长b
                        b2 = Math.pow(h,2),                                 // 边长b平方根
                        c = Math.sqrt(a2 + b2),                             // 边长c
                        c2 = Math.pow(c,2),                                 // 边长c平方根
                        rad = Math.PI / 180,
                        // A = Math.acos([a2 + c2 - b2] / [2 * a * c]) || 0,   // A角角度
                        // C = Math.acos([a2 + b2 - c2] / [2 * a * b]) || 0,   // C角角度
                        B = Math.acos([c2 + b2 - a2] / [2 * b * c]) || 0;   // B角角度
                    if(c === 0){continue;};

                    let gp = new PIXI.Graphics();
                    ghs.bones.addChild(gp);
        
                    // 绘制骨骼线条
                    let refRation = c / 50 / _ts.scale;
                    gp.beginFill(0x00EECC,1);
                    gp.drawPolygon(
                        0,0,
                        0 - refRation, c - refRation * 3,
                        0, c - refRation,
                        0 + refRation, c - refRation * 3
                    );
                    gp.endFill();
                    gp.x = starX;
                    gp.y = starY;
                    gp.pivot.y = c;
                    
                    // 计算骨骼旋转角度
                    let rotation = 0;
                    if(starX < endX && starY < endY){                     // 右下
                        rotation = -B + 180 * rad;
                    }else if(starX > endX && starY < endY){               // 左下
                        rotation = 180 * rad + B;
                    }else if(starX > endX && starY > endY){               // 左上
                        rotation = -B;
                    }else if(starX < endX && starY > endY){               // 左下
                        rotation = B;
                    }else if(starY === endY && starX < endX){             // 向右
                        rotation = 90 * rad;
                    }else if(starY === endY && starX > endX){             // 向左
                        rotation = -90 * rad;
                    }else if(starX === endX && starY < endY){             // 向下
                        rotation = 180 * rad;
                    }else if(starX === endX && starY > endY){             // 向上
                        rotation = 0;
                    };
                    gp.rotation = rotation;
                    
                    // 绘制骨骼起始旋转点
                    gp.lineStyle(lineWidth + refRation / 2.4,0x00EECC,1)
                    gp.beginFill(0x000000,0.6);
                    gp.drawCircle(0,c,refRation * 1.2);
                    gp.endFill();
                };
        
                // 绘制骨架起点『X』形式
                let startDotSize = lineWidth * 3;
                ghs.skeletonXY.moveTo(skeletonX - startDotSize,skeletonY - startDotSize);
                ghs.skeletonXY.lineTo(skeletonX + startDotSize,skeletonY + startDotSize);
                ghs.skeletonXY.moveTo(skeletonX + startDotSize,skeletonY - startDotSize);
                ghs.skeletonXY.lineTo(skeletonX - startDotSize,skeletonY + startDotSize);
            }
        };
        
        const Spine = PIXI.spine.Spine,
            oldUpadte = Spine.prototype.update,
            drawDebug = function(){
                if(!this.drawDebug){
                    return;
                };
                if(!this.spineDebug){
                    this.spineDebug = new SpineDebug(this);
                };
                this.spineDebug.update();
            };
    
        Spine.prototype.updateMyDebugGraphics = drawDebug;
        Spine.prototype.update = function(dt){
            oldUpadte.call(this,dt);
            this.updateMyDebugGraphics();
        };
    };
})(PIXI);