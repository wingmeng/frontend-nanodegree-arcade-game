// 游戏图片资源列表
// 用以管理游戏图片素材
var imgAsset = {
    scenes: [  // 场景（按从上到下顺序）
        'images/water-block.png',   // 这一行是河。
        'images/stone-block.png',   // 第一行石头
        'images/stone-block.png',   // 第二行石头
        'images/stone-block.png',   // 第三行石头
        'images/grass-block.png',   // 第一行草地
        'images/grass-block.png'    // 第二行草地
    ],
    players: [  // 人物
        'images/char-boy.png',
        'images/char-cat-girl.png',
        'images/char-horn-girl.png',
        'images/char-pink-girl.png',
        'images/char-princess-girl.png'
    ],
	enemy: 'images/enemy-bug.png',  // 敌人
    rock: 'images/Rock.png'  // 石头（障碍物）
};

// 场景图片布局尺寸
var layoutSize = {
    width:     101,  // 图片素材宽度
    height:    171,  // 图片素材高度
    blankTop:  63,   // 顶部空白区域高度
	mainPart:  83,   // 图像主体高度（除上下透明区域外）
	corrected: 25,   // 玩家主体修正值（修正图片两侧的透明区域）,使得碰撞在视觉上更合理

    /* 获取主体元素(如player, enemy等）在当前行对应场景顶部的像素距离
     * @param {number} rowNum - 场景行数（第几行）1~6
     * @return {number} 距离场景顶部距离
     */
    getRowTop: function(rowNum) {
        rowNum = rowNum || 1;
        return this.mainPart * rowNum - this.blankTop - (this.height - this.blankTop) / 2;
    },

    /* 获取主体元素(如player, enemy等）在当前列对应场景左侧的像素距离
     * @param {number} colNum - 场景列数（第几列）1~5
     * @return {number} 距离场景左侧距离
     */
    getColLeft: function(colNum) {
        colNum = colNum || 1;
        return this.width * colNum - this.width;
    }
};

// 这是我们的玩家要躲避的敌人
var Enemy = function() {
    this.x = -layoutSize.width;  // 初始隐藏敌人
    this.y = layoutSize.getRowTop(getRandom(2, 4));  // 敌人的行范围（从第二行到第四行石头）
    this.speed = layoutSize.width * getRandom(2, 6);  // 敌人速度
    this.sprite = imgAsset.enemy;  // 敌人图片
};

/* 此为游戏必须的函数，用来更新敌人的位置
 * @param {number} dt - 时间间隙
 */
Enemy.prototype.update = function(dt) {
    // 你应该给每一次的移动都乘以 dt 参数，以此来保证游戏在所有的电脑上
    // 都是以同样的速度运行的
	if (player.colliding) {  // 触发碰撞中断
		return;
	}

    this.x += dt * this.speed;

    if (this.x > layoutSize.width * 5) {  // 超出视界
        this.x = -layoutSize.width;  // 隐藏到最左边
        this.y = layoutSize.getRowTop(getRandom(2, 4));  // 随机生成敌人范围（第2~4行）
        this.speed = layoutSize.width * getRandom(1, 6);  // 随机生成敌人速度
    }
};

// 此为游戏必须的函数，用来在屏幕上画出敌人，
Enemy.prototype.render = function() {
    ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
};

// 玩家类
var Player = function() {
    // 出生地
    this.x = layoutSize.getColLeft(3);  // 第3列
    this.y = layoutSize.getRowTop(6);  // 第6行

	this.sprite = imgAsset.players[2];
	this.colliding = false;  // 玩家是否处于碰撞状态
	this.life = 3;  // 生命，为0时 game over
	this.score = 0;  // 得分
};

// 更新玩家的位置
Player.prototype.update = function() {
	var self = this;

	// 碰撞检测
	if (!self.colliding) {
		for (var i = 0; i < allEnemies.length; i++) {
			var enemy = allEnemies[i];

			if (self.y === enemy.y) {  // 位于同一行
				var enemyX = Math.round(enemy.x);

				// 矩形检测
				if (enemyX + layoutSize.width > self.x + layoutSize.corrected
					&& self.x + layoutSize.width - layoutSize.corrected > enemyX) {
					self.colliding = true;
					ctx.canvas.classList.add('flashing');  // 闪烁提示（CSS3动画）
					self.life -= 1;

					if (self.life <= 0) {  // game over
						ctx.canvas.classList.remove('flashing');
					} else {
						setTimeout(function() {
							ctx.canvas.classList.remove('flashing');
							self.y = layoutSize.getRowTop(6);  // 回到初始位置
							self.colliding = false;
						}, 1000);
					}

					break;
				}
			}
		}
	}
};

// 绘制玩家
Player.prototype.render = function() {
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
    this.count();
};

// 统计信息（右上角）
Player.prototype.count = function() {
    var ftSize = 20,
        height = (layoutSize.blankTop - ftSize) / 2;

    // 清除上一次的统计信息    
    ctx.clearRect(0, 0, ctx.canvas.width, height);
    ctx.font = 'normal ' + ftSize + 'px Consolas';
    ctx.textAlign = 'end';
    ctx.fillStyle = '#333';

    // 统计文案
    var text = 'Score:' + this.score +
        '\u3000\u3000' +  // 两个全角空格
        'Life:' + this.life;

    ctx.fillText(text, ctx.canvas.width, height);
};

// 键盘控制玩家移动
Player.prototype.handleInput = function(direction) {
	var self = this;

	if (self.colliding) {
		return;
	}

    // 障碍物判断
    // 如位移方向的下一格存在障碍物，位移值返回0（无法移动）
    switch(direction) {
		case 'left':
            this.x -= allRocks.some(function(rock) {
                if (rock.y === self.y) {  // 同一行
                    return rock.x + layoutSize.width === self.x;
                }
            }) ? 0 : layoutSize.width;
            break;
        case 'right':
            this.x += allRocks.some(function(rock) {
                if (rock.y === self.y) {  // 同一行
                    return self.x + layoutSize.width === rock.x;
                }
            }) ? 0 : layoutSize.width;
            break;
        case 'up':
            this.y -= allRocks.some(function(rock) {
                if (rock.x === self.x) {  // 同一列
                    return rock.y + layoutSize.mainPart === self.y;
                }
            }) ? 0 : layoutSize.mainPart;
            break;
		case 'down':
            this.y += allRocks.some(function(rock) {
                if (rock.x === self.x) {  // 同一列
                    return self.y + layoutSize.mainPart === rock.y;
                }
            }) ? 0 : layoutSize.mainPart;
            break;
    }

    // 场景边界判断
    var lim_r = layoutSize.getColLeft(5),  // 场景最右侧
        lim_b = layoutSize.getRowTop(6);   // 场景最底部

    if (self.x < 0) {  // 超出左边界
        self.x = 0;
    } else if (self.x > lim_r) {  // 超出右边界
        self.x = lim_r;
	} else if (self.y < 0) {  // 超出顶边界（到达终点）
		self.colliding = true;
		ctx.canvas.classList.add('pulsing');
		self.score += 1;

		setTimeout(function() {
            // 清除画布顶部的玩家残影（画布透明导致）
			ctx.clearRect(0, 0, ctx.canvas.width, layoutSize.blankTop);
			self.colliding = false;
			ctx.canvas.classList.remove('pulsing');
			self.y = lim_b;
		}, 1000);
    } else if (self.y > lim_b) {  // 超出底边界
        self.y = lim_b;
	}
};

// 石头（障碍物）
var Rock = function() {
    var displayRow = [1, 5];  // 随机出现在第1行和第5行
    
	this.x = layoutSize.getColLeft(getRandom(1, 5));  // 随机1~5列
    this.y = layoutSize.getRowTop(displayRow[getRandom(0, 1)]);  // 第5行
    this.sprite = imgAsset.rock;
};

// 绘制障碍物
Rock.prototype.render = function() {
	ctx.drawImage(Resources.get(this.sprite), this.x, this.y);
}

var allEnemies = [];  // 所有的敌人
var player = new Player();  // 玩家
var allRocks = [];  // 石头（障碍物）

!function() {
	var enemyNum = 3;  // 敌人数量
	var rockNum = getRandom(1, 4);  // 障碍数量

    // 添加敌人
	for (var i = 0; i < enemyNum; i++) {
		allEnemies.push(new Enemy());
	}

    // 添加障碍物
	for (var i = 0; i < rockNum; i++) {
        var rock = new Rock();

		// 障碍物不能重叠
        if (rockNum > 1 && allRocks.length >= 1) {
            var hasOverlap = allRocks.some(function(item) {
                return item.x === rock.x;
            });

            if (hasOverlap) {  // 存在重叠
                i--;
                continue;
            }
        }

        allRocks.push(rock);
	}
}();

// 这段代码监听游戏玩家的键盘点击事件并且代表将按键的关键数字送到 Player.handleInput()
// 方法里面。
document.addEventListener('keyup', function(e) {
    var allowedKeys = {
        37: 'left',
        38: 'up',
        39: 'right',
        40: 'down'
    };

    player.handleInput(allowedKeys[e.keyCode]);
});

/* 获取指定范围的随机数
 * @param {number} min - 范围最小数
 * @param {number} max - 范围最大数
 * @return {number} 随机数
 */
function getRandom(min, max) {
    var range = max - min;
    return (Math.round(Math.random() * range) + min);
}